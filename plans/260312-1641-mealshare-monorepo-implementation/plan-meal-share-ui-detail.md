---
title: "MealShare UI Design - Detailed Plan"
description: "Complete UI specification for all screens, design system, components, and user flows"
status: pending
priority: P1
created: 2026-03-16
---

# MealShare UI Design — Detailed Plan

## Design System

### Philosophy
Flat Design with clean hierarchy. Food-focused orange primary, minimal chrome, maximum data visibility. Think: Notion meets a meal-tracking app — calm, functional, warm.

### Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Primary (Orange) | `#F97316` | CTAs, active states, brand |
| Primary Dark | `#EA580C` | Hover states, pressed |
| Primary Light | `#FFF7ED` | Active nav bg, hover bg |
| Background | `#F8FAFC` | Page/content bg |
| Surface | `#FFFFFF` | Cards, modals, inputs |
| Sidebar | `#111827` | Navigation sidebar |
| Sidebar Active | `#1F2937` | Active nav item bg |
| Text Primary | `#1E293B` | Headings, body |
| Text Secondary | `#64748B` | Labels, descriptions |
| Text Muted | `#94A3B8` | Placeholders, timestamps |
| Border | `#E2E8F0` | Input borders, dividers |
| Success | `#10B981` | Confirmed status, positive |
| Warning | `#F59E0B` | Draft status, caution |
| Error | `#EF4444` | Errors, remove actions |
| Leader Purple | `#8B5CF6` | Leader role badge |
| Info Blue | `#3B82F6` | Info states, links |

### Typography

- **Font Family**: Inter (all weights)
- **Import**: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');`

| Scale | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| H1 | 32px | 700 | 1.25 | Page headings |
| H2 | 24px | 700 | 1.3 | Section headings |
| H3 | 20px | 600 | 1.4 | Card titles |
| H4 | 16px | 600 | 1.4 | Sub-sections |
| Body | 15px | 400 | 1.6 | Main content |
| Small | 13px | 400 | 1.5 | Labels, captions |
| XSmall | 11px | 500 | 1.4 | Badges, tags |

### Spacing System (8px base)
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px, 3xl: 64px

### Border Radius
- Input/Button: 8px
- Card: 12px
- Modal: 16px
- Avatar: 9999px (full)
- Badge: 9999px (full)

### Shadows
- Card: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- Modal: `0 20px 25px -5px rgba(0,0,0,0.1)`
- Dropdown: `0 4px 6px -1px rgba(0,0,0,0.1)`

### Component Dimensions
- Input height: 44px (meets touch target)
- Button height: 44px (primary), 36px (secondary/ghost)
- Sidebar width: 240px
- Topbar height: 64px
- Card padding: 24px
- Page padding: 32px

---

## Layout System

### Auth Layout (Screens 01–02)
```
┌─────────────────────────────────────────────┐
│   Brand Panel (620px)   │  Form Panel (820px) │
│   Orange gradient       │  White, centered form│
│   - Logo + app name     │  - Input fields      │
│   - Tagline             │  - Primary button    │
│   - Feature highlights  │  - OAuth option      │
└─────────────────────────────────────────────┘
```

### Dashboard Layout (Screens 03–15)
```
┌──────────────────────────────────────────────────────┐
│  Top Bar (1440 × 64px)  — white, border-bottom        │
│  [Logo] [App Name]  [Page Title]  [Bell] [Avatar]     │
├────────────────┬─────────────────────────────────────┤
│  Sidebar       │  Content Area (1200 × 836px)         │
│  (240 × 836px) │  Background: #F8FAFC                 │
│  #111827       │  padding: 32px                       │
│  Nav items     │  max-content-width: 1136px           │
└────────────────┴─────────────────────────────────────┘
```

### Sidebar Navigation Items
1. Home (dashboard icon) → /groups
2. My Groups (users icon) → /groups
3. Notifications (bell icon)
4. Profile (user icon) → /profile
5. Settings (cog icon) → /settings [bottom]

### Group Tab Navigation (within Group screens)
```
[Overview] [Menu] [Vote] [Orders] [Chat] [Analytics]
```
- Underline active tab with orange, 2px
- Tab height: 48px, font: 14px/600

---

## Screen Inventory

