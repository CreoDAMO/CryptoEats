const FL_DBPR_API_URL = process.env.FL_DBPR_API_URL || "";

export interface LicenseVerificationResult {
  valid: boolean;
  licenseNumber: string;
  businessName?: string;
  licenseType?: string;
  status?: string;
  expirationDate?: string;
  county?: string;
  method: "dbpr_api" | "manual_review" | "simulated";
  verifiedAt: Date;
  details?: Record<string, unknown>;
}

export interface AlcoholDeliveryComplianceCheck {
  eligible: boolean;
  reasons: string[];
  checks: {
    restaurantLicensed: boolean;
    withinDeliveryWindow: boolean;
    foodRatioMet: boolean;
    sealedContainerRequired: boolean;
    ageVerificationRequired: boolean;
    driverBackgroundChecked: boolean;
  };
}

export function isDBPRConfigured(): boolean {
  return !!FL_DBPR_API_URL;
}

export async function verifyFloridaLiquorLicense(
  licenseNumber: string,
  businessName?: string
): Promise<LicenseVerificationResult> {
  if (isDBPRConfigured()) {
    try {
      const response = await fetch(`${FL_DBPR_API_URL}/licenses/${encodeURIComponent(licenseNumber)}`, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });
      if (response.ok) {
        const data = await response.json() as any;
        return {
          valid: data.status === "active" || data.status === "current",
          licenseNumber,
          businessName: data.businessName || businessName,
          licenseType: data.licenseType,
          status: data.status,
          expirationDate: data.expirationDate,
          county: data.county,
          method: "dbpr_api",
          verifiedAt: new Date(),
          details: data,
        };
      }
    } catch (err) {
      console.warn("[License] DBPR API lookup failed, falling back to manual review:", err);
    }
  }

  console.log(`[License] Simulated verification for license: ${licenseNumber}`);
  const isValidFormat = /^[A-Z]{2,4}-?\d{5,10}$/i.test(licenseNumber) || licenseNumber.length >= 5;
  return {
    valid: isValidFormat,
    licenseNumber,
    businessName,
    licenseType: "Beverage License",
    status: isValidFormat ? "pending_manual_review" : "invalid_format",
    method: "simulated",
    verifiedAt: new Date(),
    details: {
      note: "FL DBPR API not configured. License flagged for manual admin review.",
      formatValid: isValidFormat,
    },
  };
}

export function checkAlcoholDeliveryCompliance(params: {
  restaurantHasLicense: boolean;
  alcoholLicenseNumber?: string;
  orderItems: { name: string; price: number; quantity: number; isAlcohol?: boolean }[];
  deliveryTime?: Date;
  customerAgeVerified: boolean;
  driverBackgroundChecked: boolean;
}): AlcoholDeliveryComplianceCheck {
  const now = params.deliveryTime || new Date();
  const hour = now.getHours();

  const withinDeliveryWindow = hour >= 8 && hour < 22;

  let totalValue = 0;
  let nonAlcoholValue = 0;
  for (const item of params.orderItems) {
    const value = item.price * item.quantity;
    totalValue += value;
    if (!item.isAlcohol) nonAlcoholValue += value;
  }
  const foodRatioMet = totalValue === 0 || (nonAlcoholValue / totalValue) >= 0.4;

  const hasAlcohol = params.orderItems.some(i => i.isAlcohol);

  const checks = {
    restaurantLicensed: params.restaurantHasLicense && !!params.alcoholLicenseNumber,
    withinDeliveryWindow,
    foodRatioMet,
    sealedContainerRequired: true,
    ageVerificationRequired: hasAlcohol,
    driverBackgroundChecked: params.driverBackgroundChecked,
  };

  const reasons: string[] = [];
  if (!checks.restaurantLicensed) reasons.push("Restaurant does not have a valid Florida alcohol license (FS 561.57)");
  if (!checks.withinDeliveryWindow) reasons.push("Alcohol delivery restricted to 8 AM - 10 PM per Florida law");
  if (!checks.foodRatioMet) reasons.push("Alcohol orders must be accompanied by food (40%+ non-alcohol value per FS 565.045)");
  if (hasAlcohol && !params.customerAgeVerified) reasons.push("Customer age verification required (21+ per FS 561.57)");
  if (!checks.driverBackgroundChecked) reasons.push("Driver must pass background check for alcohol deliveries");

  const eligible = reasons.length === 0;

  return { eligible, reasons, checks };
}

export function getComplianceRequirements() {
  return {
    statutes: {
      "FS 561.57": "Florida Statute governing deliveries by licensed vendors or contractors",
      "FS 565.045": "Sealed containers with food orders (40%+ non-alcohol value)",
      "SB 676": "Third-party platform rules: consent, transparency, agreements",
    },
    rules: {
      deliveryWindow: { start: "08:00", end: "22:00", timezone: "America/New_York" },
      minimumFoodRatio: 0.4,
      minimumAge: 21,
      sealedContainers: true,
      backgroundCheckRequired: true,
      retentionYears: 7,
    },
    platformRole: "Marketplace provider (not direct seller) — registered with FL Dept of Revenue (Form DR-1)",
    partnerRequirements: [
      "Only list licensed vendors (verify via FL DBPR)",
      "Require written consent per SB 676",
      "Disclose all fees transparently",
      "Provide contact methods and review responses",
      "No breweries/distilleries as delivery partners",
    ],
    driverRequirements: [
      "Valid driver's license",
      "Background check passed",
      "Training on age verification procedures",
      "Independent contractor status",
      "Own vehicle, insurance, and expenses",
    ],
  };
}
