# CryptoEats - Replit Agent Guide

## Overview

CryptoEats is a comprehensive food and alcohol delivery platform designed for the Miami market. It features a **Customer App** for browsing, ordering, and tracking deliveries, a **Driver App** for managing deliveries and earnings, and a **Backend API** handling authentication, order processing, and compliance. Key capabilities include age verification for alcohol, AI-powered sommelier recommendations, real-time tracking, driver-customer chat, and a tax engine compliant with Florida regulations. The project aims to provide a robust, compliance-aware delivery service, with future ambitions for an open platform allowing third-party integrations and white-label solutions.

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
- **Admin Dashboard**: Server-rendered HTML for managing platform operations.
- **Open Platform API**: Versioned REST API (v1) with API key authentication for external developers, featuring webhook engine, Swagger UI, and a developer portal.

### Production Services (`server/services/`)

- **Payments** (`payments.ts`): Stripe PaymentIntents with authorize-on-order, capture-on-delivery flow. Refunds and webhook handling.
- **Notifications** (`notifications.ts`): SendGrid email (HTML templates), Twilio SMS, Expo Push Notifications. Auto-dispatched on order status changes.
- **Uploads** (`uploads.ts`): Multipart file upload with category validation, size limits, MIME enforcement, local storage.
- **Tracking** (`tracking.ts`): Socket.IO GPS tracking with ETA calculation (Haversine), driver location broadcasting, location history.
- **Security** (`security.ts`): Helmet headers, XSS/SQL sanitization, adaptive rate limiting with burst detection.
- **Monitoring** (`monitoring.ts`): Sentry integration, health metrics (`/api/health`), error tracking, uptime monitoring.

### Database (PostgreSQL + Drizzle ORM)

- **ORM**: Drizzle ORM with PostgreSQL dialect. Schema defined in `shared/schema.ts`.
- **Connection**: `pg` Pool using `DATABASE_URL`.
- **Schema Design**: Comprehensive relational schema covering users, customers, drivers, restaurants, menu items, orders, chats, reviews, ID verifications, tax jurisdictions, compliance logs, API keys, webhooks, and white-label configurations.
- **Enums**: Extensive use of PostgreSQL enums for various statuses and roles.
- **Validation**: Zod schemas generated from Drizzle for shared client/server validation.

### Shared Code

- `shared/schema.ts`: Contains database schema definitions and Zod validation schemas, ensuring type safety across frontend and backend.

### Key Design Decisions

1.  **Monorepo Structure**: Facilitates shared schema and validation, reducing duplication.
2.  **File-based Routing**: Intuitive navigation mapping directly to URL paths.
3.  **Dark-Only Theme**: Targets a specific aesthetic.
4.  **Local Cart State**: Client-side cart operations for responsiveness, synced with backend.
5.  **Drizzle ORM**: Chosen for its lightweight nature, TypeScript inference, and SQL-like query building.
6.  **Socket.IO**: Powers real-time features like order tracking and chat.

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