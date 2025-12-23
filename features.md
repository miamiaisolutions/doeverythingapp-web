# DoEverything App - Features & Roadmap

## 🧠 Overview
DoEverything App is an AI-powered webhook orchestration platform that allows teams to automate actions through natural language conversations.
Users configure webhooks, define field requirements, paste JSON templates, and chat with an AI that decides when to trigger these webhooks, fills the required fields, and returns results.

**Tech Stack:**
- [x] Next.js (App Router)
- [x] Firebase (Auth, Firestore, Functions)
- [ ] Stripe Subscriptions
- [x] OpenAI (user-provided API keys)
- [x] **Zod** (Schema validation & JSON typing - v3.23.8)
- [x] **Vercel AI SDK** (Chat implementation & Tool calling - v5)
- [ ] **Shadcn UI** (Design system)
- [x] **React Context** (Client state management - Simple & Lightweight)
- [x] **React Hook Form** (Complex form management)
- [ ] **SWR** (Data fetching & Caching)
- [x] **OpenAI Whisper** (Voice-to-Text)

**Design Philosophy:**
- [x] **Aesthetics**: Premium, polished, and "wow" factor.
    - [x] **Theme**: Dual Mode (Premium Dark Default & Professional Light).
- [x] **UX**: Simple, intuitive, and not over-engineered.

---

## 🎨 Landing Page & Marketing (10x Polish)
A high-performance, immersive landing page designed to convert.

### 1. Visual Experience
- [x] **Global Spotlight**: Mouse-tracking radial gradient that reveals borders and backgrounds.
- [x] **Hero Typewriter**: Animated text cycling ("Automate Finance", "Support", "Everything").
- [x] **Warp Speed**: Konami Code (`↑ ↑ ↓ ↓ ← → ← → b a`) triggers a starfield acceleration effect.
- [x] **Border Beam**: Rotating gradient border for the "Pro" pricing card.

### 2. High-Fidelity Components
- [x] **3D Tilt Cards**: Bento grid items tilt in 3D space based on mouse position.
- [x] **Magnetic Buttons**: CTAs physically pull toward the cursor.
- [x] **Sound Design**: Haptic-like clicks and hovers using Web Audio API.
- [x] **Scroll Reveals**: Cinematic slide-up animations as elements enter the viewport.

### 3. Interactive Demos
- [x] **Hero Chat Simulation**: Interactive "fake" chat that simulates AI processing an action.
- [x] **Live Code**: Typing animation of a JSON payload to visualize data flow.
- [x] **Real AI Demo**:
    - [x] Visitors can chat with a live AI agent in the Hero section.
    - [x] Powered by `gpt-4o-mini` backend.
    - [x] Simulated "Action Completion" responses.

---

## 🚀 Core Features

### 1. Authentication & User Profile
- [x] Email/Password authentication
- [x] Google Sign-In with official branding
- [x] **No guest access** - proper accounts required
- [x] Enhanced sign-up form:
  - [x] Name field (required)
  - [x] Phone number (optional)
  - [x] Avatar upload (optional, base64, <1MB)
- [x] User profile data stored securely
- [x] Google auto-populates name and avatar



### 2. Conversations
- [x] Up to 5 active conversations (v1).
- [x] History of last 10 conversations.
- [x] Each conversation is its own “thread” with independent memory.
- [x] Conversations can be renamed and deleted.
- [x] Each conversation maintains:
    - [x] User messages
    - [x] Assistant messages
    - [x] Webhook execution summaries
        - [x] **"Explain Logic" Trace**: Button to ask AI why it took a specific action (e.g., "Why did you choose 'status: active'?").
- [x] **Constraints**:
    - [x] One webhook call per user turn.
    - [x] **Blocking**: User cannot send new messages until webhook response is received.
    - [ ] No file uploads in v1.
- [x] **UX**:
    - [x] Load last **10 messages** on chat open (pagination/scroll for more).
    - [x] API key validation with warning banner
    - [x] Authentication required - shows login prompt for guests
    - [x] Server-side validation rejects anonymous users

**AI Conversation Memory Rules**
- [x] Only per-conversation memory.
- [ ] No global memory.

---

## 🔗 Webhook Engine
A core feature of the platform.

### 1. Webhook Configuration System
Users can:
- [x] Paste a JSON request template
    - [x] **Support nested JSON objects/arrays (v1)**
- [x] **"Magic Paste" Configurator**: Paste cURL or API Docs URL -> AI auto-fills template.
- [x] UI auto-extracts the fields and displays them in a structured list
- [x] User can mark:
    - [x] Required fields
    - [x] Optional fields
    - [x] Field type
    - [x] Default values
    - [x] Validation rules
