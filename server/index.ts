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
import { getUploadPath } from "./services/uploads";

const app = express();
const log = console.log;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origins = new Set<string>();

    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }

    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d: string) => {
        origins.add(`https://${d.trim()}`);
      });
    }

    const origin = req.header("origin");

    // Allow localhost origins for Expo web development (any port)
    const isLocalhost =
      origin?.startsWith("http://localhost:") ||
      origin?.startsWith("http://127.0.0.1:");

    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveExpoManifest(platform: string, res: Response) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );

  if (!fs.existsSync(manifestPath)) {
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
  }

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}

function configureStaticWeb(app: express.Application) {
  log("Serving web app from static-build");

  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app.use("/public", express.static(path.resolve(process.cwd(), "public")));
  app.use(express.static(path.resolve(process.cwd(), "static-build")));
  
  app.use((req: Request, res: Response) => {
    if (!req.path.startsWith("/api")) {
      const indexPath = path.resolve(process.cwd(), "static-build", "index.html");
      return res.sendFile(indexPath);
    }
    res.status(404).json({ error: "Not found" });
  });
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });
}

(async () => {
  app.use(securityHeaders());
  setupCors(app);
  setupBodyParsing(app);
  app.use(inputSanitizationMiddleware());
  app.use(monitoringMiddleware());
  setupRequestLogging(app);

  app.use("/uploads", express.static(getUploadPath()));

  app.get("/api/health", (_req, res) => {
    res.json(getHealthMetrics());
  });

  app.get("/api/health/errors", (_req, res) => {
    res.json(getRecentErrors(50));
  });

  app.get("/api/health/stats", (_req, res) => {
    res.json(getErrorStats());
  });

  app.get('/admin', (req, res) => {
    const adminPath = path.resolve(process.cwd(), 'server', 'templates', 'admin-dashboard.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(adminPath);
  });

  app.get('/merchant', (req, res) => {
    const merchantPath = path.resolve(process.cwd(), 'server', 'templates', 'merchant-dashboard.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(merchantPath);
  });

  app.get('/driver', (req, res) => {
    const driverPath = path.resolve(process.cwd(), 'server', 'templates', 'driver-dashboard.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(driverPath);
  });

  app.get('/developers', (req, res) => {
    const devPortalPath = path.resolve(process.cwd(), 'server', 'templates', 'developer-portal.html');
    let html = fs.readFileSync(devPortalPath, 'utf-8');
    const forwardedProto = req.header('x-forwarded-proto') || req.protocol || 'https';
    const forwardedHost = req.header('x-forwarded-host') || req.get('host');
    const baseUrl = `${forwardedProto}://${forwardedHost}`;
    html = html.replace(/BASE_URL_PLACEHOLDER/g, baseUrl);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  });

  app.get('/legal/tos', (_req, res) => {
    const tosPath = path.resolve(process.cwd(), 'server', 'templates', 'terms-of-service.html');
    res.sendFile(tosPath);
  });

  app.get('/legal/privacy', (_req, res) => {
    const privacyPath = path.resolve(process.cwd(), 'server', 'templates', 'privacy-policy.html');
    res.sendFile(privacyPath);
  });

  app.get('/legal/contractor', (_req, res) => {
    const contractorPath = path.resolve(process.cwd(), 'server', 'templates', 'contractor-agreement.html');
    res.sendFile(contractorPath);
  });

  app.get('/widget.js', (req, res) => {
    const widgetPath = path.resolve(process.cwd(), 'server', 'templates', 'widget.js');
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(widgetPath);
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CryptoEats API Docs',
  }));

  registerPlatformRoutes(app);
  const server = await registerRoutes(app);

  configureStaticWeb(app);
  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`express server serving on port ${port}`);
    },
  );
})();