| # | Screen Name | Route | Access | Priority |
|---|-------------|-------|--------|----------|
| 01 | Login | `/login` | Public | P1 |
| 02 | Register | `/register` | Public | P1 |
| 03 | My Groups | `/groups` | Auth | P1 |
| 04 | Create Group | `/groups/create` | Auth | P1 |
| 05 | Group Overview | `/groups/:id` | Member | P1 |
| 06 | Group Settings | `/groups/:id/settings` | Leader | P2 |
| 07 | Join Group | `/join?code=XXX` | Auth | P1 |
| 08 | Admin Menu Items | `/admin/menu-items` | Admin | P2 |
| 09 | Weekly Menu (Leader) | `/groups/:id/menu` | Leader | P1 |
| 10 | Weekly Menu (Member) | `/groups/:id/menu` | Member | P1 |
| 11 | Vote Page | `/groups/:id/vote` | Member | P1 |
| 12 | Daily Orders | `/groups/:id/orders` | Member | P1 |
| 13 | Group Chat | `/groups/:id/chat` | Member | P1 |
| 14 | Analytics – Personal | `/groups/:id/analytics` | Member | P2 |
| 15 | Analytics – Group | `/groups/:id/analytics` | Member/Leader | P2 |

---

## Detailed Screen Specifications

### 01 – Login

**Layout**: Auth split (brand + form)
**Route**: `/login`

#### Brand Panel (left, 620px, orange #F97316)
- Logo: white circle (64px) with fork+plate SVG icon
- App name: "MealShare" — 40px/700, white
- Tagline: "Group meal management, simplified" — 16px/400, #FED7AA
- Feature pills (3x, white bg, 15% opacity):
  - "Track group meal expenses"
  - "Vote on weekly menus"
  - "Real-time group chat"

#### Form Panel (right, 820px, white)
- Container: 480px wide, centered vertically
- "Welcome back" — 32px/700, #1E293B
- "Sign in to continue to MealShare" — 15px/400, #64748B
- Email label + input (44px, placeholder: "name@company.com")
- Password label + input (44px) + "Forgot password?" link (orange)
- **Sign In** button — full width, 44px, orange, white text
- Divider "or"
- **Continue with Google** button — white, gray border, Google SVG icon
- "Don't have an account? **Sign up**" link (small, centered)

#### States
- Error: red border on invalid field + error message below
- Loading: button text changes to spinner + "Signing in..."

---

### 02 – Register

**Layout**: Auth split
**Route**: `/register`

#### Brand Panel
Same as Login.

#### Form Panel
- "Create your account" — 32px/700
- "Join your team on MealShare" — 15px/400, gray
- Full Name input
- Email input
- Password input + strength indicator (4-segment bar)
- Confirm Password input
- **Create Account** button — full width, orange
- "or continue with Google" button
- "Already have an account? **Sign in**" link

---

### 03 – My Groups

**Layout**: Dashboard
**Route**: `/groups`

#### Content Area
- Page header row: "My Groups" H1 + **"+ Create Group"** button (orange, right)
- Group cards grid (3 columns, 24px gap):
  ```
  ┌─────────────────────────┐
  │  [Avatar 48px]           │
  │  Group Name  [Leader 🟣] │
  │  Brief description...    │
  │  👥 8 members            │
  │  [View Group]            │
  └─────────────────────────┘
  ```
- Each card: white, 12px radius, 24px padding, hover: shadow-md
- Role badge: "Leader" = purple bg, "Member" = gray bg
- Empty state (no groups):
  - Fork-plate illustration placeholder
  - "No groups yet" — 20px/600
  - "Create a group to start tracking meals" — gray
  - **Create your first group** button

---

### 04 – Create Group

**Layout**: Dashboard, centered form card
**Route**: `/groups/create`

#### Content Area
- Breadcrumb: Home > Groups > Create Group
- Form card (640px centered, white, 24px padding):
  - "Create New Group" — H2
  - "Name" label + input (placeholder: "e.g., Office Lunch Squad")
  - "Description" label + textarea (4 rows, optional)
  - Button row: **Create Group** (orange) + Cancel (ghost)
- Success state (post-create) — shown as modal overlay:
  - "Group created!" — H3, success icon
  - Invite code display: monospace large text, copy icon
  - Share link: read-only input with copy button
  - **View Group** button

