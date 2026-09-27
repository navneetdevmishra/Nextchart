# NexChat — Security Architecture & Vulnerability Audit

## 1. Authentication & Session Management
- **JWT Authentication:** Dual-token strategy with short-lived access tokens (15m) and HTTP-only, SameSite Secure refresh token cookies.
- **Session Revocation:** Users and administrators can terminate active device sessions (`DELETE /privacy/sessions/:id`).
- **Two-Factor Authentication (2FA TOTP):** RFC 6238 implementation supporting Google Authenticator, Authy, and 1Password with encrypted secret keys.

## 2. Authorization & RBAC
- **Role-Based Access Control:** Strict role segregation (`ROLE === 'ADMIN'`). Admin endpoints guarded by `JwtAuthGuard` and `RolesGuard`.
- **Zero-Knowledge Admin Policy:** Admin accounts operate without unrestricted read access to private 1-on-1 conversations to protect user privacy.
- **WebSocket Access Control:** Socket connections require JWT validation in handshakes. Room subscription is authorized prior to joining `chat:${chatId}`.

## 3. Data Protection & Encryption
- **Password Hashing:** Argon2id password hashing algorithm.
- **Signal Transport:** HTTPS/WSS in production environments with mandatory TLS 1.3.
- **Cloud Chat Transparency:** Cloud chats are explicitly identified as server-persisted cloud storage (not falsely claimed as end-to-end encrypted).

## 4. Rate Limiting & Input Protection
- **Socket Rate Limiting:** Sliding-window rate limiter on WebSocket messages (max 15 messages / 5 seconds per socket).
- **REST Rate Limiting:** Rate throttler applied to login and signaling endpoints.
- **Input Sanitization:** NestJS `ValidationPipe` with `class-validator` enforces strict schema validation and strips unexpected payload properties.
