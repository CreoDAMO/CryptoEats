# CryptoEats - Replit Agent Guide

## Overview

CryptoEats is a comprehensive food and alcohol delivery platform designed for the Miami market. It features a **Customer App** for browsing, ordering, and tracking deliveries, a **Driver App** for managing deliveries and earnings, and a **Backend API** handling authentication, order processing, and compliance. Key capabilities include age verification for alcohol, AI-powered sommelier recommendations, real-time tracking, driver-customer chat, and a tax engine compliant with Florida regulations. The project aims to provide a robust, compliance-aware delivery service, with future ambitions for an open platform allowing third-party integrations and white-label solutions.

## Recent Changes

- **Feb 10, 2026**: Updated logo and favicon across app icon, splash screen, login screen, admin dashboard, and merchant dashboard with custom CryptoEats branding (pizza-crypto fusion design)
- **Feb 10, 2026**: Set up Android APK distribution infrastructure — production keystore (RSA 2048-bit, PKCS12, 27-year validity), EAS Build config (`eas.json`), credentials management (`credentials.json`, git-ignored), Android package `com.cryptoeats.app`
- **Feb 10, 2026**: Added Management section to Profile page with links to Admin and Merchant dashboards (opens in device browser)
- **Feb 10, 2026**: Added three support screens — Help & Support (FAQs, contact info), Legal & Privacy (WebBrowser links), Notification Settings (toggleable with AsyncStorage persistence)
- **Feb 10, 2026**: Implemented full authentication system — JWT login/register, dual-mode auth screen, AsyncStorage session persistence, profile page with real backend user data
- **Feb 11, 2026**: Secured admin and merchant dashboards with production-ready authentication — login screens with JWT flow, role-based middleware (adminMiddleware, merchantMiddleware), all admin/merchant API endpoints secured, default admin user seeded (admin@cryptoeats.net), merchant-accessible restaurant list endpoint, JWT secret enforced in production
- **Feb 11, 2026**: Added password reset (forgot password) flow — 6-digit email code, 15-min expiry, password_reset_tokens table, integrated into mobile app login screen and both dashboard login screens

## Future Features (Planned)

- **Social Login**: Google, Facebook, X (Twitter), LinkedIn authentication

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with `expo-router` for file-based routing across iOS, Android, and web.
- **Routing Structure**: File-based routing (`app/` directory) with nested tabs for customer and driver modes.
- **State Management**: React Context for local cart/order state and TanStack React Query for server state.
- **Styling**: Dark theme only, utilizing React Native StyleSheet and DM Sans font.
- **Key Libraries**: `expo-haptics`, `expo-image`, `react-native-reanimated`.
- **Data Layer**: API client configured to communicate with the Express backend using environment variables; initially includes mock data.

### Backend (Express.js)

- **Framework**: Express v5 with TypeScript, compiled using `tsx` (dev) and `esbuild` (prod).
- **Entry Point**: `server/index.ts` handles CORS, JSON parsing, and static file serving.
- **Routes**: REST API with JWT authentication, rate limiting, and Socket.IO for real-time features. Includes comprehensive endpoints for auth, orders, drivers, payments, tax, admin, and compliance.
- **Authentication**: JWT tokens with bcryptjs for password hashing.
- **Storage Layer**: Drizzle ORM for data access, with functions for all major entities.
- **Database Seeding**: `server/seed.ts` populates initial data.
- **Admin Dashboard** (`/admin`): Full-featured server-rendered HTML dashboard with Overview KPIs, Orders table, Restaurants cards, Drivers table, Compliance logs, Pilot Budget tracker ($19,745 breakdown), and Settings (service status). Auto-refreshes every 30s. Fetches from `/api/admin/stats`, `/api/admin/orders`, `/api/admin/restaurants`, `/api/admin/drivers`.
- **Merchant Dashboard** (`/merchant`): Restaurant-specific dashboard with restaurant selector, Overview KPIs, Orders management, Menu grid, Reviews with star ratings, Analytics (revenue charts, popular items), and Settings. Fetches from `/api/merchant/stats/:restaurantId`.
- **Vercel Deployment**: Configured via `vercel.json` + `api/index.ts` serverless adapter for Express. Routes all paths to the serverless function.
- **Open Platform API**: Versioned REST API (v1) with API key authentication for external developers, featuring webhook engine, Swagger UI, and a developer portal.

### Production Services (`server/services/`)

