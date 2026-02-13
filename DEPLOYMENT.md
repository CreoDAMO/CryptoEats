# CryptoEats Deployment Guide

This guide covers deploying CryptoEats on multiple platforms. The application consists of an Express.js backend with PostgreSQL and an Expo React Native frontend.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Vercel (Current Setup)](#vercel)
4. [Railway](#railway)
5. [Render](#render)
6. [Fly.io](#flyio)
7. [DigitalOcean App Platform](#digitalocean-app-platform)
8. [AWS Amplify + Elastic Beanstalk](#aws)
9. [Google Cloud Run](#google-cloud-run)
10. [Heroku](#heroku)
11. [Replit](#replit)
12. [Self-Hosted (VPS / Coolify)](#self-hosted)
13. [Mobile App Distribution](#mobile-app-distribution)
14. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

- **Node.js 20+** (22.x recommended)
- **PostgreSQL 15+** database (Neon, Supabase, or any provider)
- **Git** repository (GitHub recommended for auto-deploy integrations)
- **Domain name** (optional, e.g., cryptoeats.net)

## Environment Variables

All platforms require these environment variables. Only `DATABASE_URL` is required to start. The rest enable optional features.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname?sslmode=require` |

### Optional (Production Features)

| Variable | Description | Used For |
|----------|-------------|----------|
| `SESSION_SECRET` | JWT signing secret (random 64+ char string) | Authentication |
| `STRIPE_SECRET_KEY` | Stripe API secret key | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Payment webhooks |
| `SENDGRID_API_KEY` | SendGrid API key | Email notifications |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | SMS notifications |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | SMS notifications |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | SMS sender |
| `EXPO_ACCESS_TOKEN` | Expo push notification token | Push notifications |
| `PERSONA_API_KEY` | Persona API key | ID/age verification |
| `CHECKR_API_KEY` | Checkr API key | Driver background checks |
| `SENTRY_DSN` | Sentry error tracking DSN | Error monitoring |
| `REDIS_URL` | Redis connection string | Caching (falls back to in-memory) |
| `AWS_ACCESS_KEY_ID` | AWS access key | S3 file storage |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | S3 file storage |
| `AWS_S3_BUCKET` | S3 bucket name | S3 file storage |
| `COINBASE_COMMERCE_API_KEY` | Coinbase Commerce key | Crypto payments |
| `ADYEN_API_KEY` | Adyen API key | International payments |
| `SQUARE_ACCESS_TOKEN` | Square access token | POS payments |

---

## Vercel

**Type:** Serverless functions
**Best for:** Simple deployments with automatic scaling
**Limitations:** 300-second function timeout, cold starts, read-only filesystem

### Setup

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com) and import your GitHub repository
   - Framework Preset: select "Other"

2. **Configuration** (already included in repo)
   - `vercel.json` — routes all requests to the serverless function
   - `scripts/vercel-build.js` — builds the API, runs migrations and seed
   - `server/vercel-entry.ts` — serverless-compatible Express entry point

3. **Environment Variables**
   - Go to Settings → Environment Variables
   - Add `DATABASE_URL` (required)
   - Add any optional variables from the table above

4. **Deploy**
   ```bash
   # Automatic: push to GitHub, Vercel deploys automatically
   git push origin main

   # Manual: using Vercel CLI
   npx vercel --prod
   ```

5. **Custom Domain**
   - Go to Settings → Domains
   - Add your domain and configure DNS records as shown

### Important Notes
- Database migrations and seeding run during the build step (not at runtime)
- File uploads use `/tmp` directory (temporary, cleared between invocations)
- Disable Deployment Protection for production: Settings → Deployment Protection → Standard Protection
- The entry point is `server/vercel-entry.ts`, not `server/index.ts`

---

## Railway

**Type:** Persistent server (always-on)
**Best for:** Full-stack apps, no cold starts, built-in database
**Free tier:** $5/month credit on Hobby plan

### Setup

1. **Create Project**
   - Go to [railway.app](https://railway.app) and create a new project
   - Choose "Deploy from GitHub repo" and select your repository

2. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway automatically creates `DATABASE_URL` and connects it to your service

3. **Configure Service**
   - Build Command: `npm install && npm run server:build`
   - Start Command: `npm run server:prod`
   - Or alternatively, Start Command: `NODE_ENV=production npx tsx server/index.ts`

4. **Environment Variables**
   - `DATABASE_URL` is set automatically if you added Railway PostgreSQL
   - Add any optional variables under the Variables tab

5. **Custom Domain**
   - Go to your service → Settings → Networking → Custom Domain
   - Add your domain and configure DNS

### Why Railway Works Well
- No cold starts — server runs continuously
- Built-in PostgreSQL — no external database needed
- Auto-deploys from GitHub on every push
- WebSocket support for real-time tracking and chat
- Persistent filesystem for file uploads

---

## Render

**Type:** Persistent server or static site
**Best for:** Simple setup, free tier available, managed databases
**Free tier:** 750 hours/month for web services (spins down after inactivity)

### Setup

1. **Create Web Service**
   - Go to [render.com](https://render.com) and click "New" → "Web Service"
   - Connect your GitHub repository
   - Environment: Node
   - Build Command: `npm install && npm run server:build`
   - Start Command: `npm run server:prod`
   - **Environment Variables:** Add `PORT=5000` (Render needs to know which port to proxy)

2. **Add PostgreSQL**
   - Click "New" → "PostgreSQL"
   - Copy the Internal Database URL
   - Add as `DATABASE_URL` in your web service environment variables

3. **Environment Variables**
   - Add `DATABASE_URL` (from step 2)
   - Add `NODE_ENV=production`
   - Add any optional variables under Environment tab

4. **Run Migrations and Seed** (first deploy only)
   - After the first deploy, go to your service → Shell
   ```bash
   npx drizzle-kit push
   npm run db:seed
   ```

5. **Custom Domain**
   - Go to Settings → Custom Domains
   - Add domain and configure DNS

### Render-Specific Settings
- Health Check Path: `/health`
- Auto-Deploy: Yes (from main branch)
- Plan: Starter ($7/month) or Free (spins down after 15min inactivity)

---

## Fly.io

**Type:** Containers deployed globally (edge computing)
**Best for:** Low latency worldwide, WebSocket support, persistent volumes
**Free tier:** 3 shared VMs, 3GB persistent storage

### Setup

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **Create App**
   ```bash
   fly launch --name cryptoeats
   ```
   When prompted:
   - Choose Miami (mia) region for lowest latency
   - Select "Yes" for PostgreSQL database
   - It will create a `fly.toml` file

3. **Configure `fly.toml`**
   Create or update this file in your project root:
   ```toml
   app = "cryptoeats"
   primary_region = "mia"

   [build]
     [build.args]
       NODE_VERSION = "22"

   [env]
     NODE_ENV = "production"
     PORT = "8080"

   [http_service]
     internal_port = 8080
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true

   [[vm]]
     cpu_kind = "shared"
     cpus = 1
     memory_mb = 512
   ```

4. **Create Dockerfile**
   ```dockerfile
   FROM node:22-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --production=false
   COPY . .
   RUN npm run server:build
   RUN npx drizzle-kit push
   EXPOSE 8080
   ENV PORT=8080
   CMD ["npm", "run", "server:prod"]
   ```

5. **Set Secrets**
   ```bash
   fly secrets set DATABASE_URL="postgresql://..."
   fly secrets set SESSION_SECRET="your-secret-here"
   ```

6. **Deploy**
   ```bash
   fly deploy
   ```

7. **Custom Domain**
   ```bash
   fly certs create cryptoeats.net
   ```
   Then add the CNAME record to your DNS.

---

## DigitalOcean App Platform

**Type:** Managed platform (PaaS)
**Best for:** Simple deployment with managed infrastructure
**Pricing:** Starting at $5/month for basic tier

### Setup

1. **Create App**
   - Go to [cloud.digitalocean.com](https://cloud.digitalocean.com) → Apps → Create App
   - Connect your GitHub repository
   - Component Type: Web Service

2. **Configure Build & Run**
   - Build Command: `npm install && npm run server:build`
   - Run Command: `npm run server:prod`
   - HTTP Port: 5000

3. **Add Database**
   - Click "Add Resource" → "Database" → "PostgreSQL"
   - DigitalOcean auto-injects `DATABASE_URL`

4. **Environment Variables**
   - Add optional variables under App Settings → Environment Variables

5. **Deploy**
   - Click "Deploy" — auto-deploys from GitHub on push

6. **Custom Domain**
   - Go to Settings → Domains → Add Domain
   - Configure DNS with the provided CNAME

---

## AWS

**Type:** Elastic Beanstalk (managed servers) or ECS (containers)
**Best for:** Enterprise scale, full AWS ecosystem integration
**Pricing:** Pay-as-you-go, free tier for 12 months

### Elastic Beanstalk Setup

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   eb init
   ```

2. **Create `.ebextensions/nodecommand.config`**
   ```yaml
   option_settings:
     aws:elasticbeanstalk:container:nodejs:
       NodeCommand: "npm run server:prod"
   ```

3. **Create Environment**
   ```bash
   eb create cryptoeats-prod --envvars DATABASE_URL=postgresql://...
   ```

4. **Add RDS PostgreSQL**
   - In AWS Console → RDS → Create Database → PostgreSQL
   - Copy the endpoint and update `DATABASE_URL`

5. **Deploy**
   ```bash
   eb deploy
   ```

6. **Custom Domain**
   - Use Route 53 or your DNS provider
   - Point domain to the Elastic Beanstalk URL

---

## Google Cloud Run

**Type:** Serverless containers
**Best for:** Auto-scaling, pay-per-request, Google Cloud ecosystem
**Free tier:** 2 million requests/month

### Setup

1. **Install Google Cloud CLI**
   ```bash
   gcloud auth login
   gcloud config set project your-project-id
   ```

2. **Create `Dockerfile`** (same as Fly.io section above)

3. **Create Cloud SQL PostgreSQL**
   ```bash
   gcloud sql instances create cryptoeats-db \
     --database-version=POSTGRES_15 \
     --tier=db-f1-micro \
     --region=us-east1
   ```

4. **Build and Deploy**
   ```bash
   gcloud run deploy cryptoeats \
     --source . \
     --region us-east1 \
     --allow-unauthenticated \
     --set-env-vars DATABASE_URL="postgresql://..." \
     --port 8080
   ```

5. **Custom Domain**
   ```bash
   gcloud run domain-mappings create \
     --service cryptoeats \
     --domain cryptoeats.net \
     --region us-east1
   ```

---

## Heroku

**Type:** Managed platform (PaaS)
**Best for:** Simplest deployment, many add-ons available
**Pricing:** Starting at $5/month (Eco dynos)

### Setup

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create App**
   ```bash
   heroku create cryptoeats
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:essential-0
   ```
   This automatically sets `DATABASE_URL`.

4. **Create `Procfile`** in project root:
   ```
   web: npm run server:prod
   release: npx drizzle-kit push && npx tsx scripts/run-seed.ts
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set SESSION_SECRET="your-secret"
   heroku config:set NODE_ENV=production
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

7. **Custom Domain**
   ```bash
   heroku domains:add cryptoeats.net
   ```
   Then add the DNS target as a CNAME record.

---

## Replit

**Type:** Cloud development and hosting platform
**Best for:** Development + deployment in one place, instant setup
**Pricing:** Free tier available, Deployments start at Core plan

### Setup

1. **Development** (already configured)
   - Backend runs via the "Start Backend" workflow: `npm run server:dev`
   - Frontend runs via the "Start Frontend" workflow: `npm run expo:dev`
   - PostgreSQL database is built-in and auto-configured via `DATABASE_URL`

2. **Publishing to Production**
   - Click the "Publish" button in the Replit workspace
   - Choose deployment type: "Reserved VM" (recommended for this app — always-on server with WebSocket support)
   - Build Command: `npm install && npm run server:build`
   - Run Command: `npm run server:prod`

3. **Custom Domain**
   - After publishing, go to the Deployments tab → Settings
   - Click "Link a domain" and enter your custom domain
   - Add the A record and TXT record provided to your domain's DNS settings
   - SSL certificates are provisioned automatically

4. **Environment Variables**
   - `DATABASE_URL` is already set automatically
   - Add any optional variables via the Secrets tab in the sidebar

### Replit Advantages
- No separate database setup needed (built-in PostgreSQL)
- Edit code and see changes instantly
- Automatic checkpoints for rollback
- Built-in secrets management

---

## Self-Hosted (VPS / Coolify)

**Type:** Your own server
**Best for:** Full control, no platform fees, data sovereignty
**Providers:** DigitalOcean Droplet, Linode, Hetzner, AWS EC2, any VPS

### Manual VPS Setup

1. **Provision a Server**
   - Ubuntu 22.04+ recommended
   - Minimum: 1 vCPU, 1GB RAM
   - Recommended: 2 vCPU, 2GB RAM

2. **Install Dependencies**
   ```bash
   # Node.js 22
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs

   # PostgreSQL
   sudo apt install -y postgresql postgresql-contrib
   sudo -u postgres createuser cryptoeats -P
   sudo -u postgres createdb cryptoeats -O cryptoeats

   # Nginx (reverse proxy)
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

3. **Clone and Build**
   ```bash
   git clone https://github.com/your-username/crypto-eats.git
   cd crypto-eats
   npm install
   npm run server:build
   ```

4. **Set Environment Variables**
   ```bash
   # Create .env file
   cat > .env << EOF
   DATABASE_URL=postgresql://cryptoeats:yourpassword@localhost:5432/cryptoeats
   SESSION_SECRET=$(openssl rand -hex 32)
   NODE_ENV=production
   PORT=5000
   EOF
   ```

5. **Run Migrations and Seed**
   ```bash
   npx drizzle-kit push
   npx tsx scripts/run-seed.ts
   ```

6. **Configure Nginx**
   ```nginx
   # /etc/nginx/sites-available/cryptoeats
   server {
       listen 80;
       server_name cryptoeats.net www.cryptoeats.net;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   ```bash
   sudo ln -s /etc/nginx/sites-available/cryptoeats /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

7. **SSL Certificate**
   ```bash
   sudo certbot --nginx -d cryptoeats.net -d www.cryptoeats.net
   ```

8. **Process Manager (keep server running)**
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name cryptoeats -- run server:prod
   pm2 save
   pm2 startup
   ```

### Coolify (Self-Hosted PaaS)

If you want a Vercel-like dashboard on your own server:

1. **Install Coolify** on your VPS:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```

2. **Add Your Server** in the Coolify dashboard

3. **Create New Resource** → Application → Connect GitHub repo

4. **Configure:**
   - Build Command: `npm install && npm run server:build`
   - Start Command: `npm run server:prod`
   - Port: 5000

5. **Add PostgreSQL** as a database resource in Coolify

6. **Deploy** — Coolify handles SSL, domains, and auto-deploys

---

## Mobile App Distribution

The Expo mobile app connects to whichever backend URL you deploy. Update the API URL in your app configuration:

### Update API Base URL

In your Expo app environment config, set the backend URL to your deployed server:

```
EXPO_PUBLIC_API_URL=https://cryptoeats.net
```

### Build APK for Android

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build APK for sideloading
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

### Build for iOS

```bash
# Build for TestFlight / App Store
eas build --platform ios --profile production
```

---

## Post-Deployment Checklist

After deploying to any platform, verify these items:

### Immediate Checks
- [ ] Visit your URL — landing page loads
- [ ] Check `/health` — returns `{ "status": "healthy" }`
- [ ] Check `/admin` — admin dashboard loads
- [ ] Check `/merchant` — merchant dashboard loads
- [ ] Check `/api-docs` — API documentation loads
- [ ] Check `/developers` — developer portal loads

### Authentication
- [ ] Register a new account via `/api/auth/register`
- [ ] Login via `/api/auth/login`
- [ ] Verify JWT tokens are issued correctly

### Database
- [ ] Confirm seed data loaded (restaurants, menus visible in admin)
- [ ] Create a test order
- [ ] Verify order appears in admin dashboard

### Security
- [ ] `SESSION_SECRET` is set to a strong random value (not the default)
- [ ] HTTPS is enabled and HTTP redirects to HTTPS
- [ ] CORS is configured for your domain
- [ ] Rate limiting is active on auth endpoints

### Optional Services
- [ ] Stripe payments processing (if `STRIPE_SECRET_KEY` set)
- [ ] Email notifications (if `SENDGRID_API_KEY` set)
- [ ] SMS notifications (if Twilio credentials set)
- [ ] Push notifications (if `EXPO_ACCESS_TOKEN` set)
- [ ] Error monitoring (if `SENTRY_DSN` set)

---

## Platform Comparison

| Platform | Type | Cold Starts | WebSockets | Built-in DB | Free Tier | Starting Price |
|----------|------|-------------|------------|-------------|-----------|----------------|
| Vercel | Serverless | Yes | No | No | Yes | $0 (Hobby) |
| Railway | Persistent | No | Yes | Yes | $5 credit | $5/mo |
| Render | Persistent | On free tier | Yes | Yes | Yes | $0 (Free) |
| Fly.io | Container | Optional | Yes | Yes | Yes | $0 (3 VMs) |
| DigitalOcean | Managed | No | Yes | Yes | No | $5/mo |
| AWS | Various | Depends | Yes | Yes | 12 months | Pay-as-you-go |
| Google Cloud | Container | Optional | Yes | Yes | Yes | Pay-as-you-go |
| Heroku | Managed | On Eco | Yes | Yes | No | $5/mo |
| Replit | Managed | No | Yes | Yes | Yes | Core plan |
| Self-hosted | Full control | No | Yes | Yes | N/A | ~$5/mo VPS |

**Recommendation for CryptoEats:** Railway or Render for the simplest full-stack experience with WebSocket support, persistent server, and built-in database. Use Vercel if you prefer serverless with separate database hosting.
