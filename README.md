# 🚀 NexChat — Complete Telegram-Inspired Real-Time Communications Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-blue.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red.svg)](https://nestjs.com/)
[![React Native](https://img.shields.io/badge/React_Native-0.74-cyan.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.14-darkblue.svg)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-black.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

NexChat is a full-stack, enterprise-grade real-time messaging, WebRTC voice/video calling, and community broadcast platform inspired by Telegram Web, featuring original NexChat branding (`#2AABEE` Electric Blue), modern glassmorphism UI, cross-platform Android & iOS mobile apps, and an Admin Control Panel.

---

## 🌟 Key Features

- 💬 **Real-Time Messaging:** 1-on-1 private chats, group messaging, public/private channels, typing indicators, read receipts, message replies, forwarding, reactions, and pinned messages.
- 📞 **WebRTC Voice & Video Calling:** One-to-one audio/video calls with Socket.IO signaling, mute controls, camera toggle, screen sharing, picture-in-picture mode, and call history logs.
- 🛡️ **Advanced Privacy & Security:**
  - Two-Factor Authentication (2FA TOTP) native support (Google Authenticator, Authy, 1Password).
  - User blocking and unblocking.
  - Active device session management and remote revocation.
  - Privacy toggles for Last Seen and Read Receipt visibility.
- 🔔 **Web Push Notifications:** Native browser push notification engine via `web-push` and Service Worker (`sw.js`).
- 🛡️ **Admin Dashboard (`/admin`):** System metrics, user account management (suspension/reinstatement), user abuse reports, and immutable audit logs. Zero-knowledge privacy design prevents admin reading of private 1-on-1 conversations.
- 🔍 **Advanced Global Search:** Search across handle `@username`, public groups/channels, authorized message history, and media attachments with highlighted term matches.
- 📱 **Cross-Platform Mobile Apps (`apps/mobile`):** Expo React Native mobile app for Android and iOS with native WebRTC support and SecureStore authentication persistence.

---

## 🏗️ Architecture Stack

```
NexChat Monorepo
├── packages/shared     # Shared TypeScript types, DTOs & Socket event constants
├── apps/server         # NestJS backend API, Socket.IO WebSockets, WebRTC signaling & Prisma ORM
├── apps/web            # Next.js 14 Web client (App Router, Tailwind CSS, Lucide icons)
└── apps/mobile         # Expo React Native mobile client (Expo Router, Zustand, SecureStore)
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js:** v20.0+
- **pnpm:** v9.0+

### Installation & Launch

```bash
# 1. Clone repository
git clone https://github.com/navneetdevmishra/Nextchart.git
cd Nextchart

# 2. Install monorepo dependencies
pnpm install

# 3. Build shared library
pnpm --filter @nexchat/shared build

# 4. Initialize database schema
pnpm --filter @nexchat/server exec prisma db push

# 5. Seed initial data
pnpm --filter @nexchat/server exec prisma db seed

# 6. Start development server
pnpm dev
```

### Live Local Services
- 🌐 **Web Application:** `http://localhost:3000`
- 🛡️ **Admin Control Panel:** `http://localhost:3000/admin`
- ⚙️ **NestJS API Server:** `http://localhost:4000/api/v1`
- 🗄️ **Prisma Studio Database Viewer:** `pnpm --filter @nexchat/server exec prisma studio` (runs on `http://localhost:5555`)

---

## 🐳 Docker Deployment

To launch the full production stack using Docker Compose (PostgreSQL, Redis, NestJS Server, Next.js Web):

```bash
docker-compose up -d --build
```

---

## 📱 Mobile App (Android APK Generation)

```bash
cd apps/mobile
pnpm install
eas build --platform android --profile preview
```

---

## 📄 Documentation Links

- 📐 [ARCHITECTURE.md](docs/ARCHITECTURE.md) — System Architecture Document
- 🔌 [API.md](docs/API.md) — REST & WebSocket API Specification
- 🗄️ [DATABASE.md](docs/DATABASE.md) — Database Schema & Indexes
- 🛡️ [SECURITY.md](docs/SECURITY.md) — Security Hardening & Vulnerability Review
- 🚀 [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Deployment Guide
- 📱 [MOBILE_GUIDE.md](docs/MOBILE_GUIDE.md) — Android & iOS Mobile Setup Guide
- 🧪 [TEST_REPORT.md](docs/TEST_REPORT.md) — Automated Test Suite Results

---

## 📜 License
Licensed under the [MIT License](LICENSE).
