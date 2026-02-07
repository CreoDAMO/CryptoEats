import type { Request, Response, NextFunction } from "express";

interface ErrorReport {
  id: string;
  timestamp: string;
  level: "error" | "warn" | "info";
  message: string;
  stack?: string;
  context: Record<string, unknown>;
  userId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
}

interface HealthMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  activeConnections: number;
  lastErrors: ErrorReport[];
}

const errorLog: ErrorReport[] = [];
const MAX_ERROR_LOG = 500;
let requestCount = 0;
let errorCount = 0;
let totalResponseTime = 0;
let activeConnections = 0;
const startTime = Date.now();

export function reportError(
  error: Error | string,
  context: Record<string, unknown> = {},
  level: "error" | "warn" | "info" = "error"
) {
  const report: ErrorReport = {
    id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    level,
    message: typeof error === "string" ? error : error.message,
    stack: typeof error === "string" ? undefined : error.stack,
    context,
  };

  errorLog.unshift(report);
  if (errorLog.length > MAX_ERROR_LOG) errorLog.pop();

  if (level === "error") {
    errorCount++;
    console.error(`[Monitor] ${report.message}`, context);
  } else if (level === "warn") {
    console.warn(`[Monitor] ${report.message}`, context);
  }

  if (process.env.SENTRY_DSN) {
    sendToSentry(report).catch(() => {});
  }
}

async function sendToSentry(report: ErrorReport) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    const dsnParts = new URL(dsn);
    const projectId = dsnParts.pathname.replace("/", "");
    const publicKey = dsnParts.username;
    const host = dsnParts.host;

    const sentryUrl = `https://${host}/api/${projectId}/store/`;

    await fetch(sentryUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=cryptoeats/1.0, sentry_key=${publicKey}`,
      },
      body: JSON.stringify({
        event_id: report.id.replace(/[^a-f0-9]/g, "").substring(0, 32).padEnd(32, "0"),
        timestamp: report.timestamp,
        level: report.level,
        platform: "node",
        logger: "cryptoeats",
        message: { formatted: report.message },
        extra: report.context,
        exception: report.stack ? {
          values: [{
            type: "Error",
            value: report.message,
            stacktrace: { frames: parseStack(report.stack) },
          }],
        } : undefined,
      }),
    });
  } catch (err) {
    console.error("[Monitor] Failed to send to Sentry:", err);
  }
}

function parseStack(stack: string) {
  return stack.split("\n").slice(1).map(line => {
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      return { function: match[1], filename: match[2], lineno: parseInt(match[3]), colno: parseInt(match[4]) };
    }
    return { function: "?", filename: line.trim(), lineno: 0, colno: 0 };
  }).reverse();
}

export function monitoringMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    requestCount++;
    activeConnections++;
    const start = Date.now();

    res.on("finish", () => {
      activeConnections--;
      const duration = Date.now() - start;
      totalResponseTime += duration;

      if (res.statusCode >= 500) {
        reportError(`Server error: ${req.method} ${req.path} -> ${res.statusCode}`, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userAgent: req.headers["user-agent"],
          ip: req.ip,
        }, "error");
      } else if (res.statusCode >= 400) {
        reportError(`Client error: ${req.method} ${req.path} -> ${res.statusCode}`, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
        }, "warn");
      }

      if (duration > 5000) {
        reportError(`Slow request: ${req.method} ${req.path} took ${duration}ms`, {
          method: req.method,
          path: req.path,
          duration,
        }, "warn");
      }
    });

    next();
  };
}

export function getHealthMetrics(): HealthMetrics {
  return {
    uptime: (Date.now() - startTime) / 1000,
    memoryUsage: process.memoryUsage(),
    requestCount,
    errorCount,
    avgResponseTime: requestCount > 0 ? Math.round(totalResponseTime / requestCount) : 0,
    activeConnections,
    lastErrors: errorLog.slice(0, 20),
  };
}

export function getRecentErrors(limit: number = 50): ErrorReport[] {
  return errorLog.slice(0, limit);
}

export function getErrorStats() {
  const now = Date.now();
  const last5min = errorLog.filter(e => new Date(e.timestamp).getTime() > now - 5 * 60 * 1000);
  const lastHour = errorLog.filter(e => new Date(e.timestamp).getTime() > now - 60 * 60 * 1000);

  return {
    total: errorLog.length,
    last5min: last5min.length,
    lastHour: lastHour.length,
    byLevel: {
      error: errorLog.filter(e => e.level === "error").length,
      warn: errorLog.filter(e => e.level === "warn").length,
      info: errorLog.filter(e => e.level === "info").length,
    },
  };
}