- [x] Add custom headers
- [x] Provide a description of what the webhook is for
    - [ ] **Note**: Treated as "General Context" for the AI.
- [x] Add an optional documentation URL
    - [ ] OpenAI uses this for deeper context
    - [ ] Enables future auto-schema generation
- [x] **Editing**: Users can edit webhook configuration at any time.
- [ ] **Templates**: Owners can save/reuse webhook configurations as templates.

### 2. Webhook Versioning (Enabled)
- [x] Each webhook edit creates v1, v2, v3…
- [x] **Retention**: Keep last **2 versions** only.
- [x] Users can view previous versions
- [x] Prevents breaking live flows

### 3. Webhook Testing Sandbox
- [x] **Dry Run / Simulation Mode**: AI generates payload without sending webhook.
- [x] Test payloads
- [x] Preview AI-generated values
- [x] Check response shape
- [ ] Validate webhook status codes

### 4. Webhook Execution Rules (v1)
- [x] Synchronous execution only
- [x] Executed inside Firebase Functions
- [ ] Must finish within user’s tier timeout:
    - [ ] Free: 5 seconds
    - [ ] Pro: 15 seconds
    - [ ] Premium: 60 seconds (Background polling for UI updates)
- [x] User may set timeouts less than their tier max
- [x] **Error Handling**: 
    - [x] Report error to user immediately in chat.
    - [x] **Smart Error Recovery**: AI intercepts 400 errors, self-corrects payload if possible, and asks to retry.
    - [x] No auto-retry fix loop (unless Smart Recovery applies).
    - [x] **Timeout**: Fail immediately with structured error.

### 5. Payload Transformation
- [x] Field mapper transforms LLM-generated values into the proper JSON template
- [x] Only fields inside template are allowed
- [x] **Precedence**: AI extracted value > Default value.
- [x] Supports nested objects with dot notation

---

## 🤖 AI Behavior (OpenAI)
- [x] Users supply their own encrypted OpenAI API keys
- [x] No shared/global OpenAI key
- [x] AI performs two passes:
    1. [x] Determine action (NONE, TRIGGER_WEBHOOK, ASK_CLARIFICATION)
    2. [x] Extract fields needed for the webhook (Missing fields → Assistant asks the user)
    3. [x] **Execute Webhook**

**AI UX & Constraints:**
- [x] **Streaming Responses**: Real-time streaming with Vercel AI SDK
- [ ] **Clarification Timeout**: 5 minutes. UI displays message if timed out.
- [x] Allowed to ask follow-up questions
- [x] Allowed to detect required fields
- [x] Allowed to understand webhook purpose via description
- [x] Allowed to leverage documentation URL (v1, basic usage)
- [x] **Cannot** invent fields not in the template
- [x] **Cannot** exceed timeout limits
- [x] **Cannot** access global memory
- [x] **Cannot** bypass field-type constraints

**Technical Implementation:**
- [x] Vercel AI SDK v5 with proper `tool` function using `inputSchema`
- [x] Zod v3.23.8 for schema validation
- [x] OpenAI function calling for webhook execution
- [x] Streaming text responses to client

---



---

## 💸 Billing & Tiers (Stripe)

### Free
- [ ] 2 Webhooks
- [ ] 5s Timeout Limit
- [ ] User’s OpenAI Key
- [ ] 5 Conversations
- [x] **Team**: 1 User (Owner only - no invites allowed) - **IMPLEMENTED**
- [ ] Note: Good for testing

### Pro — $14/mo
- [ ] 50 Webhooks
- [ ] 15s Timeout Limit
- [ ] User’s OpenAI Key
- [ ] 5 Conversations
- [x] **Team**: Up to **3 Members** (Owner + 2 Admins/Members) - **IMPLEMENTED**
- [ ] Note: For small automations

### Premium — $24/mo
- [ ] 200 Webhooks
- [ ] 60s Timeout Limit
- [ ] User’s OpenAI Key
- [ ] 5 Conversations
- [x] **Team**: Up to **10 Members** (Owner + 9 Admins/Members) - **IMPLEMENTED**
- [ ] Note: Includes auto-retry

**Downgrade Logic**
- [ ] If downgrading (e.g. Premium -> Free), all webhooks are **paused**.
- [ ] User must manually select which (max 2) webhooks to re-enable.

**Premium Extras**
- [ ] Automatic webhook retries
- [ ] Future integration marketplace
- [ ] Faster execution priority

---

