# CryptoEats — Executive Summary

**Date:** February 7, 2026
**Status:** Platform Complete — All Four Phases Delivered

---

## What We Built

CryptoEats is a **full-stack food and alcohol delivery platform** that merges the convenience of modern delivery apps with blockchain-native payments, compliance automation, and an open developer ecosystem. It is purpose-built for the Miami market and designed to scale into a delivery infrastructure layer that any business can plug into.

The platform ships as four tightly integrated products:

| Product | Description |
|---------|-------------|
| **Customer App** | Mobile-first ordering experience (iOS, Android, Web) with restaurant browsing, cart management, real-time tracking, and AI-powered recommendations |
| **Driver App** | Dedicated driver interface for accepting deliveries, tracking earnings, managing compliance, and accessing support — built on a "Human-First" policy with no punitive deactivation |
| **Backend API** | 111 REST endpoints powering authentication, order orchestration, tax collection, compliance logging, and real-time communication via WebSockets |
| **Open Platform** | Versioned developer API (v1) with API key management, webhooks, embeddable widgets, white-label branding, and bidirectional integrations for external systems |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Expo (React Native) — single codebase for iOS, Android, and Web |
| Backend | Express.js with TypeScript |
| Database | PostgreSQL via Drizzle ORM — 30+ tables, full relational schema |
| Real-Time | Socket.IO for order tracking, driver-customer chat, and push notifications |
| Auth | JWT with bcrypt password hashing, rate-limited login |
| Blockchain | Base chain (Coinbase L2) — escrow payments, NFT rewards, gasless transactions, USDC support |
| Documentation | Swagger/OpenAPI at `/api-docs`, developer portal at `/developers` |

---

## Phase-by-Phase Delivery

### Phase 1 — Core Platform
- Customer app with restaurant browsing, menu exploration, cart, and checkout
- Backend API with user auth, restaurant/menu CRUD, order management
- PostgreSQL database with 20+ tables seeded with 8 Miami restaurants and 50+ menu items
- Real-time order tracking with animated status progression
- Customer-driver in-app chat
- Rating and review system

### Phase 2 — Compliance & Tax Engine
- Florida tax engine: 7% Miami-Dade rate (6% state + 1% county surtax)
- SB 676 compliance: transparent pricing, digital agreements, restaurant response capability
- Age verification (21+) for alcohol orders with ID scan records
- Safe delivery windows: alcohol restricted to 8 AM – 10 PM
- Tax transaction logging and remittance simulation
- Compliance audit trail with timestamped logs

### Phase 3 — Blockchain & Crypto Payments
- Base chain integration (mainnet 8453 / Sepolia 84532)
- Escrow smart contract support for order payments
- NFT reward system with minting and marketplace browsing
- Coinbase Onramp for fiat-to-crypto conversion
- Gasless transactions via Paymaster with contract allowlisting
- Paymaster error classification with exponential backoff retry
- Crypto wallet management with balance display and transaction history

### Phase 4 — Open Platform ("The Delivery Layer")
- **API Key System** — Four tiers (Free, Starter, Pro, Enterprise) with rate limiting from 1K to 1M requests/day
- **Permission Model** — Granular access control (read, write, webhook, widget, admin, whitelabel)
- **Webhook Engine** — 12 event types, HMAC-SHA256 signed payloads, exponential backoff retry
- **Developer Portal** — Full documentation at `/developers` with SDK examples for Node.js, Python, and PHP
- **Swagger UI** — Interactive API explorer at `/api-docs`
- **Embeddable Widget** — Drop-in `<script>` tag that renders restaurant listings on any website
- **Bidirectional Integrations** — Inbound order reception from Shopify, WooCommerce, and Toast POS
- **White-Label Branding** — Custom colors, logos, and domains for Pro/Enterprise partners
- **Audit Logging** — Every API request logged with method, path, status code, response time, IP, and user agent

---

## Key Differentiators

1. **Crypto-Native Payments** — USDC escrow, gasless transactions, and NFT rewards on Base chain, not bolted-on as an afterthought but integrated into the core checkout flow.

2. **Regulatory Compliance Built In** — Florida tax calculations, SB 676 digital agreements, age verification, and alcohol delivery window enforcement are automated, not manual.

3. **Human-First Driver Policy** — No deactivation threats. Engagement tiers use positive language. Drivers have a dedicated support hub with wellness checks, appeals, education resources, and insurance uploads.

4. **Open Platform Architecture** — CryptoEats is not just an app — it is delivery infrastructure. Any business can integrate via API keys, receive orders through webhooks, or embed a white-labeled ordering widget on their own site.

5. **Full Vertical Integration** — Customer app, driver app, merchant tools, admin dashboard, tax engine, compliance system, and developer platform all live in one monorepo with shared TypeScript types and validation.

---

## By the Numbers

| Metric | Value |
|--------|-------|
| API Endpoints | 111 (74 core + 37 platform) |
| Database Tables | 30+ |
| Seeded Restaurants | 8 (Miami-based) |
| Seeded Menu Items | 50+ |
| Webhook Event Types | 12 |
| API Tier Levels | 4 (Free / Starter / Pro / Enterprise) |
| Platform SDK Languages | 3 (Node.js, Python, PHP) |
| Supported Integrations | 3 (Shopify, WooCommerce, Toast POS) |
| Frontend Screens | 15+ |
| Lines of Schema Code | 627 |
| Lines of Backend Code | ~4,100+ |

---

## What's Running

| URL | Purpose |
|-----|---------|
| `/` | Landing page |
| Port `8081` | Expo dev server (Customer & Driver apps) |
| `/admin` | Admin dashboard (compliance, orders, drivers, tax) |
| `/merchant` | Merchant dashboard |
| `/developers` | Developer portal with SDK docs and pricing |
| `/api-docs` | Swagger UI — interactive API explorer |
| `/widget.js` | Embeddable ordering widget |
| `/api/v1/*` | Platform API (requires API key) |

---

## Conclusion

CryptoEats is a production-ready delivery platform that combines consumer convenience, regulatory compliance, blockchain payments, and an open developer ecosystem into a single cohesive system. The four-phase build progressed from a core ordering app to a full infrastructure layer — "The Delivery Layer" — that positions CryptoEats not as a competitor to existing delivery apps, but as the rails they can build on.
