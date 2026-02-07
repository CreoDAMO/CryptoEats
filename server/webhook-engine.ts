import crypto from "crypto";
import { platformStorage, signWebhookPayload } from "./platform-storage";

interface WebhookEvent {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export async function dispatchWebhookEvent(event: string, data: Record<string, unknown>): Promise<void> {
  try {
    const subscribedWebhooks = await platformStorage.getWebhooksForEvent(event);
    if (subscribedWebhooks.length === 0) return;

    const payload: WebhookEvent = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    const payloadStr = JSON.stringify(payload);

    for (const webhook of subscribedWebhooks) {
      deliverWebhook(webhook.id, webhook.url, webhook.secret, event, payload, payloadStr).catch(err => {
        console.error(`Webhook delivery failed for ${webhook.id}:`, err.message);
      });
    }
  } catch (err: any) {
    console.error("Error dispatching webhook event:", err.message);
  }
}

async function deliverWebhook(
  webhookId: string,
  url: string,
  secret: string,
  event: string,
  payload: WebhookEvent,
  payloadStr: string,
  attempt = 1,
  maxAttempts = 3,
): Promise<void> {
  const signature = signWebhookPayload(payloadStr, secret);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CryptoEats-Signature": `sha256=${signature}`,
        "X-CryptoEats-Event": event,
        "X-CryptoEats-Delivery": webhookId,
        "X-CryptoEats-Timestamp": payload.timestamp,
        "User-Agent": "CryptoEats-Webhook/1.0",
      },
      body: payloadStr,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseBody = await response.text().catch(() => "");
    const success = response.status >= 200 && response.status < 300;

    await platformStorage.createWebhookDelivery({
      webhookId,
      event,
      payload: payload as any,
      responseStatus: response.status,
      responseBody: responseBody.slice(0, 1000),
      success,
      attempts: attempt,
    });

    if (success) {
      await platformStorage.updateWebhook(webhookId, { failureCount: 0, lastDeliveredAt: new Date() });
    } else if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt) * 1000;
      setTimeout(() => deliverWebhook(webhookId, url, secret, event, payload, payloadStr, attempt + 1, maxAttempts), delay);
    } else {
      const webhook = await platformStorage.getWebhookById(webhookId);
      if (webhook) {
        const newFailCount = (webhook.failureCount || 0) + 1;
        await platformStorage.updateWebhook(webhookId, {
          failureCount: newFailCount,
          ...(newFailCount >= 10 ? { isActive: false } : {}),
        });
      }
    }
  } catch (err: any) {
    await platformStorage.createWebhookDelivery({
      webhookId,
      event,
      payload: payload as any,
      responseStatus: 0,
      responseBody: err.message,
      success: false,
      attempts: attempt,
    });

    if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt) * 1000;
      setTimeout(() => deliverWebhook(webhookId, url, secret, event, payload, payloadStr, attempt + 1, maxAttempts), delay);
    }
  }
}

export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = signWebhookPayload(payload, secret);
  const sig = signature.replace("sha256=", "");
  if (sig.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
