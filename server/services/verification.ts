import { db } from "../db";
import { idVerifications, complianceLogs, customers, drivers } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { reportError } from "./monitoring";

const PERSONA_API_KEY = process.env.PERSONA_API_KEY;
const PERSONA_TEMPLATE_ALCOHOL = process.env.PERSONA_TEMPLATE_ALCOHOL || "tmpl_age21_alcohol";
const PERSONA_TEMPLATE_DRIVER = process.env.PERSONA_TEMPLATE_DRIVER || "tmpl_driver_background";
const CHECKR_API_KEY = process.env.CHECKR_API_KEY;

export function isPersonaConfigured(): boolean {
  return !!PERSONA_API_KEY;
}

export function isCheckrConfigured(): boolean {
  return !!CHECKR_API_KEY;
}

export interface VerificationFlowResult {
  flowUrl: string;
  inquiryId: string;
  templateId: string;
  referenceId: string;
}

export interface VerificationStatus {
  verified: boolean;
  status: "pending" | "passed" | "failed" | "expired" | "needs_review";
  method: string;
  verifiedAt?: Date;
  expiresAt?: Date;
  details?: Record<string, unknown>;
}

export async function startIdentityVerification(
  userId: string,
  type: "alcohol" | "driver",
  metadata?: Record<string, unknown>
): Promise<VerificationFlowResult> {
  const templateId = type === "alcohol" ? PERSONA_TEMPLATE_ALCOHOL : PERSONA_TEMPLATE_DRIVER;

  if (!PERSONA_API_KEY) {
    const mockInquiryId = `inq_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(complianceLogs).values({
      type: "license",
      entityId: userId,
      details: {
        verificationType: type,
        inquiryId: mockInquiryId,
        templateId,
        status: "initiated",
        ...metadata,
      },
      status: "pending",
    });

    return {
      flowUrl: `/verification/mock?inquiry=${mockInquiryId}&type=${type}`,
      inquiryId: mockInquiryId,
      templateId,
      referenceId: userId,
    };
  }

  try {
    const response = await fetch("https://withpersona.com/api/v1/inquiries", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERSONA_API_KEY}`,
        "Content-Type": "application/json",
        "Persona-Version": "2023-01-05",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            "inquiry-template-id": templateId,
            "reference-id": userId,
            "note": `CryptoEats ${type} verification`,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Persona API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as any;
    const inquiryId = result.data.id;
    const flowUrl = result.data.attributes?.["redirect-url"] || 
      `https://withpersona.com/verify?inquiry-id=${inquiryId}`;

    await db.insert(complianceLogs).values({
      type: "license",
      entityId: userId,
      details: {
        verificationType: type,
        inquiryId,
        templateId,
        status: "initiated",
        ...metadata,
      },
      status: "pending",
    });

    return {
      flowUrl,
      inquiryId,
      templateId,
      referenceId: userId,
    };
  } catch (error: any) {
    reportError(error, { service: "verification", action: "startIdentityVerification", userId, type });
    throw error;
  }
}

export async function handleVerificationWebhook(
  event: string,
  data: Record<string, any>
): Promise<{ processed: boolean; userId?: string; status?: string }> {
  try {
    const inquiryId = data.id || data.attributes?.["inquiry-id"];
    const referenceId = data.attributes?.["reference-id"] || data.referenceId;
    const templateId = data.attributes?.["inquiry-template-id"] || data.templateId;

    let verificationStatus: string;
    switch (event) {
      case "inquiry.completed":
      case "inquiry.approved":
      case "verification.passed":
        verificationStatus = "passed";
        break;
      case "inquiry.failed":
      case "verification.failed":
        verificationStatus = "failed";
        break;
      case "inquiry.expired":
        verificationStatus = "expired";
        break;
      case "inquiry.needs-review":
      case "inquiry.marked-for-review":
        verificationStatus = "needs_review";
        break;
      default:
        verificationStatus = "pending";
    }

    await db.insert(complianceLogs).values({
      type: "license",
      entityId: referenceId,
      details: {
        verificationType: templateId?.includes("driver") ? "driver" : "alcohol",
        inquiryId,
        templateId,
        event,
        webhookData: data,
        status: verificationStatus,
      },
      status: verificationStatus,
    });

    if (verificationStatus === "passed" && referenceId) {
      const isDriverVerification = templateId?.includes("driver");
      
      if (isDriverVerification) {
        const driver = await db.select().from(drivers).where(eq(drivers.userId, referenceId)).limit(1);
        if (driver.length > 0) {
          await db.update(drivers).set({
            backgroundCheckStatus: "passed",
          }).where(eq(drivers.userId, referenceId));

          if (CHECKR_API_KEY) {
            await initiateBackgroundCheck(referenceId, driver[0]);
          }
        }
      } else {
        const customer = await db.select().from(customers).where(eq(customers.userId, referenceId)).limit(1);
        if (customer.length > 0) {
          await db.update(customers).set({
            idVerified: true,
            idVerificationData: JSON.stringify({
              verifiedAt: new Date().toISOString(),
              inquiryId,
              method: "persona",
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            }),
          }).where(eq(customers.userId, referenceId));
        }
      }
    }

    return { processed: true, userId: referenceId, status: verificationStatus };
  } catch (error: any) {
    reportError(error, { service: "verification", action: "handleWebhook", event });
    return { processed: false };
  }
}

