# NexChat — Database Schema & Architecture

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Session : "has many"
    User ||--o1 Profile : "has one"
    User ||--o{ ChatMember : "belongs to"
    User ||--o{ Message : "sends"
    User ||--o{ Reaction : "creates"
    User ||--o{ ReadReceipt : "marks"

    Chat ||--o{ ChatMember : "contains"
    Chat ||--o{ Message : "stores"

    Message ||--o{ Attachment : "includes"
    Message ||--o{ Reaction : "receives"
    Message ||--o{ ReadReceipt : "tracks"
    Message }|--|{ Message : "replies to"

    Group ||--o1 Chat : "associated with"
    Channel ||--o1 Chat : "associated with"
```

---

## 2. Complete Prisma Schema Definition

Below is the production-ready schema definition for `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  ADMIN
  SYSTEM
}

enum ChatType {
  DIRECT
  GROUP
  CHANNEL
}

enum GroupMemberRole {
  OWNER
  ADMIN
  MEMBER
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
  SYSTEM_NOTIFICATION
}

enum MessageStatus {
  SENT
  DELIVERED
  READ
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String    @unique
  passwordHash  String?   // Nullable for OAuth users
  phoneNumber   String?   @unique
  isVerified    Boolean   @default(false)
  role          Role      @default(USER)
  avatarUrl     String?
  bio           String?
  lastSeen      DateTime  @default(now())
  isOnline      Boolean   @default(false)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  profile       Profile?
  sessions      Session[]
  memberships   ChatMember[]
  messages      Message[]
  reactions     Reaction[]
  readReceipts  ReadReceipt[]
  blockedUsers  BlockedUser[] @relation("UserBlocked")
  blockedBy     BlockedUser[] @relation("UserBlocking")
  deviceTokens  DeviceToken[]

  @@index([username])
  @@index([email])
}

model Profile {
  id             String   @id @default(uuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  customStatus   String?
  themePreference String  @default("dark") // dark, light, system
  soundEnabled   Boolean  @default(true)
  showLastSeen   Boolean  @default(true)
  showReadReceipts Boolean @default(true)
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshToken String   @unique
  userAgent    String?
  ipAddress    String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())
}

model Chat {
  id           String      @id @default(uuid())
  type         ChatType    @default(DIRECT)
  name         String?     // For groups/channels
  description  String?
  avatarUrl    String?
  isPrivate    Boolean     @default(true)
  inviteCode   String?     @unique

  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  // Relations
  members      ChatMember[]
  messages     Message[]
  group        Group?
  channel      Channel?

  @@index([type])
}

model ChatMember {
  id        String          @id @default(uuid())
  chatId    String
  chat      Chat            @relation(fields: [chatId], references: [id], onDelete: Cascade)
  userId    String
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      GroupMemberRole @default(MEMBER)
  joinedAt  DateTime        @default(now())
  mutedUntil DateTime?

  @@unique([chatId, userId])
  @@index([userId])
  @@index([chatId])
}

model Message {
  id           String       @id @default(uuid())
  chatId       String
  chat         Chat         @relation(fields: [chatId], references: [id], onDelete: Cascade)
  senderId     String
  sender       User         @relation(fields: [senderId], references: [id], onDelete: Cascade)
  
  content      String?      @db.Text
  type         MessageType  @default(TEXT)
  isEdited     Boolean      @default(false)
  isDeleted    Boolean      @default(false)

  replyToId    String?
  replyTo      Message?     @relation("MessageReplies", fields: [replyToId], references: [id], onDelete: SetNull)
  replies      Message[]    @relation("MessageReplies")

  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  attachments  Attachment[]
  reactions    Reaction[]
  readReceipts ReadReceipt[]

  @@index([chatId, createdAt])
  @@index([senderId])
}

model Attachment {
  id        String   @id @default(uuid())
  messageId String
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  fileUrl   String
  fileType  String
  fileName  String
  fileSize  Int      // in bytes
  createdAt DateTime @default(now())
}

model Reaction {
  id        String   @id @default(uuid())
  messageId String
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  emoji     String

  createdAt DateTime @default(now())

  @@unique([messageId, userId, emoji])
}

model ReadReceipt {
  id        String   @id @default(uuid())
  messageId String
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  readAt    DateTime @default(now())

  @@unique([messageId, userId])
}

model Group {
  id          String   @id @default(uuid())
  chatId      String   @unique
  chat        Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  createdById String
  rules       String?
}

model Channel {
  id            String   @id @default(uuid())
  chatId        String   @unique
  chat          Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  createdById   String
  subscriberCount Int    @default(0)
}

model BlockedUser {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation("UserBlocking", fields: [userId], references: [id], onDelete: Cascade)
  blockedId String
  blocked   User     @relation("UserBlocked", fields: [blockedId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, blockedId])
}

model DeviceToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  platform  String   // web, android, ios
  createdAt DateTime @default(now())
}
```

---

## 3. Database Indexing & Performance Strategy

1. **Message Retrieval Querying**:
   * Index on `Message([chatId, createdAt DESC])` optimizes fetching infinite scroll history pages for active chat rooms.
2. **User Search & Autocomplete**:
   * B-tree index on `User(username)` and `User(email)` for fast handle lookup.
3. **Chat Feed List**:
   * Index on `ChatMember([userId])` and `Message([chatId, createdAt])` ensures low query cost when computing the active conversation drawer for a logged-in user.
