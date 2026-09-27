# NexChat — UI/UX Design System & Telegram-Style Layout Architecture

## 1. Design Principles & Aesthetics

NexChat is designed to deliver a modern, high-contrast, premium messaging experience matching Telegram Web's gold-standard UX while establishing an original NexChat brand identity:

* **Telegram Web UX Reference**: Left sidebar navigation, top search bar, pinned conversations, date separators, sliding info panels, floating context menus, and inline attachment previews.
* **Original Brand Aesthetics**: Electric Blue accent (`#2AABEE`), deep slate dark mode (`#0B0F19`), clean light mode (`#F8FAFC`), slightly rounded cards/bubbles (`rounded-xl`), and smooth CSS spring transitions.
* **Theme System**: Functional Light and Dark mode switching using CSS variable tokens and Next-Themes.
* **Non-Infringement**: Original logo mark, custom SVG icons (via Lucide React), custom typography, and original UI component code.

---

## 2. Color Palette & Token Specifications

### 2.1 CSS Color Variables (`index.css`)

```css
:root {
  /* Brand Primary Accent - NexChat Electric Blue */
  --primary: 199 89% 55%;        /* #2AABEE - Vibrant Blue Accent */
  --primary-foreground: 0 0% 100%;

  /* Dark Mode Palette (Default) */
  --background: 224 47% 7%;      /* #0B0F19 - Ultra Dark Slate */
  --foreground: 210 40% 98%;
  --card: 222 47% 11%;           /* #111827 - Surface Card */
  --card-foreground: 210 40% 98%;
  --popover: 222 47% 10%;
  --popover-foreground: 210 40% 98%;

  /* Message Bubbles */
  --bubble-outgoing: 204 88% 28%; /* Deep Blue outgoing bubble */
  --bubble-incoming: 217 33% 15%; /* Dark Slate incoming bubble */

  /* Status & Indicators */
  --online-green: 142 71% 45%;   /* #22C55E */
  --read-blue: 199 89% 55%;      /* #2AABEE Double Tick */
  --unread-badge: 262 83% 58%;   /* Neon Purple unread badge */
  --pinned-icon: 215 20% 65%;
}

.light {
  --background: 210 40% 98%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --bubble-outgoing: 199 89% 55%;
  --bubble-incoming: 210 20% 94%;
}
```

---

## 3. Information Architecture & Key Layouts

### 3.1 Desktop Split-Pane Layout (1024px+)

```
+---------------------------------------------------------------------------------------------------------+
|  NEXCHAT  [ Search users, chats... ]   |  [Avatar] Sarah Miller • Online            | [🔍] [📌] [ℹ️ Info] |
+----------------------------------------+--------------------------------------------+-------------------+
| [📁 All] [💬 Direct] [👥 Groups] [📢]  |                                            | User Profile      |
| -------------------------------------- |             Thursday, Sep 24               | Sarah Miller      |
| 📌 🟢 Sarah Miller               12:42 | [Incoming Bubble]                          | @sarah_m          |
|    Hey! Did you check the PR?     (2)  | Hey Alex, welcome to NexChat!              | Bio: Fullstack Dev|
|                                        |                                  10:15 PM  | ------------------|
| 📌 ⚪ Tech Group (Public)        11:30 | ------------------------------------------ | Shared Media (24) |
|    Alex: Next.js 14 is live!           |               Friday, Sep 25               | Files (12)        |
|                                        | [Outgoing Bubble ✔✔]                        | Links (8)         |
| ⚪ Announcements Channel         09:15 | Thanks! The UI looks super smooth.         |                   |
|    🚀 v1.0.0 is now live!              |                                  10:16 PM  |                   |
|                                        | ✍️ Sarah is typing...                     |                   |
|----------------------------------------+--------------------------------------------+-------------------|
|                                        | [📎]  Write a message...        [😃] [🎙️] [🚀]                 |
+---------------------------------------------------------------------------------------------------------+
```

### 3.2 Telegram-Style Context Menu & Message Features
* **Message Context Menu**: Right-click or hold on a message bubble opens a floating context menu:
  * ↩️ **Reply**: Focuses message composer with reply banner preview.
  * ✏️ **Edit**: Opens inline message editor (for sender's messages within edit window).
  * 📋 **Copy Text**: Copies plaintext content to clipboard.
  * ➡️ **Forward**: Opens conversation picker modal to forward to another contact/group.
  * 📌 **Pin Message**: Pins message to chat header bar.
  * 🗑️ **Delete**: Prompts "Delete for me" vs "Delete for everyone".
* **Date Separators**: Sticky date headers (e.g. "Today", "Yesterday", "September 24, 2026") grouping message history chronologically.
* **Chat List Badges**: Pinned pushpin icon 📌, unread counter badge, online green status ring.
* **Info Drawer**: Slide-over panel showing user info, bio, username, mute toggles, shared media tabs (Photos, Videos, Files, Links).

| [Chats] [Groups] [Channels] [⚙]    |                                                  |
| ---------------------------------- |                                                  |
| 🟢 Sarah Miller             12:42 |                Sarah Miller                      |
|    Hey! Did you check the PR?  (2) |             Yesterday, 10:15 PM                 |
|                                    |                                                  |
| ⚪ Tech Group (Public)       11:30 | [Incoming Bubble]                                |
|    Alex: Next.js 14 is great!      | Hey Alex, welcome to NexChat!                    |
|                                    |                                        10:15 PM  |
| ⚪ Announcements Channel     09:15 |                                                  |
|    🚀 v1.0.0 is now live!          |                [Outgoing Bubble ✔✔]              |
|                                    |                Thanks! The UI looks amazing.     |
|                                    |                                        10:16 PM  |
|                                    |                                                  |
|                                    |--------------------------------------------------|
|                                    | [📎]  Write a message...             [🎙️] [🚀]  |
+------------------------------------+--------------------------------------------------+
```

### 3.2 Mobile Drawer & Navigation (Viewport < 768px)
* **Single Pane Navigation**: Mobile view toggles seamlessly between the Chat List Screen and the Active Conversation View.
* **Touch-Optimized**: Swipe-to-reply gesture on message bubbles, pull-down to refresh chat history, and bottom-sheet drawers for user profile and media upload menus.

---

## 4. Component Hierarchy & Atomic Components

### 4.1 Chat Components (`src/components/chat/`)
1. **`ChatSidebar.tsx`**: Header with user profile status, tab switcher (All, Unread, Groups, Channels), filterable search bar, and conversation cards.
2. **`ConversationCard.tsx`**: Avatar with online indicator dot, recipient name, last message snippet, timestamp, and unread count badge.
3. **`ChatArea.tsx`**: Header (recipient info, search, media drawer toggle), virtualized message list, typing indicator bar, and rich message composer.
4. **`MessageBubble.tsx`**: 
   * Formatted text content with automatic URL parsing & link previews.
   * Attachments view (image grid, video player with custom controls, document card with download button, audio waveform playback).
   * Context menu trigger (Edit, Reply, Forward, Delete, React).
   * Double-tick status icon (`Sent`, `Delivered`, `Read`).
5. **`MessageComposer.tsx`**: Auto-expanding textarea, emoji picker popover, file attachment dropzone, audio recorder button with live waveform visualizer.

### 4.2 Shared UI Components (`src/components/ui/`)
* Built with `radix-ui` primitives via `shadcn/ui`:
  * `Dialog`, `Sheet` (Side drawers for media gallery & settings)
  * `DropdownMenu` (Message actions context menu)
  * `Tooltip` (Status indicators & action icons)
  * `Avatar` (User profile picture with fallback initials)
