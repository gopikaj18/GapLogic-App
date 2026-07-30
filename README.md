# GapLogic

GapLogic is a behavioral audit tool that tracks the gap between your intentions and what you actually did.

## Stack

- **Next.js 15** — web app + API
- **PostgreSQL on Railway** — persistent storage
- **Expo (React Native)** — mobile app (Expo Go)

## Setup (Web)

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Set `DATABASE_URL` to your Railway **public TCP** URL and a strong `SESSION_SECRET`.

3. Install and migrate:

```bash
npm install
npm run db:migrate
npm run dev
```

4. Open [http://localhost:9002](http://localhost:9002), register, then use Modeler → Focus → Analysis.

## Setup (Mobile / Expo Go)

1. Start the web API first (`npm run dev` on port **9002**).

2. In `mobile/.env`, set your PC's LAN IP (required on a physical phone):

```
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:9002
```

3. Install and start Expo:

```bash
cd mobile
npm install
npx expo start
```

4. Scan the QR code with **Expo Go**. Register/login uses the same Railway database as the web app.

## Data

All user accounts, intentions, and reality logs are stored in PostgreSQL. Sessions use signed JWT tokens (httpOnly cookie on web, AsyncStorage on mobile).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js on port 9002 |
| `npm run db:migrate` | Create database tables |
| `npm run typecheck` | TypeScript check (web only) |
# prev_1

## Android APK

The compiled Android app (debug version) is available in the [`apks/`](file:///c:/Users/HP/Downloads/prev_1-main/prev_1-main/apks) folder:
- **[gaplogic-debug.apk](file:///c:/Users/HP/Downloads/prev_1-main/prev_1-main/apks/gaplogic-debug.apk)**: You can install this APK file directly on your Android physical device or emulator.

