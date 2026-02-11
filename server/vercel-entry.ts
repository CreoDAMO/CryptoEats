import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerPlatformRoutes } from "./platform-routes";
import { swaggerSpec } from "./swagger";
import swaggerUi from "swagger-ui-express";
import * as fs from "fs";
import * as path from "path";
import { securityHeaders, inputSanitizationMiddleware } from "./services/security";
import { monitoringMiddleware, getHealthMetrics, getRecentErrors, getErrorStats } from "./services/monitoring";

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

const hasDatabaseUrl = !!process.env.DATABASE_URL;

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
  res.json({ status: hasDatabaseUrl ? "healthy" : "setup_required", database: hasDatabaseUrl, timestamp: new Date().toISOString(), ...getHealthMetrics() });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: hasDatabaseUrl ? "healthy" : "setup_required", database: hasDatabaseUrl, timestamp: new Date().toISOString(), ...getHealthMetrics() });
});

const setupPageHtml = `<!DOCTYPE html>
<html><head><title>CryptoEats - Setup Required</title>
<style>
body{font-family:system-ui,sans-serif;background:#0A0A0F;color:#E8E8F0;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
.card{max-width:600px;padding:40px;background:#14141F;border-radius:16px;border:1px solid #1E1E2E}
h1{color:#00D4AA;margin-bottom:8px}
.step{background:#1E1E2E;padding:16px;border-radius:8px;margin:12px 0;font-size:14px}
.step b{color:#00D4AA}
code{background:#0A0A0F;padding:2px 6px;border-radius:4px;font-size:13px}
a{color:#00D4AA}
</style></head><body>
<div class="card">
<h1>CryptoEats</h1>
<p>Your deployment is live, but a <b>PostgreSQL database</b> needs to be connected.</p>
<div class="step"><b>Option A: Neon (recommended, free tier)</b><br>
1. Sign up at <a href="https://neon.tech" target="_blank">neon.tech</a><br>
2. Create a project (choose US East for lowest latency)<br>
3. Copy the connection string from the dashboard<br>
4. In Vercel: Settings &rarr; Environment Variables &rarr; add <code>DATABASE_URL</code> with the connection string<br>
5. Redeploy</div>
<div class="step"><b>Option B: Supabase (free tier)</b><br>
1. Sign up at <a href="https://supabase.com" target="_blank">supabase.com</a><br>
2. Create a project &rarr; go to Settings &rarr; Database<br>
3. Copy the connection string (use "Transaction" mode)<br>
4. Add as <code>DATABASE_URL</code> in Vercel and redeploy</div>
<div class="step"><b>Option C: Any PostgreSQL provider</b><br>
Use any PostgreSQL database &mdash; set <code>DATABASE_URL</code> to:<br>
<code>postgresql://user:password@host:5432/dbname?sslmode=require</code></div>
<p style="font-size:13px;color:#888;margin-top:16px">After adding DATABASE_URL, redeploy from the Vercel dashboard. The database tables will be created automatically on first start.</p>
</div></body></html>`;

if (hasDatabaseUrl) {
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

  const landingPagePath = path.resolve(process.cwd(), "server", "templates", "landing-page.html");
  let landingPageTemplate = "";
  try {
    landingPageTemplate = fs.readFileSync(landingPagePath, "utf-8");
  } catch {
    landingPageTemplate = "<html><body><h1>CryptoEats</h1><p>Landing page template not found.</p></body></html>";
  }

  app.get("/", (req, res) => {
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      const manifestPath = path.resolve(process.cwd(), "public", "manifest.json");
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        res.json(manifest);
      } catch {
        res.json({ name: "CryptoEats", slug: "cryptoeats" });
      }
      return;
    }
    const forwardedProto = req.header("x-forwarded-proto") || req.protocol || "https";
    const forwardedHost = req.header("x-forwarded-host") || req.get("host");
    const baseUrl = `${forwardedProto}://${forwardedHost}`;
    const expsUrl = `${forwardedHost}`;
    const html = landingPageTemplate
      .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
      .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
      .replace(/APP_NAME_PLACEHOLDER/g, "CryptoEats");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).send(html);
  });

  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app.use("/public", express.static(path.resolve(process.cwd(), "public")));

  registerPlatformRoutes(app);
  getInitPromise();
} else {
  app.use((_req: Request, res: Response) => {
    res.status(503).send(setupPageHtml);
  });
}

const handler = async (req: Request, res: Response) => {
  if (hasDatabaseUrl && !initialized) await getInitPromise();
  app(req, res);
};

export default handler;