---

### 05 – Group Overview

**Layout**: Dashboard with group header + tabs
**Route**: `/groups/:id`

#### Group Header (below topbar)
- White strip, 72px tall, border-bottom
- [Group avatar 48px] | **Group Name** 20px/600 | 8 members | [Leader badge]
- Tab bar: Overview | Menu | Vote | Orders | Chat | Analytics

#### Overview Tab Content
- 2-column layout (60% / 40%):
  - **Left: Activity Feed**
    - "Recent Activity" — H3
    - Activity items (icon + message + time):
      - System: "📊 Daily summary posted"
      - Member join: "Minh joined the group"
      - Order: "Lan placed today's order"
  - **Right: Quick Stats**
    - "This Week" card: large amount + "₫ 240,000" green text
    - "Active Members" card: count + avatar stack
    - "Invite Code" card: monospace code + copy button

---

### 06 – Group Settings

**Layout**: Dashboard
**Route**: `/groups/:id/settings`

#### Content — 2 sections

**Section 1: Group Info Card** (white card)
- "Group Settings" H2 + Leader badge
- Name input (pre-filled)
- Description textarea (pre-filled)
- **Save Changes** button + Cancel link

**Section 2: Invite Code Card** (white card)
- "Invite Code" H3
- Monospace code display (gray bg, 16px) + **Copy** button
- Invite URL input (read-only) + copy icon
- **Regenerate Code** button (orange outline)

**Section 3: Members Card** (white card)
- "Members (8)" H3
- Member list rows:
  ```
  [Avatar] Name        [Leader] [•••]
  [Avatar] Name        [Member] [Remove]
  ```
- Each row: 56px tall, divider between rows
- Remove button: red ghost, confirmation dialog

---

### 07 – Join Group

**Layout**: Centered page (no sidebar, minimal nav)
**Route**: `/join?code=XXXXXX`

#### Centered Container (640px max)
- MealShare logo + name (centered top)
- "Join a Group" — H1, centered
- Group preview card (white, 12px radius, 24px pad):
  - Group avatar (64px) + name + description
  - Member count + creation date
- **Join Group** button (full width, orange)
- "Already a member? **View group →**" link
- Error state: "Invalid invite code. Please check the link."
- Already member state: redirect card with "You're already a member" message

---

### 08 – Admin Menu Items

**Layout**: Dashboard with admin nav
**Route**: `/admin/menu-items`

#### Sidebar (admin nav items)
- Menu Catalog (active, orange)
- Users
- Groups

#### Content Area
- Page header: "Menu Catalog" H1 + **"+ Add Item"** button
- Filter row: Search input | Category dropdown | [pagination controls]
- Data table (white card):
  ```
  | Image | Name           | Category | Created    | Actions      |
  |-------|----------------|----------|------------|--------------|
  | [48px]| Cơm Tấm        | Rice     | Mar 15     | Edit | Delete |
  | [48px]| Phở Bò         | Noodle   | Mar 14     | Edit | Delete |
  ```
- Category badges: Rice=blue, Noodle=green, Soup=yellow, Drink=cyan, Other=gray
- Empty state: "No menu items. Add your first dish!"

#### Add/Edit Item Dialog (modal, 560px)
- "Add Menu Item" / "Edit Menu Item" H3
- Name input
- Description textarea
- Category dropdown (Rice / Noodle / Soup / Drink / Other)
- Image upload dropzone:
  ```
  ┌────────────────────────────────┐
  │  ↑  Drag & drop or click       │
  │     JPG, PNG, WebP  max 5MB    │
  └────────────────────────────────┘
  ```
- Image preview (if uploaded)
- **Save** button + Cancel

---

### 09 – Weekly Menu (Leader View)

**Layout**: Dashboard, Menu tab active
**Route**: `/groups/:id/menu`

#### Content
- Week selector: "← Mar 10 – Mar 16, 2026 →" (prev/next arrows)
- Status badge: **Draft** (yellow) | **Confirmed** (green)
- If Draft → show builder panel:
  - "Add Dishes to This Week" — H3
  - Dish list table (added items):
    ```
    [img] Cơm Tấm    Rice    Price: [₫35,000 input] [×]
    [img] Canh Chua   Soup    Price: [₫25,000 input] [×]
    ```
  - **+ Add Dish** button → opens picker panel
  - Action buttons row: **Confirm Menu** (orange) | **Save Draft** (ghost)
  - Validation: "Confirm" disabled if no items added
