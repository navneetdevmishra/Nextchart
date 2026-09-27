# NexChat — Mobile Application Guide (Android & iOS)

## 1. Overview
The NexChat mobile app is built with **Expo React Native**, **Expo Router**, **TypeScript**, **Zustand**, **Socket.IO**, and **React Native WebRTC**. It connects directly to the existing NexChat NestJS backend.

---

## 2. Directory Structure

```
apps/mobile/
├── app/
│   ├── _layout.tsx         # Root Stack & Theme Provider
│   ├── (auth)/
│   │   ├── login.tsx       # Sign In Screen
│   │   └── register.tsx    # Sign Up Screen
│   ├── (tabs)/
│   │   ├── _layout.tsx     # Bottom Tab Navigator
│   │   ├── index.tsx       # Conversations List Screen
│   │   ├── calls.tsx       # Call History Log Screen
│   │   └── settings.tsx    # Settings & Privacy Screen
│   └── chat/
│       └── [id].tsx        # Conversation Screen
├── src/
│   ├── lib/api.ts          # Mobile API client (SecureStore persistence)
│   └── store/
│       ├── useAuthStore.ts # Auth Zustand store
│       └── useChatStore.ts # Chat Zustand store
├── app.json                # Expo config (bundle ID io.nexchat.app)
├── eas.json                # EAS Build configuration for Android APK
├── tsconfig.json           # Monorepo path resolution
└── metro.config.js         # Metro bundler monorepo configuration
```

---

## 3. Local Development Commands

### 1. Install & Run Monorepo Backend & Mobile App

```bash
# From workspace root:
pnpm install

# Start backend dev server (Port 4000)
pnpm --filter @nexchat/server dev

# Start Expo Mobile bundler
pnpm --filter @nexchat/mobile start
```

### 2. Run on Devices / Emulators
- **Android Emulator:** `pnpm --filter @nexchat/mobile android`
- **iOS Simulator (macOS):** `pnpm --filter @nexchat/mobile ios`
- **Web Preview:** `pnpm --filter @nexchat/mobile web`

---

## 4. How to Generate an Android APK (`.apk`)

To generate a standalone preview APK for Android device testing:

```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Log in to Expo account
eas login

# 3. Build standalone Android APK
cd apps/mobile
eas build --platform android --profile preview
```

---

## 5. Testing Real-Time Sync & WebRTC Calling

1. **Cross-Platform Messaging:** Log in as `john_doe` on Next.js Web client (`http://localhost:3000`) and `jane_smith` on Mobile app. Send messages, emojis, and media attachments to verify real-time Socket.IO synchronization.
2. **Calling Testing:** WebRTC audio/video calls use `react-native-webrtc` native modules and work when compiled via Expo Development Build (`eas build` / `expo run:android`).