- **Payments** (`payments.ts`): Stripe PaymentIntents with authorize-on-order, capture-on-delivery flow. Refunds and webhook handling.
- **Payment Router** (`payment-router.ts`): Multi-provider payment routing with Stripe, Adyen, GoDaddy, Square, and Coinbase Commerce. Smart routing logic (crypto→Coinbase, international→Adyen, in-person→GoDaddy, POS→Square, default→Stripe). Automatic fallback chain when providers are unconfigured. Fee comparison API, provider status monitoring, admin routing config, and provider-specific webhook/dispute handling.
- **Notifications** (`notifications.ts`): SendGrid email (HTML templates), Twilio SMS, Expo Push Notifications. Auto-dispatched on order status changes.
- **Uploads** (`uploads.ts`): Multipart file upload with category validation, size limits, MIME enforcement, local storage.
- **Tracking** (`tracking.ts`): Socket.IO GPS tracking with ETA calculation (Haversine), driver location broadcasting, location history.
- **Security** (`security.ts`): Helmet headers, XSS/SQL sanitization, adaptive rate limiting with burst detection.
- **Monitoring** (`monitoring.ts`): Sentry integration with performance tracing (transactions/spans), health metrics (`/api/health`), error tracking, uptime monitoring.
- **Verification** (`verification.ts`): Persona API for identity/age verification (21+ alcohol), Checkr API for driver background checks. Webhook handlers for async status updates. Smart fallback to simulated verification when no API keys configured.
- **Cache** (`cache.ts`): Redis caching service with automatic in-memory fallback. Restaurant list cached 10min, menu items cached 30min. Cache invalidation endpoints available. Stats tracking for hits/misses.
- **Cloud Storage** (`cloud-storage.ts`): AWS S3 upload/download/delete with presigned URL generation. Automatic local filesystem fallback when S3 not configured. Multi-category file support.
- **License Verification** (`license-verification.ts`): Florida DBPR liquor license lookup with simulation fallback. Auto-runs during restaurant onboarding when alcohol license is provided. Stores results in `license_verifications` table.
- **Legal Documents**: Server-rendered HTML pages at `/legal/tos`, `/legal/privacy`, `/legal/contractor`. Digital agreement acceptance tracked in `legal_agreements` table.
- **Compliance**: Alcohol delivery compliance (FL FS 561.57, FS 565.045, SB 676). 8AM-10PM delivery window, 40% food ratio, sealed container requirements. PCI SAQ-A compliance via Stripe Elements.

### Database (PostgreSQL + Drizzle ORM)

- **ORM**: Drizzle ORM with PostgreSQL dialect. Schema defined in `shared/schema.ts`.
- **Connection**: `pg` Pool using `DATABASE_URL` with optimized pooling (max 20 connections, idle timeout 30s, connection timeout 10s).
- **Schema Design**: Comprehensive relational schema covering users, customers, drivers, restaurants, menu items, orders, chats, reviews, ID verifications, tax jurisdictions, compliance logs, API keys, webhooks, white-label configurations, legal agreements, and license verifications.
- **Indexes**: 19 performance indexes across 6 hot tables (orders, menu_items, users, customers, drivers, chats, compliance_logs) for optimized query performance.
- **Enums**: Extensive use of PostgreSQL enums for various statuses and roles.
- **Validation**: Zod schemas generated from Drizzle for shared client/server validation.

### Shared Code

- `shared/schema.ts`: Contains database schema definitions and Zod validation schemas, ensuring type safety across frontend and backend.

### Key Design Decisions

1.  **Monorepo Structure**: Facilitates shared schema and validation, reducing duplication.
2.  **File-based Routing**: Intuitive navigation mapping directly to URL paths.
3.  **Dark-Only Theme**: Targets a specific aesthetic (#0A0A0F background, #14141F surface, #00D4AA accent).
4.  **Local Cart State**: Client-side cart operations for responsiveness, synced with backend.
5.  **Drizzle ORM**: Chosen for its lightweight nature, TypeScript inference, and SQL-like query building.
6.  **Socket.IO**: Powers real-time features like order tracking and chat.
7.  **Independent APK Distribution**: Bypasses Play Store/App Store via sideloading with signed APK builds (EAS Build + local keystore).
8.  **Auth via AuthContext**: JWT stored in AsyncStorage, auto-validates on app load via `/api/customers/profile`. Wraps entire app in `AuthProvider`.

## External Dependencies

-   **PostgreSQL**: Primary database for all backend operations.
-   **Socket.IO**: Real-time WebSocket communication.
-   **jsonwebtoken (JWT)**: Token-based authentication.
-   **bcryptjs**: Password hashing.
-   **expo-crypto**: Client-side cryptographic operations.
-   **TanStack React Query**: Frontend server state management.
-   **AsyncStorage**: Client-side local data persistence.
-   **Google Fonts**: DM Sans typography.
-   **Unsplash**: Image sourcing for seed data.
-   **express-rate-limit**: API rate limiting.