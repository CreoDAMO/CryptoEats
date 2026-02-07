# CryptoEats - Replit Agent Guide

## Overview

CryptoEats is a full-featured food and alcohol delivery platform built with Expo (React Native) for the frontend and Express.js for the backend, backed by PostgreSQL via Drizzle ORM. The app consists of three integrated parts: a **Customer App** (browse restaurants, order food/alcohol, track deliveries), a **Driver App** (accept deliveries, manage earnings, access support), and a **Backend API** (authentication, order management, tax calculations, compliance). The platform is Miami-focused with features like age verification for alcohol orders (21+), an AI sommelier for wine/spirit recommendations, real-time order tracking, driver-to-customer chat, and a compliance-aware tax engine for Florida regulations.

## Recent Changes

- **2026-02-07**: Full backend API implementation with PostgreSQL via Drizzle ORM
  - 50+ API endpoints for auth, restaurants, orders, drivers, payments, tax, admin, compliance
  - JWT authentication with bcryptjs password hashing and rate limiting
  - Socket.IO for real-time order tracking, chat, and notifications
  - Database seeded with 8 Miami restaurants, 50+ menu items, tax jurisdictions, delivery windows, bundles
  - Tax engine: 7% Miami-Dade rate (6% state + 1% local), transaction logging, remittance simulation
  - Human-first driver policy: engagement tiers, support logs, wellness checks, appeals, no-deactivation rules
  - Admin dashboard at /admin with restaurant/driver/order/tax/compliance management
- **2026-02-07**: Customer app feature completion
  - In-app chat with driver (chat/[orderId].tsx)
  - Rating & review screen with SB 676 restaurant response capability (review/[orderId].tsx)
  - Reorder from history, special instructions, referral codes
  - Safe delivery window enforcement for alcohol (8 AM - 10 PM)
  - Transparent SB 676-compliant pricing breakdown at checkout
- **2026-02-07**: Paymaster error handling and chain validation
  - Classified Paymaster errors (INTERNAL_ERROR, POLICY_REJECTED, GAS_ESTIMATION_FAILED, PAYMENT_REQUIRED, RATE_LIMITED, etc.) with user-friendly messages
  - Exponential backoff retry logic for transient blockchain errors (up to 3 retries)
  - Contract allowlist system for escrow, NFT, and USDC contracts with gas sponsorship tracking
  - Base chain ID validation (8453 mainnet, 84532 Sepolia) with network switching support
  - New API endpoints: /api/paymaster/status, /api/chain/validate, /api/contracts/allowlist, /api/contracts/check/:address, /api/gas/estimate, /api/escrow/release
  - Frontend error messages enhanced for wallet connection, crypto purchase, and gasless transaction failures
- **2026-02-07**: Driver app section built
  - 4-tab driver mode: Orders, Earnings, Dashboard, Support
  - Order accept/decline, status progression, age verification at delivery
  - Earnings tracker with daily/weekly breakdown, instant cashout, 1099 tracking
  - Human-first dashboard with positive language, engagement tiers, no deactivation warnings
  - Support hub: wellness checks, education, appeals, insurance upload, contractor agreement

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with expo-router for file-based routing. Runs on iOS, Android, and web.
- **Routing Structure**: File-based routing under `app/` directory using expo-router v6 with typed routes enabled.
  - `app/(tabs)/` — Main customer tab navigation (Explore, Orders, Cart, Profile)
  - `app/restaurant/[id].tsx` — Restaurant detail/menu screen
  - `app/checkout.tsx` — Checkout flow with tip selection, payment, age verification
  - `app/tracking/[id].tsx` — Real-time order tracking with animated status progression
  - `app/chat/[orderId].tsx` — Customer-driver messaging
  - `app/review/[orderId].tsx` — Post-delivery rating/review
  - `app/sommelier.tsx` — AI wine/spirit recommendation modal
  - `app/driver/` — Nested tab layout for driver mode (orders, dashboard, earnings, support)
- **State Management**: React Context (`CartProvider` in `lib/cart-context.tsx`) for cart, orders, and checkout state. TanStack React Query for server state management.
- **Styling**: Dark theme only (defined in `constants/colors.ts`), using React Native StyleSheet. DM Sans font family loaded via `@expo-google-fonts/dm-sans`.
- **Key Libraries**: expo-haptics for tactile feedback, expo-image for optimized images, expo-linear-gradient, react-native-gesture-handler, react-native-reanimated for animations, react-native-keyboard-controller, AsyncStorage for local persistence.
- **Data Layer**: Currently has a local mock data layer in `lib/data.ts` with hardcoded restaurants, menu items, and helper functions. The API client (`lib/query-client.ts`) is set up to communicate with the Express backend using `EXPO_PUBLIC_DOMAIN` environment variable.

### Backend (Express.js)

- **Framework**: Express v5 with TypeScript, compiled via `tsx` for dev and `esbuild` for production.
- **Entry Point**: `server/index.ts` sets up CORS (supporting Replit domains and localhost), JSON parsing, and serves static files.
- **Routes**: `server/routes.ts` — REST API with JWT authentication, rate limiting, Socket.IO for real-time features.
  - Auth endpoints (register, login) with bcryptjs password hashing
  - Order CRUD with validation using Zod schemas from shared schema
  - Rate limiting on auth routes (20 requests per 15 minutes)
