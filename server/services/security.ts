import type { Request, Response, NextFunction } from "express";

export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");

    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    res.removeHeader("X-Powered-By");
    next();
  };
}

const SUSPICIOUS_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /union\s+select/i,
  /;\s*drop\s+table/i,
  /--\s*$/,
  /\/\*[\s\S]*?\*\//,
  /exec\s*\(/i,
  /xp_cmdshell/i,
];

export function sanitizeInput(value: unknown): unknown {
  if (typeof value === "string") {
    let sanitized = value.trim();
    sanitized = sanitized.replace(/[<>]/g, "");
    return sanitized;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeInput);
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = sanitizeInput(val);
    }
    return result;
  }
  return value;
}

export function inputSanitizationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === "object") {
      const bodyStr = JSON.stringify(req.body);
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(bodyStr)) {
          console.warn(`[Security] Suspicious input detected from ${req.ip}: ${req.method} ${req.path}`);
          return res.status(400).json({ message: "Invalid input detected" });
        }
      }
    }

    if (req.query) {
      const queryStr = JSON.stringify(req.query);
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(queryStr)) {
          console.warn(`[Security] Suspicious query params from ${req.ip}: ${req.method} ${req.path}`);
          return res.status(400).json({ message: "Invalid input detected" });
        }
      }
    }

    next();
  };
}

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function adaptiveRateLimiter(options: {
  windowMs?: number;
  maxRequests?: number;
  burstMax?: number;
} = {}) {
  const { windowMs = 60000, maxRequests = 100, burstMax = 20 } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      res.setHeader("Retry-After", Math.ceil((record.resetTime - now) / 1000).toString());
      return res.status(429).json({
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) requestCounts.delete(key);
  }
}, 60000);
