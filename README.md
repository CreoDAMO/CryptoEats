# CryptoEats

A full-stack food and alcohol delivery platform with crypto-native payments, regulatory compliance, and an open developer API. Built for Miami. Designed to scale.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Reference](#api-reference)
- [Open Platform](#open-platform)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Tech Stack](#tech-stack)

---

## Overview

CryptoEats combines a modern delivery app experience with blockchain payments on Base chain (Coinbase L2), automated Florida tax compliance, and a developer platform that turns the delivery system into open infrastructure any business can build on.

The platform consists of four integrated products:

- **Customer App** — Browse restaurants, order food and alcohol, track deliveries in real time, chat with drivers, earn NFT rewards
- **Driver App** — Accept deliveries, manage earnings, access support resources, complete age verification at drop-off
- **Backend API** — 190 REST endpoints for authentication, orders, payments, tax, compliance, blockchain, and platform operations
- **Open Platform** — Developer API with key management, webhooks, embeddable widgets, and white-label branding

---

## Features

### Customer Experience
- Restaurant browsing with cuisine filtering and search
- Full cart management with special instructions
- Real-time order tracking with animated status progression
- In-app chat between customer and driver
- AI Sommelier for wine and spirit recommendations
- Post-delivery ratings and reviews
- NFT collection and marketplace
- Crypto wallet with USDC payments
- Coinbase Onramp for fiat-to-crypto conversion
- Referral program
- Reorder from order history
- Help & Support center with FAQs and contact info
- Legal & Privacy links (opens backend-hosted legal pages)
- Notification settings with toggleable preferences and persistence

### Driver Experience
- Order queue with accept/decline
- Step-by-step delivery status progression
- Age verification workflow for alcohol deliveries
- Daily and weekly earnings breakdown
- Instant cashout and 1099 tax tracking
- Engagement tiers with positive reinforcement (no deactivation threats)
- Support hub: wellness checks, appeals, education, insurance uploads
- Contractor agreement management

### Authentication & User Management
- JWT-based authentication with bcrypt password hashing
- Dual-mode login/register screen with form validation
- Session persistence via AsyncStorage (auto-validates on app load)
- Profile page showing real user data from backend
- Admin and Merchant dashboard access from profile (opens in device browser)

### Compliance & Tax
- Florida sales tax: 7% Miami-Dade (6% state + 1% county surtax)
- SB 676 compliance: transparent pricing, digital agreements
- Alcohol delivery restricted to 8 AM – 10 PM
- Age verification (21+) with ID scan records
- Tax transaction logging and remittance simulation
- Timestamped compliance audit trail

### Blockchain
- Base chain integration (mainnet and Sepolia testnet)
- USDC escrow payments for orders
- NFT minting as delivery rewards
- Gasless transactions via Paymaster with contract allowlisting
- Paymaster error handling with exponential backoff
- Wallet balance display and transaction history

### Admin & Merchant Dashboards
- Admin dashboard with overview KPIs, orders table, restaurant cards, driver management, compliance logs, pilot budget tracker, and settings
- Merchant dashboard with restaurant selector, order management, menu grid, reviews with star ratings, analytics (revenue charts, popular items), and settings
- Both dashboards auto-refresh every 30 seconds with real-time data from dedicated API endpoints
- Custom CryptoEats logo branding in both dashboard sidebars

### Android Distribution (APK Sideloading)
- Independent APK distribution bypassing Play Store / App Store
- Production Android keystore (RSA 2048-bit, PKCS12, 27-year validity)
- EAS Build configuration with development, preview, and production profiles
- Signed APK builds with local credential management
- SHA-256 fingerprint for APK integrity verification
- Android package: `com.cryptoeats.app` with location, camera, and vibration permissions

### Open Platform
- API key management with four tiers (Free / Starter / Pro / Enterprise)
- Rate limiting: 1K to 1M requests per day depending on tier
- Permission-based access control (read, write, webhook, widget, admin, whitelabel)
- Webhook engine with 12 event types and HMAC-SHA256 signed payloads
- Inbound order reception from Shopify, WooCommerce, and Toast POS
- Embeddable ordering widget for external websites
- White-label branding (colors, logos, domains) for Pro/Enterprise
- Developer portal with SDK examples for Node.js, Python, and PHP
- Swagger UI for interactive API exploration
- Full audit logging of all API requests

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Expo (React Native)                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │ Customer   │  │ Driver     │  │ Shared     │             │
│  │ App        │  │ App        │  │ Components │             │
│  └─────┬──────┘  └─────┬──────┘  └────────────┘             │
│        │               │                                     │
│        └───────┬───────┘                                     │
│                │  React Query + REST API                      │
└────────────────┼─────────────────────────────────────────────┘
                 │
┌────────────────┼─────────────────────────────────────────────┐
│                │          Express.js Backend                  │
│  ┌─────────────┴──────────────┐  ┌─────────────────────────┐│
│  │ Core API (routes.ts)       │  │ Platform API (v1)       ││
│  │ 74 endpoints               │  │ 37 endpoints            ││
│  │ JWT Auth · Socket.IO       │  │ API Key Auth · Webhooks ││
│  └─────────────┬──────────────┘  └────────────┬────────────┘│
│                │                               │             │
│  ┌─────────────┴───────────────────────────────┴───────────┐│
│  │              Drizzle ORM · PostgreSQL                    ││
│  │              30+ tables · Zod validation                 ││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### Frontend

- **Framework:** Expo SDK 54 with expo-router (file-based routing)
- **Platforms:** iOS, Android, and Web from a single codebase
- **State:** React Context for cart/checkout, TanStack React Query for server state
- **Styling:** Dark theme, React Native StyleSheet, DM Sans typography
- **Real-Time:** Socket.IO client for order tracking and chat

### Backend

- **Framework:** Express.js v5 with TypeScript
- **Auth:** JWT (7-day expiry) with bcrypt password hashing
- **Real-Time:** Socket.IO for order tracking, chat, and push notifications
- **Rate Limiting:** express-rate-limit on auth routes, per-tier limits on platform API
- **Templates:** Server-rendered HTML for admin dashboard, merchant dashboard, developer portal

### Database

- **Engine:** PostgreSQL
- **ORM:** Drizzle ORM with PostgreSQL dialect
- **Schema:** 30+ tables defined in `shared/schema.ts`
- **Validation:** Zod schemas generated from Drizzle schema via `drizzle-zod`
- **Seeding:** 8 Miami restaurants, 50+ menu items, tax jurisdictions, delivery windows, bundles

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm

### Installation

```bash
# Install dependencies
npm install

# Copy environment file and fill in values
cp .env.example .env

# Push database schema
npm run db:push

# Seed the database (runs automatically on first server start)

# Start development servers
npm run server:dev   # Express backend on port 5000
npm run expo:dev     # Expo dev server on port 8081
```

### Running on Replit

The project is pre-configured for Replit. The database, environment variables, and workflows are set up automatically:

- **Start Backend** workflow runs `npm run server:dev`
- **Start Frontend** workflow runs `npm run expo:dev`

To test on a physical device, scan the QR code from Replit's URL bar menu using Expo Go.

---

## Environment Variables

See [`.env.example`](.env.example) for the complete list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | JWT signing secret |
| `EXPO_PUBLIC_DOMAIN` | Yes (mobile) | Domain for API communication from Expo client |
| `PORT` | No | Server port (default: 5000) |
| `API_PLAYGROUND_ENABLED` | No | Enable Swagger interactive playground |
| `WEBHOOK_SECRET` | No | HMAC-SHA256 signing key for outbound webhooks |
| `BASE_NETWORK` | No | Blockchain network: `mainnet` or `sepolia` |

---

## Database

### Schema Overview

The database contains 30+ tables organized into these domains:

**Users & Profiles**
- `users` — Base user table (customer, driver, admin, restaurant roles)
- `customers` — Taste preferences, dietary restrictions, saved addresses
- `drivers` — Vehicle info, insurance, status tracking

**Restaurants & Menu**
- `restaurants` — Listings with hours, alcohol license, approval status
- `menuItems` — Items with dietary tags, alcohol flag, pairing suggestions
- `bundles` — Dynamic bundle deals

**Orders & Delivery**
- `orders` — Full lifecycle tracking (pending → confirmed → preparing → picked_up → arriving → delivered)
- `chats` — Customer-driver messaging
- `reviews` — Ratings and reviews
- `deliveryWindows` — Time-based delivery restrictions

**Compliance & Tax**
- `taxJurisdictions` — Florida tax rules
- `taxTransactions` — Tax collection records
- `taxRemittances` — Remittance tracking
- `complianceLogs` — Audit trail
- `idVerifications` — Age verification records
- `digitalAgreements` — SB 676 compliance

**Driver Management**
- `driverStatusTable` — Engagement tiers and status
- `driverSupportLog` — Support interactions
- `driverEarnings` — Earnings and payout records

**Platform / Open API**
- `apiKeys` — Developer API keys (tier, permissions, rate limits)
- `webhooks` — Webhook subscriptions
- `webhookDeliveries` — Delivery attempt logs
- `integrationPartners` — External partner registrations
- `whiteLabelConfigs` — Branding configs for white-label partners
- `apiAuditLogs` — API request audit trail
- `inboundOrders` — Orders received from external systems

### Commands

```bash
npm run db:push    # Sync Drizzle schema to PostgreSQL
```

---

## API Reference

### Authentication

All core API endpoints use JWT Bearer token authentication:

```
Authorization: Bearer <token>
```

**Auth Endpoints:**
- `POST /api/auth/register` — Create account (email, password, role)
- `POST /api/auth/login` — Get JWT token

### Core Endpoints (74 routes)

| Category | Endpoints | Description |
|----------|-----------|-------------|
| Auth | `/api/auth/*` | Register, login |
| Restaurants | `/api/restaurants/*` | List, search, menu items |
| Orders | `/api/orders/*` | Create, update status, history |
| Cart | `/api/cart/*` | Add, remove, update items |
| Reviews | `/api/reviews/*` | Submit and read ratings |
| Chat | `/api/chat/*` | Customer-driver messaging |
| Drivers | `/api/drivers/*` | Status, earnings, support |
| Payments | `/api/payments/*` | Process, refund |
| Tax | `/api/tax/*` | Calculate, jurisdictions, remittance |
| Compliance | `/api/compliance/*` | Logs, agreements, verification |
| Admin | `/api/admin/*` | Dashboard data, management |
| Paymaster | `/api/paymaster/*` | Gas sponsorship, chain validation |
| Contracts | `/api/contracts/*` | Allowlist, escrow operations |
| NFT | `/api/nft/*` | Mint, collection, marketplace |
| Sommelier | `/api/sommelier/*` | AI wine/spirit recommendations |
| Referrals | `/api/referrals/*` | Code generation, redemption |

### Interactive Documentation

Visit `/api-docs` for the full Swagger UI with request/response schemas and a built-in test playground.

---

## Open Platform

The Open Platform turns CryptoEats into delivery infrastructure that external developers and businesses can build on.

### Quick Start

```bash
# 1. Register and get a JWT token
curl -X POST /api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"secret","firstName":"Dev","lastName":"User"}'

# 2. Create an API key
curl -X POST /api/developer/keys \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My App","tier":"starter"}'

# 3. Use the Platform API
curl /api/v1/restaurants \
  -H "X-API-Key: ce_pk_..."
```

### API Key Tiers

| Tier | Price | Rate Limit | Daily Limit | Permissions |
|------|-------|------------|-------------|-------------|
| Free | $0/mo | 100 req/min | 1,000/day | Read only |
| Starter | $99/mo | 500 req/min | 10,000/day | Read + Write |
| Pro | $499/mo | 2,000 req/min | 100,000/day | Read + Write + Webhooks + Widget |
| Enterprise | $2,499/mo | 10,000 req/min | 1,000,000/day | All permissions + White-label |

### Platform API Endpoints (37 routes)

| Category | Endpoints | Description |
|----------|-----------|-------------|
| Platform | `/api/v1/platform/status` | Health check and feature flags |
| Restaurants | `/api/v1/restaurants` | List and search restaurants |
| Orders | `/api/v1/orders` | Create and manage orders |
| Drivers | `/api/v1/drivers` | Available drivers and tracking |
| Tax | `/api/v1/tax/calculate` | Tax calculation |
| NFT | `/api/v1/nft/marketplace` | NFT marketplace data |
| Integrations | `/api/v1/integrations/*` | Inbound orders, POS sync |
| Usage | `/api/v1/usage` | API usage statistics |
| Widget | `/api/v1/widget/config` | Widget configuration |

### Webhooks

Subscribe to real-time events with HMAC-SHA256 signed payloads:

```bash
curl -X POST /api/developer/webhooks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-app.com/webhooks","events":["order.created","delivery.completed"]}'
```

**Available Events:**
`order.created` · `order.updated` · `order.cancelled` · `delivery.started` · `delivery.completed` · `payment.processed` · `payment.refunded` · `driver.assigned` · `driver.location` · `nft.minted` · `escrow.released` · `review.submitted`

### Embeddable Widget

Add CryptoEats ordering to any website:

```html
<div id="cryptoeats-widget" data-api-key="ce_pk_..."></div>
<script src="https://your-domain.com/widget.js"></script>
```

### Inbound Orders

Receive orders from external systems:

```bash
curl -X POST /api/v1/integrations/orders/inbound \
  -H "X-API-Key: ce_pk_..." \
  -H "X-API-Secret: ce_sk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "externalOrderId": "SHOP-12345",
    "source": "shopify",
    "customerName": "Jane Smith",
    "deliveryAddress": "456 Ocean Dr, Miami Beach, FL 33139",
    "items": [{"name": "Bread", "price": 12.99, "quantity": 1}],
    "subtotal": 12.99,
    "total": 17.98
  }'
```

### Developer Portal

Visit `/developers` for complete documentation including:
- Getting started guide
- SDK examples (Node.js, Python, PHP)
- Webhook integration guide
- Widget customization
- White-label setup
- Pricing and tier comparison

---

## Project Structure

```
cryptoeats/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Customer tab navigation
│   │   ├── index.tsx             #   Explore / Home
│   │   ├── orders.tsx            #   Order history
│   │   ├── cart.tsx              #   Shopping cart
│   │   └── profile.tsx           #   User profile + dashboard links
│   ├── driver/                   # Driver app tabs
│   │   ├── index.tsx             #   Available orders
│   │   ├── dashboard.tsx         #   Driver dashboard
│   │   ├── earnings.tsx          #   Earnings tracker
│   │   └── support.tsx           #   Support hub
│   ├── restaurant/[id].tsx       # Restaurant detail
│   ├── login.tsx                 # Auth screen (sign in / sign up)
│   ├── checkout.tsx              # Checkout flow
│   ├── tracking/[id].tsx         # Order tracking
│   ├── chat/[orderId].tsx        # Driver chat
│   ├── review/[orderId].tsx      # Rating/review
│   ├── sommelier.tsx             # AI recommendations
│   ├── wallet.tsx                # Crypto wallet
│   ├── buy-crypto.tsx            # Coinbase Onramp
│   ├── cash-out.tsx              # Coinbase Offramp
│   ├── nft-collection.tsx        # NFT collection
│   ├── marketplace.tsx           # NFT marketplace
│   ├── generate-nft.tsx          # AI NFT Studio
│   ├── help-support.tsx          # Help & Support center
│   ├── legal-privacy.tsx         # Legal & Privacy links
│   └── notification-settings.tsx # Notification preferences
├── assets/images/                # App icons and branding
│   ├── icon.png                 #   Main app icon (1024x1024)
│   ├── favicon.png              #   Web favicon (48x48)
│   ├── splash-icon.png          #   Splash screen logo
│   ├── android-icon-foreground.png # Adaptive icon foreground
│   └── android-icon-background.png # Adaptive icon background
├── components/                   # Shared React Native components
├── constants/                    # Theme colors, config
├── lib/                          # Client utilities
│   ├── auth-context.tsx         #   Auth state management (JWT, login, register, logout)
│   ├── cart-context.tsx         #   Cart state management
│   ├── query-client.ts         #   API client + React Query
│   └── data.ts                 #   Local data helpers
├── public/images/                # Static assets served by backend
│   └── logo.png                 #   Logo for admin/merchant dashboards
├── server/                       # Express.js backend
│   ├── index.ts                 #   Server entry point
│   ├── routes.ts                #   Core API routes (74 endpoints)
│   ├── platform-routes.ts       #   Platform API v1 (37 endpoints)
│   ├── storage.ts               #   Core data access layer
│   ├── platform-storage.ts      #   Platform data access layer
│   ├── webhook-engine.ts        #   Webhook delivery engine
│   ├── swagger.ts               #   OpenAPI spec generator
│   ├── db.ts                    #   Database connection
│   ├── seed.ts                  #   Database seeder
│   ├── services/                #   Production services
│   │   ├── payments.ts          #     Stripe PaymentIntents
│   │   ├── payment-router.ts    #     Multi-provider payment routing
│   │   ├── notifications.ts     #     SendGrid, Twilio, Expo Push
│   │   ├── uploads.ts           #     File upload with validation
│   │   ├── tracking.ts          #     GPS tracking with ETA
│   │   ├── security.ts          #     Helmet, XSS, rate limiting
│   │   ├── monitoring.ts        #     Sentry error tracking
│   │   ├── verification.ts      #     Persona + Checkr identity
│   │   ├── cache.ts             #     Redis with in-memory fallback
│   │   ├── cloud-storage.ts     #     AWS S3 with local fallback
│   │   ├── license-verification.ts #  FL liquor license verification
│   │   └── nft-ai.ts            #     AI NFT artwork generation
│   └── templates/               #   Server-rendered HTML
│       ├── landing-page.html    #     Public landing page
│       ├── admin-dashboard.html #     Admin dashboard
│       ├── merchant-dashboard.html #  Merchant dashboard
│       ├── developer-portal.html #    Developer docs
│       └── widget.js            #     Embeddable widget
├── docs/                         # Documentation
│   └── executive-summary/       #   Strategic documents
│       └── CryptoEats_EXECUTIVE_SUMMARY.md
├── shared/                       # Shared between frontend & backend
│   └── schema.ts                #   Drizzle schema + Zod validation
├── .env.example                  # Environment variable template
├── eas.json                      # EAS Build config (APK distribution)
├── credentials.json              # Android keystore credentials (git-ignored)
├── drizzle.config.ts             # Drizzle ORM configuration
├── app.json                      # Expo configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run expo:dev` | Start Expo dev server (port 8081) |
| `npm run server:dev` | Start Express dev server (port 5000) |
| `npm run expo:static:build` | Build Expo web app for production |
| `npm run server:build` | Bundle Express server with esbuild |
| `npm run server:prod` | Run production server |
| `npm run db:push` | Sync Drizzle schema to PostgreSQL |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend Framework | Expo SDK 54 (React Native) |
| Routing | expo-router v6 (file-based) |
| Server State | TanStack React Query |
| Client State | React Context + AsyncStorage |
| Animations | react-native-reanimated |
| Icons | @expo/vector-icons |
| Backend Framework | Express.js v5 |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Validation | Zod (via drizzle-zod) |
| Auth | JWT + bcryptjs |
| Real-Time | Socket.IO |
| Rate Limiting | express-rate-limit |
| API Docs | Swagger UI (swagger-ui-express) |
| Blockchain | Base chain (Coinbase L2) |
| AI | Google Gemini (via Replit AI Integrations) |
| Payments | Coinbase Commerce, Stripe, Adyen, GoDaddy, Square |
| Mobile Build | EAS Build (APK sideloading) |
| Typography | DM Sans (Google Fonts) |

---

## License

Private — All rights reserved.