## 📊 Analytics Dashboard
- [x] Webhook success/failure rate
- [x] Execution time (avg, max, histogram)
- [x] Daily/Weekly/Monthly usage charts (Date Range Selector Implemented)
- [x] Token usage estimation (Mock Data)
- [x] Top-triggered webhooks
- [x] Error logs (Recent Execution Table Implemented)

---

## 🔐 Security Features
- [x] Firebase Auth + Firestore rules
- [x] **Role-based permissions (COMPLETED)**
    - [x] **Owner**: Workspace creator, full administrative access, cannot be removed
    - [x] **Admin**: Full admin access (manage team, all webhooks), can change Member roles, can be removed by Owner
    - [x] **Member**: Standard team member, limited to own webhooks and conversations
    - [ ] **Developer**: Cross-workspace role for managing client accounts (v2 feature - $10/mo add-on)
- [x] **Workspace Model (COMPLETED)**
    - [x] Multi-tenant workspace isolation
    - [x] Firestore security rules with role-based access control
    - [x] Workspace-scoped data (webhooks, conversations, executions)
    - [x] Each user belongs to one or more workspaces
    - [x] `currentWorkspaceId` tracks active workspace
    - [x] **Webhook Permissions (RBAC + Exceptions)**: Granular control over who can trigger specific webhooks.
- [x] **Team Management (COMPLETED)**
    - [x] Invite team members via email
    - [x] Token-based invitation system (7-day expiration)
    - [x] Role assignment (Admin/Member)
    - [x] Remove team members (Owner/Admin)
    - [x] Change member roles (Owner only)
    - [x] View pending invitations
    - [x] Seat limits enforced (Free: 1, Pro: 3, Premium: 10)
    - [ ] Email integration for invitations (pending)
- [x] Encrypted storage for:
    - [x] OpenAI API keys (**Server-side encryption**, stored in Firebase)
    - [ ] Webhook secrets
    - [x] Header tokens
- [x] Rate limiting:
    - [x] Configurable by Owner (**Per Webhook**)
- [ ] No sensitive data masking (per your choice)
- [ ] Webhook logs stored securely
- [x] **Notifications**: Email for Password Reset only (v1).
- [x] **Authentication Security**:
    - [x] **No Guest Access** - All users must authenticate
    - [x] Client-side auth check in protected routes
    - [x] Server-side validation in API routes
    - [x] Anonymous users blocked from chat
- [x] **Account Settings**:
    - [x] **Profile**: Name, Avatar, Phone Number.
    - [x] **Security**: Change Password (SSO Handling).
    - [x] **Team**: Invite, Remove, Change Roles.
    - [ ] **Security**: 2FA.
    - [ ] **Data**: Export Data, Delete Account.
    - [ ] **Sessions**: View active sessions, Sign out all.
    - [x] **UI Polish**: Complete redesign of Settings to match "Orange/Glass" theme.

---

## 📱 Platforms & Future Scope

### Version 1
- [ ] Web app only
- [ ] Responsive UI (usable on mobile browsers)
    - [x] **Navigation**: Sidebar Drawer.
    - [x] **Voice Command**: Whisper integration for voice-to-text input.

### Version 2 (Future)
- [ ] Native mobile apps
- [ ] Push notifications
- [ ] Background automation triggers
- [ ] File attachments.
- [ ] **"Reverse Webhooks"**: Inbound URLs that trigger AI chats.
- [ ] **Human-in-the-Loop "Nuclear Codes"**: Critical action confirmation.
- [ ] **Context "Pinning"**: Pin messages to context window.
- [ ] **"Chaos Monkey" Testing**: Random data testing.
- [ ] **Browser Extension**: Inject sidebar into any website.
- [ ] **Webhook Mocking (Faker Mode)**: Fake responses for testing.
- [ ] **Self-Destructing Conversations**: Auto-delete history.
- [ ] **Cron-by-Chat**: Schedule webhooks via natural language.
- [ ] **Multi-Modal Response**: Render images/charts in chat.
- [ ] **Template Marketplace (Community)**: Public library of templates.
- [ ] **The 'Undo' Button**: Compensating transactions.

---

## 🛠 Developer Features
**Developer Dashboard (multi-owner support)**
A developer can:
- [ ] Switch between Owners / Clients
- [ ] Manage webhook templates for each client
- [ ] View execution logs
- [ ] Test webhooks
- [ ] Debug AI field generation

---

## 🌐 Future Integrations (Version 2)
### 1. Integration Marketplace (approved)
- [ ] Slack
- [ ] Notion
- [ ] Google Calendar
- [ ] Make.com
- [ ] Zapier
- [ ] Webflow
- [ ] Stripe events
- [ ] CRMs



