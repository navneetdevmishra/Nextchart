# NexChat — API & Socket Event Specifications

## 1. REST API Endpoints

All REST APIs are prefixed with `/api/v1`. Authentication is passed via `Authorization: Bearer <JWT_ACCESS_TOKEN>` header (or HttpOnly refresh cookies for session refresh).

---

### 1.1 Authentication (`/api/v1/auth`)

#### `POST /auth/register`
* **Description**: Registers a new user with email and password.
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "username": "alex_dev",
    "password": "SecurePassword123!"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "usr-123456",
      "email": "user@example.com",
      "username": "alex_dev",
      "avatarUrl": null
    },
    "accessToken": "eyJhbGci..."
  }
  ```

#### `POST /auth/login`
* **Request Body**: `{ "email": "user@example.com", "password": "SecurePassword123!" }`
* **Response (200 OK)**: Returns user payload, `accessToken`, and sets `refreshToken` in HttpOnly cookie.

#### `GET /auth/google`
* **Description**: Initiates Google OAuth2 redirect flow.

#### `POST /auth/refresh`
* **Description**: Refreshes expired access token using valid refresh cookie.

---

### 1.2 User & Profile (`/api/v1/users`)

#### `GET /users/me`
* **Description**: Returns authenticated user profile, settings, and status.

#### `PATCH /users/me/profile`
* **Request Body**: `{ "bio": "Full-stack developer", "themePreference": "dark", "avatarUrl": "https://..." }`

#### `GET /users/search?q={query}`
* **Description**: Global search by username or display name.

---

### 1.3 Chats & Messages (`/api/v1/chats`)

#### `GET /chats`
* **Description**: Retrieves recent chats for current user (paginated).
* **Response (200 OK)**:
  ```json
  [
    {
      "id": "chat-789",
      "type": "DIRECT",
      "unreadCount": 3,
      "updatedAt": "2026-09-28T00:00:00Z",
      "recipient": {
        "id": "usr-999",
        "username": "sarah_m",
        "isOnline": true,
        "avatarUrl": "https://..."
      },
      "lastMessage": {
        "id": "msg-001",
        "content": "Hey, how are you?",
        "createdAt": "2026-09-28T00:00:00Z"
      }
    }
  ]
  ```

#### `POST /chats/direct`
* **Description**: Initializes or retrieves direct message chat room with target user.
* **Request Body**: `{ "recipientId": "usr-999" }`

#### `GET /chats/:chatId/messages?cursor={msgId}&limit=50`
* **Description**: Cursor-paginated message history for a specific chat room.

---

### 1.4 Media Upload (`/api/v1/media`)

#### `POST /media/presigned-url`
* **Request Body**: `{ "filename": "audio_note.ogg", "fileType": "audio/ogg", "fileSize": 1048576 }`
* **Response (200 OK)**:
  ```json
  {
    "uploadUrl": "https://r2.cloudflare.com/nexchat-bucket/audio_note.ogg?signature=...",
    "publicUrl": "https://cdn.nexchat.io/media/audio_note.ogg",
    "fileKey": "media/audio_note.ogg"
  }
  ```

---

## 2. Socket.IO Real-Time Event Architecture

* **Namespace**: `/`
* **Authentication**: Handshake token provided via `auth: { token: "BEARER_JWT" }`

### 2.1 Client-to-Server Events (`Emit`)

| Event Name | Payload Schema | Description |
|---|---|---|
| `message:send` | `{ chatId, tempId, content, type, replyToId, attachments }` | Sends new real-time message |
| `message:typing` | `{ chatId, isTyping: boolean }` | Emits typing state changes |
| `message:read` | `{ chatId, messageIds: string[] }` | Marks messages as read |
| `message:edit` | `{ messageId, content }` | Edits an existing message |
| `message:delete` | `{ messageId, deleteForEveryone: boolean }` | Deletes a message |
| `message:react` | `{ messageId, emoji }` | Toggles an emoji reaction |
| `presence:heartbeat` | `{}` | 30s ping keeping user marked as online |

---

### 2.2 Server-to-Client Events (`Listen`)

| Event Name | Payload Schema | Description |
|---|---|---|
| `message:new` | `{ message: MessageObject }` | Recipient receives newly dispatched message |
| `message:ack` | `{ tempId, messageId, status: "SENT", createdAt }` | Sender receives server delivery ACK |
| `message:status_update` | `{ messageId, status: "DELIVERED" \| "READ", userId }` | Real-time tick indicator update |
| `user:typing` | `{ chatId, userId, username, isTyping }` | Shows "Sarah is typing..." indicator |
| `user:presence` | `{ userId, isOnline, lastSeen }` | Real-time status update for contacts |
| `message:edited` | `{ messageId, content, isEdited: true }` | Live updates edited message in UI |
| `message:deleted` | `{ messageId, deleteForEveryone: boolean }` | Live removes message from active view |
| `message:reaction_update` | `{ messageId, reactions: Array }` | Live updates emoji counter on message bubble |

---

## 3. Standard API Error Response Format

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "username must be at least 3 characters long",
    "email must be a valid email address"
  ],
  "timestamp": "2026-09-28T00:51:11Z"
}
```