- If Confirmed → show member view (same as Screen 10)
- Dish Picker Drawer (slide-in, 360px):
  - Search input
  - Category filter chips
  - Item cards: [img 40px] Name | Category | **+Add** button
  - Selected items highlight in green

---

### 10 – Weekly Menu (Member View)

**Layout**: Dashboard, Menu tab active
**Route**: `/groups/:id/menu`

#### Content
- Week selector (display only)
- Status badge: **Confirmed** (green)
- Menu table (white card):
  ```
  | Dish         | Category | Price     |
  |--------------|----------|-----------|
  | Cơm Tấm      | Rice     | ₫35,000   |
  | Phở Bò       | Noodle   | ₫40,000   |
  | Canh Chua    | Soup     | ₫25,000   |
  ```
- Summary: "3 dishes available this week"
- **Go to Orders** CTA button (orange, full-width card bottom)
- No menu state: gray card with "No menu confirmed for this week. Check back later."

---

### 11 – Vote Page

**Layout**: Dashboard, Vote tab active
**Route**: `/groups/:id/vote`

#### Content
- Page header: "Weekly Vote" + **Create Vote** button (leader only, orange)
- **Active Votes** section:
  - Vote card (white, 12px radius):
    ```
    ┌──────────────────────────────────────┐
    │ "What should we eat this week?"       │
    │ Closes in: [2h 30m] ⏱               │
    │                                       │
    │ ○  Cơm Tấm                           │
    │ ○  Phở Bò                            │
    │ ○  Bánh Mì                           │
    │                                       │
    │ [Submit Vote]                         │
    └──────────────────────────────────────┘
    ```
  - "Already voted" state: show results inline + green checkmark
- **Past Votes** section (accordion):
  - Closed vote cards with results bars:
    ```
    Cơm Tấm  ████████████░░  60% (6 votes)  [Winner ✓]
    Phở Bò   ████░░░░░░░░░░  30% (3 votes)
    Bánh Mì  █░░░░░░░░░░░░░  10% (1 vote)
    ```
- Create Vote Modal:
  - Title input
  - Week selector
  - Deadline datetime picker
  - Multi-select dishes from weekly menu
  - **Create Vote** button

---

### 12 – Daily Orders

**Layout**: Dashboard, Orders tab active
**Route**: `/groups/:id/orders`

#### Content — Participant View
- Date selector: "← Mon, Mar 16 →" (prev/next)
- "Today's Orders" section:
  - Order form (white card):
    ```
    | Dish        | Price    | Qty  | Total    |
    |-------------|----------|------|----------|
    | Cơm Tấm     | ₫35,000  | [-1+]| ₫35,000  |
    | Canh Chua   | ₫25,000  | [-0+]| ₫0       |
    ```
  - Day total row: "Today's Total: **₫35,000**"
  - **Save Orders** button
- "My Week Summary" card (collapsible):
  - Table: Mon–Fri rows with total per day
  - Weekly total at bottom

#### Leader Toggle
- "Group View" tab switch at top
- Group orders table:
  ```
  | Member    | Dishes    | Today's Total |
  |-----------|-----------|---------------|
  | Minh N.   | Cơm Tấm   | ₫35,000       |
  | Lan T.    | Phở Bò    | ₫40,000       |
  |           | Group Total| ₫75,000      |
  ```

---

### 13 – Group Chat

**Layout**: Dashboard, Chat tab active — full height, no scroll
**Route**: `/groups/:id/chat`

#### Chat Layout (flex column, fills content area)
```
┌──────────────────────────────────────────┐
│  Chat Header: Group Name + members count  │
├──────────────────────────────────────────┤
│                                           │
│   — System: "📊 Daily summary: ₫240k" —  │
│                                           │
│         Minh: Hey everyone!        [10:30]│
│               Great lunch today!   [10:31]│
│                                           │
│   [Your msg goes here]             [12:00]│ ← right, orange bg
│                                           │
│   Lan: Thanks!                     [12:01]│
│   (edited)                                │
│                                           │
│   [Message deleted]                       │
│                                           │
├──────────────────────────────────────────┤
│  [Avatar] [Type a message...    ] [Send →]│
└──────────────────────────────────────────┘
```

