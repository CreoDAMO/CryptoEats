import { Expo } from "expo-server-sdk";
import type { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";

const expo = new Expo();

const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";
const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

export function isSendGridConfigured(): boolean {
  return !!process.env.SENDGRID_API_KEY;
}

export function isTwilioConfigured(): boolean {
  return !!(process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE);
}

export function isPushConfigured(): boolean {
  return true;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from?: string
): Promise<{ success: boolean; messageId?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("[Email] SendGrid not configured, skipping email to:", to);
    return { success: false };
  }

  const senderEmail = from || process.env.SENDGRID_FROM_EMAIL || "noreply@cryptoeats.net";

  const response = await fetch(SENDGRID_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: senderEmail, name: "CryptoEats" },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Email] SendGrid error:", errorText);
    return { success: false };
  }

  const messageId = response.headers.get("x-message-id") || undefined;
  console.log(`[Email] Sent to ${to}: "${subject}"`);
  return { success: true, messageId };
}

export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: boolean; sid?: string }> {
  const sid = process.env.TWILIO_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE;

  if (!sid || !authToken || !fromPhone) {
    console.warn("[SMS] Twilio not configured, skipping SMS to:", to);
    return { success: false };
  }

  const url = `${TWILIO_API_BASE}/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${authToken}`).toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: fromPhone, Body: body }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[SMS] Twilio error:", errorText);
    return { success: false };
  }

  const data = await response.json() as any;
  console.log(`[SMS] Sent to ${to}: "${body.substring(0, 50)}..."`);
  return { success: true, sid: data.sid };
}

export async function sendPushNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
  const validTokens = tokens.filter(Expo.isExpoPushToken);
  if (validTokens.length === 0) {
    console.warn("[Push] No valid Expo push tokens provided");
    return { sent: 0, failed: 0 };
  }

  const messages: ExpoPushMessage[] = validTokens.map(token => ({
    to: token,
    sound: "default" as const,
    title,
    body,
    data: data || {},
    priority: "high" as const,
  }));

  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  let failed = 0;

  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (const ticket of tickets) {
        if ((ticket as any).status === "ok") sent++;
        else failed++;
      }
    } catch (err) {
      console.error("[Push] Error sending chunk:", err);
      failed += chunk.length;
    }
  }

  console.log(`[Push] Sent: ${sent}, Failed: ${failed}`);
  return { sent, failed };
}

export function buildOrderConfirmationEmail(orderId: string, total: string, restaurantName: string, items: any[]): string {
  const itemRows = items.map((item: any) =>
    `<tr><td style="padding:8px;border-bottom:1px solid #333;">${item.name || item.menuItem?.name}</td><td style="padding:8px;border-bottom:1px solid #333;text-align:center;">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #333;text-align:right;">$${(item.price || item.menuItem?.price || 0).toFixed(2)}</td></tr>`
  ).join("");

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#eee;padding:32px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#00d4aa;margin:0;font-size:28px;">CryptoEats</h1>
        <p style="color:#999;margin:4px 0;">Order Confirmed</p>
      </div>
      <div style="background:#16213e;padding:20px;border-radius:8px;margin-bottom:16px;">
        <h2 style="margin:0 0 4px;font-size:18px;color:#fff;">${restaurantName}</h2>
        <p style="margin:0;color:#999;font-size:14px;">Order #${orderId.substring(0, 8).toUpperCase()}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead><tr style="color:#999;font-size:13px;"><th style="text-align:left;padding:8px;">Item</th><th style="text-align:center;padding:8px;">Qty</th><th style="text-align:right;padding:8px;">Price</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="background:#16213e;padding:16px;border-radius:8px;text-align:right;">
        <p style="margin:0;font-size:20px;font-weight:bold;color:#00d4aa;">Total: $${total}</p>
      </div>
      <p style="text-align:center;color:#666;font-size:12px;margin-top:24px;">Thank you for your order! Track your delivery in the CryptoEats app.</p>
    </div>
  `;
}

export function buildOrderStatusEmail(orderId: string, status: string, driverName?: string): string {
  const statusMessages: Record<string, string> = {
    confirmed: "Your order has been confirmed and is being prepared.",
    preparing: "The restaurant is preparing your food.",
    ready: "Your order is ready for pickup!",
    picked_up: `${driverName || "Your driver"} has picked up your order and is on the way.`,
    delivered: "Your order has been delivered. Enjoy your meal!",
    cancelled: "Your order has been cancelled. A refund will be processed.",
  };

  const message = statusMessages[status] || `Order status updated to: ${status}`;

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#eee;padding:32px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#00d4aa;margin:0;font-size:28px;">CryptoEats</h1>
      </div>
      <div style="background:#16213e;padding:20px;border-radius:8px;text-align:center;">
        <p style="margin:0;color:#999;font-size:14px;">Order #${orderId.substring(0, 8).toUpperCase()}</p>
        <h2 style="margin:8px 0;font-size:22px;color:#fff;text-transform:capitalize;">${status.replace("_", " ")}</h2>
        <p style="margin:8px 0 0;color:#ccc;font-size:15px;">${message}</p>
      </div>
    </div>
  `;
}

export function buildOrderStatusSMS(orderId: string, status: string): string {
  const shortId = orderId.substring(0, 8).toUpperCase();
  const messages: Record<string, string> = {
    confirmed: `CryptoEats: Order #${shortId} confirmed! We're preparing your food.`,
    preparing: `CryptoEats: Order #${shortId} is being prepared.`,
    ready: `CryptoEats: Order #${shortId} is ready for pickup!`,
    picked_up: `CryptoEats: Your driver has your order #${shortId} and is on the way!`,
    delivered: `CryptoEats: Order #${shortId} delivered! Enjoy your meal.`,
    cancelled: `CryptoEats: Order #${shortId} has been cancelled.`,
  };
  return messages[status] || `CryptoEats: Order #${shortId} status: ${status}`;
}
