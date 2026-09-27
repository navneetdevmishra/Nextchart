# NexChat — Production Deployment Guide

## 1. Prerequisites
- Docker Engine 24.0+ & Docker Compose v2.20+
- Domain with SSL certificate (Cloudflare / Let's Encrypt)
- Node.js 20+ and `pnpm` 9+ (for local development)

## 2. Local Infrastructure Setup

To start NexChat locally with zero external dependencies:

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Build shared library
pnpm --filter @nexchat/shared build

# 3. Synchronize SQLite local database
pnpm --filter @nexchat/server exec prisma db push

# 4. Seed initial database data
pnpm --filter @nexchat/server exec prisma db seed

# 5. Start dev server (Frontend port 3000, Backend port 4000)
pnpm dev
```

## 3. Production Docker Deployment

To launch full production stack with PostgreSQL and Redis:

```bash
# Build and run containerized services
docker-compose up -d --build

# Verify container health status
docker-compose ps
```

## 4. Environment Variables Reference

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Server Port | `4000` |
| `DATABASE_URL` | Database Connection String | `file:./dev.db` (local) or PostgreSQL URL |
| `REDIS_URL` | Redis Cache URL | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | JWT Signing Secret | `nexchat_super_secret_access_key_2026` |
| `VAPID_PUBLIC_KEY` | Web Push VAPID Public Key | Configured in `.env` |
| `STUN_SERVER` | WebRTC STUN Server | `stun:stun.l.google.com:19302` |
| `TURN_SERVER` | WebRTC TURN Server | `turn:turn.nexchat.io:3478` |
