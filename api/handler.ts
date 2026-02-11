import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { registerPlatformRoutes } from "../server/platform-routes";
import { swaggerSpec } from "../server/swagger";
import swaggerUi from "swagger-ui-express";
import * as fs from "fs";
import * as path from "path";
import { securityHeaders, inputSanitizationMiddleware } from "../server/services/security";
import { monitoringMiddleware, getHealthMetrics, getRecentErrors, getErrorStats } from "../server/services/monitoring";

const app = express();

app.use((req, res, next) => {
  const origin = req.header("origin");
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
  }
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json({
  verify: (req: any, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: false }));
app.use(securityHeaders);
app.use(inputSanitizationMiddleware);
app.use(monitoringMiddleware);

let initPromise: Promise<void> | null = null;
let initialized = false;

function getInitPromise() {
  if (!initPromise) {
    initPromise = (async () => {
      await registerRoutes(app);

      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
      });

      initialized = true;
    })();
  }
  return initPromise;
}

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString(), ...getHealthMetrics() });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString(), ...getHealthMetrics() });
});

app.get("/api/health/errors", (_req, res) => { res.json(getRecentErrors()); });
app.get("/api/health/stats", (_req, res) => { res.json(getErrorStats()); });

app.get("/admin", (_req, res) => {
  const adminPath = path.resolve(process.cwd(), "server", "templates", "admin-dashboard.html");
  res.sendFile(adminPath);
});

app.get("/merchant", (_req, res) => {
  const merchantPath = path.resolve(process.cwd(), "server", "templates", "merchant-dashboard.html");
  res.sendFile(merchantPath);
});

app.get("/developers", (req, res) => {
  const devPortalPath = path.resolve(process.cwd(), "server", "templates", "developer-portal.html");
  let html = fs.readFileSync(devPortalPath, "utf-8");
  const forwardedProto = req.header("x-forwarded-proto") || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host") || req.get("host");
  const baseUrl = `${forwardedProto}://${forwardedHost}`;
  html = html.replace(/BASE_URL_PLACEHOLDER/g, baseUrl);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
});

app.get("/legal/tos", (_req, res) => {
  res.sendFile(path.resolve(process.cwd(), "server", "templates", "terms-of-service.html"));
});
app.get("/legal/privacy", (_req, res) => {
  res.sendFile(path.resolve(process.cwd(), "server", "templates", "privacy-policy.html"));
});
app.get("/legal/contractor", (_req, res) => {
  res.sendFile(path.resolve(process.cwd(), "server", "templates", "contractor-agreement.html"));
});

app.get("/widget.js", (_req, res) => {
  const widgetPath = path.resolve(process.cwd(), "server", "templates", "widget.js");
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.sendFile(widgetPath);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "CryptoEats API Docs",
}));

registerPlatformRoutes(app);

getInitPromise();

const handler = async (req: Request, res: Response) => {
  if (!initialized) await getInitPromise();
  app(req, res);
};

export default handler;