async function initiateBackgroundCheck(
  userId: string,
  driver: any
): Promise<void> {
  if (!CHECKR_API_KEY) return;

  try {
    const response = await fetch("https://api.checkr.com/v1/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(CHECKR_API_KEY + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        package: "driver_pro",
        work_locations: [{ state: "FL", city: "Miami" }],
        candidate: {
          first_name: driver.firstName,
          last_name: driver.lastName,
          email: driver.userId,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Checkr API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as any;

    await db.insert(complianceLogs).values({
      type: "insurance",
      entityId: userId,
      details: {
        verificationType: "background_check",
        provider: "checkr",
        invitationId: result.id,
        status: "initiated",
      },
      status: "pending",
    });
  } catch (error: any) {
    reportError(error, { service: "verification", action: "initiateBackgroundCheck", userId });
  }
}

export async function handleCheckrWebhook(
  event: string,
  data: Record<string, any>
): Promise<{ processed: boolean }> {
  try {
    const candidateId = data.candidate_id;
    const reportId = data.report_id;
    const status = data.status;

    let checkStatus: string;
    switch (event) {
      case "report.completed":
        checkStatus = status === "clear" ? "passed" : "failed";
        break;
      case "report.suspended":
        checkStatus = "needs_review";
        break;
      default:
        checkStatus = "pending";
    }

    await db.insert(complianceLogs).values({
      type: "insurance",
      entityId: candidateId,
      details: {
        verificationType: "background_check",
        provider: "checkr",
        reportId,
        event,
        status: checkStatus,
        webhookData: data,
      },
      status: checkStatus,
    });

    if (checkStatus === "passed") {
      await db.update(drivers).set({
        backgroundCheckStatus: "cleared",
      }).where(eq(drivers.userId, candidateId));
    } else if (checkStatus === "failed") {
      await db.update(drivers).set({
        backgroundCheckStatus: "failed",
      }).where(eq(drivers.userId, candidateId));
    }

    return { processed: true };
  } catch (error: any) {
    reportError(error, { service: "verification", action: "handleCheckrWebhook", event });
    return { processed: false };
  }
}

export async function getVerificationStatus(
  userId: string,
  type: "alcohol" | "driver"
): Promise<VerificationStatus> {
  if (type === "alcohol") {
    const customer = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);
    if (customer.length > 0 && customer[0].idVerified) {
      const verificationData = customer[0].idVerificationData 
        ? JSON.parse(customer[0].idVerificationData) 
        : {};
      
      if (verificationData.expiresAt && new Date(verificationData.expiresAt) < new Date()) {
        return { verified: false, status: "expired", method: "persona" };
      }

      return {
        verified: true,
        status: "passed",
        method: verificationData.method || "manual",
        verifiedAt: verificationData.verifiedAt ? new Date(verificationData.verifiedAt) : undefined,
        expiresAt: verificationData.expiresAt ? new Date(verificationData.expiresAt) : undefined,
      };
    }
    return { verified: false, status: "pending", method: "none" };
  }

  const driver = await db.select().from(drivers).where(eq(drivers.userId, userId)).limit(1);
  if (driver.length > 0) {
    const bgStatus = driver[0].backgroundCheckStatus || "pending";
    return {
      verified: bgStatus === "cleared" || bgStatus === "passed",
      status: bgStatus === "cleared" || bgStatus === "passed" ? "passed" : 
              bgStatus === "failed" ? "failed" : "pending",
      method: "checkr",
    };
  }
  return { verified: false, status: "pending", method: "none" };
}

export async function checkAlcoholEligibility(
  userId: string
): Promise<{ eligible: boolean; reason?: string; verificationRequired: boolean }> {
  const status = await getVerificationStatus(userId, "alcohol");

  if (status.verified && status.status === "passed") {
    return { eligible: true, verificationRequired: false };
  }

  if (status.status === "expired") {
    return { eligible: false, reason: "ID verification has expired. Please re-verify.", verificationRequired: true };
  }

  return { eligible: false, reason: "Age verification required for alcohol orders (21+)", verificationRequired: true };
}