---

## 💰 Monetization Expansion Ideas
### 1. Premium Marketplace Items
- [ ] Paid prebuilt webhook templates
- [ ] Paid premium integrations (Google Calendar, Slack, Notion)
- [ ] White-label deployment

### 2. Usage-based Add-ons
- [ ] More webhooks
- [ ] Higher timeout windows
- [ ] Dedicated developer seats
- [ ] Priority processing queue
- [ ] SLA-backed “enterprise automation”

### 3. Private Cloud / Enterprise
- [ ] Admin dashboard
- [ ] Team analytics
- [ ] SOC2 mode
- [ ] SSO + user provisioning

---

## 📅 Roadmap Summary

### Version 1 (Current Focus)
- [x] Webhooks system
- [x] Chat with AI
- [x] Synchronous actions
- [x] Conversations (5 max)
- [x] **Role-based permissions (Owner, Admin, Member)** - **COMPLETED**
- [x] **Workspace model with multi-tenancy** - **COMPLETED**
- [x] **Team management (invite, remove, role changes)** - **COMPLETED**
- [x] Basic analytics (Dashboards, Date Range, Logs)
- [ ] Billing tiers (Stripe integration pending)
- [ ] Developer multi-owner dashboard (v2)
- [x] Rate limiting (Tier-based enforcement logic)
- [x] **New**: Magic Paste, System Persona, Explain Logic, Smart Error Recovery, Voice Command.
- [x] **Dev Tools**: Tier Switch for testing limits.
- [x] **Landing Page**: 10x Polish, Interactive Demos, Real AI Integration.

### Version 2
- [ ] Integration Marketplace

- [ ] Mobile app
- [ ] Auto-scraped webhook docs
- [ ] Auto-suggested field validation
- [ ] Automatic retry system
- [ ] Asynchronous webhooks
- [ ] Webhook chaining
- [ ] Workflow builder
- [ ] **New**: Reverse Webhooks, Nuclear Codes, Context Pinning, Chaos Monkey.
- [ ] **New**: Browser Extension, Webhook Mocking, Self-Destructing Chats, Cron-by-Chat, Multi-Modal, Template Marketplace, Undo Button.

---

## 📝 Implementation Notes & Context

### 1. Stability & Robustness (Fixes)
- **Type Safety**: strict separation between Firestore `AuthUser` and Firebase `User` types to prevent runtime errors (e.g., `getIdToken`).
- **Dashboard**: Fixed infinite loading loops and `useEffect` dependency stability for reliable analytics loading.
- **Build System**: Resolved static generation issues for API routes using dynamic rendering directives.
- **Database**: Optimized Firestore composite indexes for high-performance Analytics queries.

### 2. State Management & Architecture
- **React Context vs. Zustand**: We chose **React Context** for v1 to keep the dependency tree minimal. The app's global state (User Session, Sidebar Toggle, Theme) is simple enough for Context. Complex data (Webhooks) is handled by **SWR**, which provides its own caching and state.
- **Form Handling**: We are using **React Hook Form** + **Zod** because webhook configuration involves complex, nested JSON structures and dynamic validation rules. Standard React state would be too slow and verbose.
- **Chat Engine**: **Vercel AI SDK** is the chosen driver. It abstracts the complexity of streaming, tool calling (our Webhook Engine), and UI updates.

### 2. UX Decisions
- **Blocking Chat**: We deliberately **block** the user from sending new messages while a webhook is executing. This prevents "context drift" where the user changes the topic before the AI has finished the previous action.
- **Fail Fast**: For errors (timeouts, 500s), we **fail immediately** and show the error. We do NOT auto-retry in v1 (except for the specific "Smart Error Recovery" where the AI fixes a 400 Bad Request). This avoids infinite loops and wasted tokens.


### 3. Billing Strategy
- **Seat Limits**: Instead of charging per seat (which complicates Stripe integration), we use **Seat Limits** (1/3/10) on the plans. This encourages upgrades to Premium for larger teams without adding billing friction.
- **Developer Add-on**: The $10/mo Developer Add-on is a separate line item. It allows a user (even on Free) to access the "Developer Dashboard" to manage *other people's* webhooks.

### 4. Security
- **API Keys**: Stored **Server-Side** (Firebase Functions/Firestore) with encryption. Never exposed to the client.
- **Rate Limiting**: Applied **Per Webhook**. This gives Owners granular control. If one webhook is spammy, it doesn't block the entire account.
