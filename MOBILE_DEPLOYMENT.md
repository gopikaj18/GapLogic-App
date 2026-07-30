# GapLogic Mobile App - Setup & Deployment Guide

## Overview
GapLogic features a fully native Android wrapper application (`android/`) that runs a premium, high-performance WebView loaded with the responsive Next.js web application. 

This native wrapper uses a custom User-Agent tag (`GapLogicAndroid`) to communicate with the web app backend, handles loading states with a clean progress bar, implements native hardware Back Button routing via Android's `OnBackPressedDispatcher`, and shows a polished offline/error state screen when connections fail.

---

## Native Android App Structure

```
android/
├── app/
│   ├── build.gradle        # Module build configurations
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/gaplogic/app/
│       │   └── MainActivity.java  # Custom WebView activity
│       └── res/
│           ├── layout/
│           │   └── activity_main.xml  # Layout with WebView, ProgressBar, Offline UI
│           └── values/
│               ├── colors.xml     # Brand theme colors
│               └── styles.xml     # Theme definition (using core-splashscreen)
├── build.gradle
└── settings.gradle
```

---

## Local Development Setup

### Prerequisites
- Node.js 18+ (for running the Next.js web application)
- Android Studio (for launching/debugging the native app)
- Android SDK (v34+) and Android Emulator (or a physical test device with USB debugging enabled)

### Step 1: Run the Web Server
Before starting the Android app, start the Next.js development server:

```bash
# In the main project directory
npm install
npm run dev
```

This runs the web server locally at `http://localhost:9002` (or `http://127.0.0.1:9002`).

### Step 2: Open and Run the Android App

#### Option A: Android Studio (Recommended)
1. Open **Android Studio**.
2. Select **Open an existing project** and choose the `android` folder in this repository.
3. Wait for Gradle sync to complete.
4. Select a virtual device (emulator) or your connected physical device.
5. Click the green **Run** button (or press `Shift + F10`).

#### Option B: Command Line (Gradle Wrapper)
Make sure Next.js is running, then compile and run the app from your terminal:

```bash
cd android
# Build debug APK
./gradlew assembleDebug

# Install and run on your connected device/emulator
./gradlew installDebug
```

---

## Configurable URLs

During development, the app points to `http://10.0.2.2:9002` (which maps to the host machine's loopback interface from the Android Emulator).

To update the target URL (e.g. for staging or production deployment):
1. Open [MainActivity.java](file:///c:/Users/HP/Downloads/prev_1-main/prev_1-main/android/app/src/main/java/com/gaplogic/app/MainActivity.java).
2. Update the `DEV_URL` static field to point to your live deployment url:
   ```java
   private static final String DEV_URL = "https://your-production-app.vercel.app";
   ```

---

## Key Native WebView Features

### 1. Offline Recovery & Error State
If the user loses internet connection or the server is down, the native layout automatically hides the WebView and displays a sleek warning layout with a **Retry Connection** button.

### 2. Loading State UI
A custom horizontal or circular loader (tinted Blue) is shown while pages are loading and disappears smoothly once compilation or retrieval completes.

### 3. Native Back Button Routing
Standard Android back button presses navigate the browser-like web history backwards. If the user is at the homepage (the root of the web history), pressing back exits the application.

### 4. Console Log Forwarding
Console logs (`console.log`, `console.error`) inside Next.js/React code are forwarded to Android's Logcat debugger under the tag `WebViewConsole`, making debugging fast and simple.

---

**Last Updated:** July 27, 2026
**Maintainer:** GapLogic Team