- **Authentication**: JWT tokens with 7-day expiry, Bearer token scheme. Middleware extracts user info (id, email, role) from token.
- **Storage Layer**: `server/storage.ts` — Data access layer using Drizzle ORM queries with functions for users, customers, drivers, restaurants, orders, reviews, tax calculations, compliance logs, etc.
- **Database Seeding**: `server/seed.ts` seeds initial restaurant and menu data on first run.
- **Admin Dashboard**: Server-rendered HTML template at `server/templates/admin-dashboard.html` for compliance and management.

### Database (PostgreSQL + Drizzle ORM)

- **ORM**: Drizzle ORM with PostgreSQL dialect. Schema defined in `shared/schema.ts`, migrations output to `./migrations/`.
- **Connection**: `server/db.ts` uses `pg` Pool with `DATABASE_URL` environment variable.
- **Schema Design**: Comprehensive relational schema with these key tables:
  - `users` — Base user table with email, password hash, role enum (customer/driver/admin/restaurant)
  - `customers` — Customer profiles with taste preferences, dietary restrictions, saved addresses, favorites
  - `drivers` — Driver profiles with vehicle info, insurance, status tracking
  - `restaurants` — Restaurant listings with operating hours, alcohol license, approval status
  - `menuItems` — Menu items with dietary tags, alcohol flag, pairing suggestions
  - `orders` — Orders with status tracking (pending → confirmed → preparing → picked_up → arriving → delivered → cancelled)
  - `chats` — Customer-driver messaging
  - `reviews` — Order reviews/ratings
  - `idVerifications` — Age verification records for alcohol compliance
  - `taxJurisdictions` — Florida tax jurisdiction rules
  - `taxTransactions` / `taxRemittances` — Tax collection and remittance tracking
  - `driverStatusTable` / `driverSupportLog` / `driverEarnings` — Driver management ("Human-First" policy)
  - `complianceLogs` — Legal compliance audit trail
  - `deliveryWindows` — Time-based delivery restrictions (alcohol hours)
  - `referrals` — Referral program tracking
  - `digitalAgreements` — SB 676 compliance agreements
  - `bundles` — Dynamic bundle deals
- **Enums**: PostgreSQL enums for user roles, order status, payment status, tax status, driver status, engagement tiers, etc.
- **Validation**: Zod schemas generated from Drizzle schema using `drizzle-zod` for shared validation between client and server.
- **Push command**: Use `npm run db:push` (drizzle-kit push) to sync schema to database.

### Shared Code

- `shared/schema.ts` — Database schema definitions AND Zod validation schemas, shared between frontend and backend via path aliases (`@shared/*`).

### Build & Development

- **Dev Mode**: Two processes — `npm run expo:dev` for Expo dev server and `npm run server:dev` for Express backend.
- **Production Build**: `npm run expo:static:build` builds the Expo web app, `npm run server:build` bundles the server with esbuild, `npm run server:prod` runs the production server.
- **Replit Integration**: Uses Replit-specific environment variables (`REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS`, `REPLIT_INTERNAL_APP_DOMAIN`) for CORS and domain configuration.
- **Patch-package**: `postinstall` runs patch-package for any dependency patches.

### Key Design Decisions

1. **Monorepo structure** — Frontend and backend share the same repo with shared schema/validation code, reducing duplication and ensuring type safety across the stack.
2. **File-based routing with expo-router** — Enables intuitive navigation structure that maps directly to URL paths, supporting deep linking.
3. **Dark-only theme** — Simplified theming with a single dark color palette targeting the crypto/premium aesthetic.
4. **Local cart state with Context** — Cart operations happen client-side for responsiveness; orders are persisted to AsyncStorage and synced with the backend.
5. **Drizzle over Prisma** — Lighter weight ORM with better TypeScript inference and SQL-like query building.
6. **Socket.IO for real-time** — Used for live order tracking and customer-driver chat.

## External Dependencies

- **PostgreSQL** — Primary database, connected via `DATABASE_URL` environment variable. Required for all backend operations.
- **Socket.IO** — Real-time WebSocket communication for order tracking and chat.
- **JWT (jsonwebtoken)** — Token-based authentication with `SESSION_SECRET` environment variable.
- **bcryptjs** — Password hashing for user authentication.
- **expo-crypto** — Cryptographic operations on the client side (UUID generation, etc.).
- **TanStack React Query** — Server state caching and synchronization on the frontend.
- **AsyncStorage** — Local persistence for cart data, user preferences, and order history on the client.
- **Google Fonts (DM Sans)** — Typography loaded via `@expo-google-fonts/dm-sans`.
- **Unsplash** — Restaurant images sourced from Unsplash URLs in seed data.
- **express-rate-limit** — API rate limiting for auth endpoints.

### Environment Variables Required

- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — JWT signing secret (falls back to default if not set)
- `EXPO_PUBLIC_DOMAIN` — Domain for API communication from the Expo client
- `REPLIT_DEV_DOMAIN` — Replit development domain (auto-set by Replit)