**Message Bubbles:**
- Own: right-aligned, orange bg (#F97316), white text, 12px radius
- Others: left-aligned, white bg, dark text, gray border
- System: centered, gray italic text, no avatar
- Deleted: "Message deleted" — gray italic, no content
- Edited: `(edited)` small text below bubble

**Message Input:**
- Fixed bottom, white bg, border-top
- Text area (grows to 4 lines max), Enter = send, Shift+Enter = newline
- Send button (orange icon button)
- Edit mode: orange top border on input + "Editing... [Cancel]"

---

### 14 – Analytics – Personal

**Layout**: Dashboard, Analytics tab active
**Route**: `/groups/:id/analytics`

#### Content
- Tabs: **Personal** (active) | Group
- Period selector: Week | Month | 3 Months
- Summary cards row (3 columns):
  ```
  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
  │ This Week      │ │ Daily Avg      │ │ vs Last Week   │
  │ ₫240,000       │ │ ₫48,000        │ │ ↑ +12%         │
  │ 5 orders       │ │ per day        │ │ (green badge)  │
  └────────────────┘ └────────────────┘ └────────────────┘
  ```
- Expense Trend Chart (line chart, white card):
  - X: days/weeks, Y: VND amount
  - Orange line, subtle fill below
  - Hover tooltip: date + amount
  - Chart height: 240px

- Top Dishes (white card):
  ```
  1.  [img] Cơm Tấm     12 orders  ₫420,000  ████████████
  2.  [img] Phở Bò       8 orders  ₫320,000  ████████░░░░
  3.  [img] Canh Chua    5 orders  ₫125,000  █████░░░░░░░
  ```

---

### 15 – Analytics – Group

**Layout**: Dashboard, Analytics tab active
**Route**: `/groups/:id/analytics`

#### Content
- Tabs: Personal | **Group** (active)
- Week selector
- Group total card (orange accent):
  ```
  ┌─────────────────────────────────────────┐
  │  Week of Mar 10–16, 2026                │
  │  Group Total: ₫1,680,000               │
  │  8 members · 40 orders                  │
  └─────────────────────────────────────────┘
  ```
- Member Breakdown table (white card):
  ```
  | Member    | Orders | Spend     | % of Group    |
  |-----------|--------|-----------|---------------|
  | Minh N.   |   8    | ₫280,000  | ██████ 17%    |
  | Lan T.    |   6    | ₫210,000  | ████░░ 12%    |
  | ...       |  ...   |   ...     | ...           |
  ```
- Distribution chart (donut, white card):
  - Each member = colored segment
  - Legend below: color dot + name + amount

---

## Component Library

### Navigation
- `<Topbar>` — logo, page title, bell icon, user avatar menu
- `<Sidebar>` — dark bg, nav items with icons, active orange indicator
- `<GroupHeader>` — avatar, name, member count, role badge, tab nav
- `<Breadcrumb>` — Home > ... > Current

### Form Components
- `<Input>` — label, placeholder, error state, 44px height
- `<Textarea>` — label, char count, resize vertical only
- `<Select>` — searchable dropdown, category icons
- `<WeekPicker>` — prev/next arrows, current week label
- `<DatePicker>` — calendar dropdown
- `<ImageUpload>` — drag & drop zone, preview, file validation
- `<QuantityStepper>` — minus / value / plus, min=0

### Display Components
- `<GroupCard>` — avatar, name, description, member count, role badge, CTA
- `<MemberRow>` — avatar, name, role badge, joined date, actions
- `<MenuItemCard>` — image 48px, name, category badge, price
- `<OrderRow>` — dish info, quantity stepper, total
- `<VoteCard>` — title, deadline countdown, options, submit
- `<VoteResults>` — bar chart with percentages, winner highlight
- `<MessageBubble>` — own/other/system/deleted states
- `<SystemMessage>` — centered, muted, icon indicator
- `<AnalyticsCard>` — metric, label, trend badge

### Charts (Recharts via shadcn/ui)
- `<ExpenseLineChart>` — trend over time, orange line
- `<WeeklyBarChart>` — comparison by week/member
- `<MemberDonutChart>` — distribution
- `<TopDishesBarList>` — horizontal bars, ranked

### Feedback
- `<Toast>` — success (green), error (red), info (blue) — top-right, 3s auto-dismiss
- `<Skeleton>` — loading placeholders for cards, tables, charts
- `<EmptyState>` — illustration, heading, CTA
- `<ConfirmDialog>` — modal, destructive action text, Cancel/Confirm
- `<Badge>` — role (Leader=purple, Member=gray), status (Confirmed=green, Draft=yellow)
- `<InviteCode>` — monospace display, copy button, share link

---

## User Flows

### Flow 1: New User Onboarding
```
Register → My Groups (empty state) → Create Group → Invite code shown
→ Share code → Group Overview → Add dishes to menu
```

### Flow 2: Weekly Setup (Leader)
```
Group Overview → Menu Tab → Create Draft → Add Dishes (picker) → Set prices
→ Confirm Menu → Vote Tab → Create Vote → Set deadline + options → Share
```

### Flow 3: Weekly Participation (Member)
```
Login → My Groups → Select Group → View Confirmed Menu
→ Orders Tab → Select today's dishes → Set quantities → Save
→ Chat Tab → Send message
```

### Flow 4: Daily Tracking
```
Login → Group → Orders Tab → View today's summary
→ Analytics Tab → Check personal spend → Compare with group
→ Chat Tab → See daily summary system message (8PM auto)
```

### Flow 5: Admin Catalog Management
```
Login (admin) → Admin sidebar → Menu Catalog
→ Add new dish → Upload image → Set category → Save
→ Items appear in leader's dish picker for weekly menus
```

---

## Accessibility Checklist

- [ ] All inputs have associated `<label>` elements
- [ ] Color is never the only indicator (badges have text too)
- [ ] Minimum 44×44px touch targets for all interactive elements
- [ ] Focus rings visible on all interactive elements (orange outline)
- [ ] WCAG AA contrast: 4.5:1 for normal text, 3:1 for large text
- [ ] `aria-label` on icon-only buttons (copy, edit, delete)
- [ ] Form error messages linked via `aria-describedby`
- [ ] `alt` text on all meaningful images
- [ ] Keyboard navigation: Tab order matches visual order
- [ ] Chat auto-scroll uses `aria-live="polite"` for screen readers
- [ ] `prefers-reduced-motion` respected for animations

---

## Implementation Notes

### Shadcn/ui Components Map
| UI Element | shadcn Component |
|-----------|-----------------|
| Buttons | `<Button variant="default/outline/ghost">` |
| Form inputs | `<Input>`, `<Textarea>` |
| Dialogs | `<Dialog>`, `<AlertDialog>` |
| Dropdowns | `<Select>`, `<DropdownMenu>` |
| Tabs | `<Tabs>`, `<TabsList>`, `<TabsTrigger>` |
| Badges | `<Badge>` |
| Cards | `<Card>`, `<CardHeader>`, `<CardContent>` |
| Charts | `<ChartContainer>` (Recharts wrapper) |
| Skeletons | `<Skeleton>` |
| Toasts | `<Sonner>` or `<Toast>` |
| Date picker | `<Calendar>` + `<Popover>` |

### Next.js Route Structure
```
app/
├── (auth)/
│   ├── login/page.tsx           (Screen 01)
│   └── register/page.tsx        (Screen 02)
├── (dashboard)/
│   ├── layout.tsx               (Sidebar + Topbar)
│   ├── groups/
│   │   ├── page.tsx             (Screen 03)
│   │   ├── create/page.tsx      (Screen 04)
│   │   └── [groupId]/
│   │       ├── layout.tsx       (Group Header + Tabs)
│   │       ├── page.tsx         (Screen 05 – Overview)
│   │       ├── settings/page.tsx (Screen 06)
│   │       ├── menu/page.tsx    (Screen 09/10)
│   │       ├── vote/page.tsx    (Screen 11)
│   │       ├── orders/page.tsx  (Screen 12)
│   │       ├── chat/page.tsx    (Screen 13)
│   │       └── analytics/page.tsx (Screen 14/15)
│   └── admin/
│       └── menu-items/page.tsx  (Screen 08)
└── join/page.tsx                (Screen 07)
```
