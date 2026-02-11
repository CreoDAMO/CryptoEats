# CryptoEats — Live Demo & Deployment Strategy

---

## How the Live Demo Works

CryptoEats uses **Expo Go** and a **secure tunnel** to let anyone experience the full app on their phone — no app store download needed, no installation, no APK file. Just scan a QR code and the app opens instantly.

This is possible because of three things working together:

1. **Replit** runs the backend server and database
2. **Expo Go** runs the mobile app on your phone
3. **A tunnel** connects the two over the internet

---

## The Tunnel — Explained

When you develop a mobile app in Replit, the code runs on a remote server in the cloud. Your phone can't normally reach that server directly. A **tunnel** solves this by creating a temporary public URL that bridges the gap.

### How It Works

```
Your Phone (Expo Go)
        │
        ▼
   Tunnel URL
(exp://xxxxx.exp.direct)
        │
        ▼
   Replit Server
 (backend + database)
```

1. When the "Start Frontend" workflow runs with `--tunnel` mode, it creates a secure public URL using ngrok
2. That URL is encoded into a QR code shown in the Replit console
3. Anyone who scans the QR code (or enters the URL manually) gets the full CryptoEats app on their phone
4. The app communicates with the backend running in Replit — real data, real features, everything works

### The Tunnel URL

Each time the tunnel starts, it generates a unique URL like:

```
exp://ol48lye-anonymous-8081.exp.direct
```

This URL:

- **Works from anywhere** — home Wi-Fi, cellular data, coffee shop, another country
- **Works on any phone** — as long as Expo Go is installed (free on iOS and Android)
- **Is not limited to Replit** — you can copy and paste it into Expo Go from any device
- **Doesn't require the same network** — unlike local development, the tunnel makes it globally accessible

### Important to Know

- The URL only works while the Replit session is active and the "Start Frontend" workflow is running
- If Replit goes to sleep or the workflow restarts, a **new URL** is generated (the old one stops working)
- After scanning once, Expo Go saves it in your "Recently opened" list — but you'd need to re-scan if the URL changes
- The URL is randomly generated and changes each session (custom subdomains require a paid ngrok account)

---

## Using the Live Demo

### First-Time Setup (One Time)

1. Install **Expo Go** on your phone
   - [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)
   - [Android (Play Store)](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Make sure the **Start Backend** and **Start Frontend** workflows are both running in Replit

### Showing the Demo

1. Open the **Start Frontend** console output in Replit — you'll see a QR code
2. Hand your phone (or the other person's phone) to scan the QR code:
   - **Android**: Open Expo Go → tap "Scan QR Code"
   - **iOS**: Open the Camera app → point at the QR code → tap the notification to open in Expo Go
3. The full CryptoEats app loads in seconds
4. Browse restaurants, view menus, create an account, place orders — everything works with real data

### Without a QR Code

If you can't scan the QR code (e.g., showing remotely over a video call):

1. Copy the tunnel URL from the Replit console (looks like `exp://xxxxx.exp.direct`)
2. Send it to the other person via text, email, or chat
3. They paste it into Expo Go:
   - **Android**: Expo Go → "Enter URL manually" → paste → "Connect"
   - **iOS**: Expo Go → tap the text field at the top → paste → tap "Connect"

### Demo Script for Investors or Partners

> "Let me show you the actual app running live. Download Expo Go on your phone — it's free. Now scan this QR code. What you're seeing is the real CryptoEats platform connected to our live database with restaurants, menus, and the full ordering system. This is what customers in Miami will experience."

---

## The Big Picture — Demo to Pilot

CryptoEats uses a single codebase that powers three stages of the business:

### 1. Development (Replit)

| | |
|---|---|
| **What** | Build, test, and refine the app |
| **Where** | Replit workspace |
| **Who uses it** | You and your development team |
| **How** | Edit code → changes appear instantly |

### 2. Live Demo (Expo Go + Replit Tunnel)

| | |
|---|---|
| **What** | Show the working app to anyone, on their phone |
| **Where** | Any phone with Expo Go, anywhere in the world |
| **Who uses it** | Investors, partners, restaurant owners, potential hires |
| **How** | Scan QR code or paste tunnel URL into Expo Go |

### 3. Official Pilot Program (Deployed Backend + Standalone APK)

| | |
|---|---|
| **What** | Production system for real users in Miami |
| **Where** | cryptoeats.net (always on, always accessible) |
| **Who uses it** | Real customers, real drivers, real restaurant partners |
| **How** | Download the CryptoEats APK → app connects to cryptoeats.net |

### Summary Table

| Purpose | Platform | Access Method |
|---------|----------|---------------|
| Development | Replit | Edit code directly in the workspace |
| Live Demo | Expo Go + Replit tunnel | Scan QR code to show anyone the app |
| Pilot Program | Deployed backend + APK | cryptoeats.net — always on for real users |

### Why This Matters

- **Use the demo to get buy-in** — show investors and restaurant partners the real, working product on their own phone
- **Roll out the pilot on a proper deployment** — cryptoeats.net runs 24/7 with no dependency on Replit being active
- **Same codebase, same features** — everything you refine during demos carries right over to production
- **No app store needed** — distribute the APK directly to pilot users for sideloading on Android

---

## Quick Reference

### Start the Demo

```
1. Open Replit
2. Make sure "Start Backend" is running
3. Make sure "Start Frontend" is running (tunnel mode)
4. Scan the QR code with Expo Go
```

### Stop the Demo

```
1. Stop the "Start Frontend" workflow in Replit
   (or just close Replit — the tunnel stops automatically)
```

### Troubleshooting

| Problem | Solution |
|---------|----------|
| QR code won't scan | Copy the `exp://` URL and paste it manually into Expo Go |
| App shows "Network error" | Make sure "Start Backend" workflow is running in Replit |
| Old URL doesn't work | The tunnel URL changed — scan the new QR code from the console |
| App loads but shows blank screen | Wait 10-15 seconds for the initial bundle to download |
| "Something went wrong" error | Pull down to refresh, or close and reopen Expo Go |
