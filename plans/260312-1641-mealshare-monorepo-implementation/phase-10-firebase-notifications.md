---
title: "Phase 10 - Firebase Notifications"
status: pending
priority: P2
effort: 1.5h
---

# Phase 10: Firebase Notifications

## Context Links
- Parent: [plan.md](./plan.md)
- Research: [Stack Research](./research/stack-research-turborepo-next-nestjs-supabase-integration.md)
- Dependencies: Phase 03 (user fcm_token), Phase 09 (cron jobs trigger notifications)

## Overview
Integrate Firebase Cloud Messaging (FCM) in NestJS for push notifications. Register FCM tokens from frontend. Send notifications on key events: vote created, menu confirmed, daily reminder, invite received, price summary.

## Key Insights
- Firebase Admin SDK in NestJS for server-side sending
- `sendEachForMulticast` for group notifications (handles individual token failures)
- Store `fcm_token` in users table, update on each login/app load
- Clear invalid tokens on `messaging/registration-token-not-registered` error
- Frontend uses Firebase JS SDK for token registration + foreground notifications

## Requirements

### Functional
- FCM token registration (frontend → backend → store in users table)
- Notifications for: vote created, weekly menu confirmed, daily food reminder, member joined, price summary
- Store notifications in `notifications` table for in-app notification center
- Mark notifications as read
- Foreground notification toast in frontend

### Non-functional
- Batch send for group notifications
- Handle token expiry gracefully
- Notification deduplication (don't re-send for same event)

## Architecture

### Notification Flow
```
Event occurs (e.g., vote created)
→ NestJS NotificationsService.notifyGroup(groupId, payload)
→ Query active members' FCM tokens
→ sendEachForMulticast(tokens, notification)
→ Insert into notifications table
→ Handle failed tokens (remove invalid ones)
```

### Frontend FCM Setup
```
App load → request notification permission
→ getToken(messaging, { vapidKey })
→ POST /users/fcm-token { token }
→ onMessage(messaging, callback) for foreground
```

## Related Code Files

### Files to Create (Backend)
- `apps/api/src/firebase/firebase.module.ts`
- `apps/api/src/firebase/firebase.service.ts`
- `apps/api/src/modules/notifications/notifications.module.ts`
- `apps/api/src/modules/notifications/notifications.controller.ts`
- `apps/api/src/modules/notifications/notifications.service.ts`

### Files to Create (Frontend)
- `apps/web/src/lib/firebase.ts` — Firebase client init
- `apps/web/src/hooks/use-notifications.ts` — FCM registration + foreground handling
- `apps/web/src/components/notifications/notification-bell.tsx` — header icon with badge
- `apps/web/src/components/notifications/notification-list.tsx` — dropdown list
- `apps/web/public/firebase-messaging-sw.js` — service worker for background notifications

### Files to Modify
- `apps/api/src/app.module.ts` — import FirebaseModule, NotificationsModule
- `apps/api/src/modules/users/users.controller.ts` — add FCM token update endpoint
- `apps/api/src/modules/votes/votes.service.ts` — trigger notification on vote create
- `apps/api/src/modules/weekly-menus/weekly-menus.service.ts` — trigger on confirm
- `apps/api/src/modules/groups/groups.service.ts` — trigger on member join
- `apps/api/src/modules/analytics/cron/daily-summary.cron.ts` — uncomment FCM send

## Implementation Steps

### Backend

1. **Create FirebaseModule + FirebaseService**
   ```typescript
   @Injectable()
   export class FirebaseService implements OnModuleInit {
     private app: App;
     onModuleInit() {
       const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
       this.app = initializeApp({ credential: cert(serviceAccount) });
     }
     async sendToUser(token: string, title: string, body: string, data?: Record<string, string>) {
       try {
         await getMessaging(this.app).send({
           token, notification: { title, body }, data
         });
       } catch (err) {
         if (err.code === 'messaging/registration-token-not-registered') {
           // Remove invalid token
         }
       }
     }
     async sendToMultiple(tokens: string[], title: string, body: string, data?: Record<string, string>) {
       if (!tokens.length) return;
       const response = await getMessaging(this.app).sendEachForMulticast({
         tokens, notification: { title, body }, data
       });
       // Handle failures: remove invalid tokens
       response.responses.forEach((resp, idx) => {
         if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
           // Remove tokens[idx]
         }
       });
     }
   }
   ```

2. **Create NotificationsModule + NotificationsService**
   - `notifyUser(userId, title, body, type, data?)`: send FCM + insert notification record
   - `notifyGroup(groupId, title, body, type, data?, excludeUserId?)`: get group member tokens → sendToMultiple → insert records
   - `findByUser(userId, unreadOnly?)`: list notifications
   - `markAsRead(notificationId, userId)`: set read_at
   - `markAllAsRead(userId)`: set read_at on all

3. **Create NotificationsController**
   - `GET /notifications` — list user's notifications (auth)
   - `GET /notifications/unread-count` — count unread (auth)
   - `PATCH /notifications/:id/read` — mark as read (auth)
   - `PATCH /notifications/read-all` — mark all as read (auth)

4. **Add FCM token endpoint** to UsersController
   - `PATCH /users/fcm-token` — `{ token: string }` → update users.fcm_token

5. **Wire notification triggers** into existing services
   - `VotesService.create()` → `notifyGroup(groupId, 'New Vote', title, 'vote_created')`
   - `WeeklyMenusService.confirm()` → `notifyGroup(groupId, 'Menu Confirmed', ..., 'menu_confirmed')`
   - `GroupsService.joinByInviteCode()` → `notifyGroup(groupId, 'New Member', ..., 'member_joined')`
   - `DailySummaryCron.sendDailySummaries()` → `notifyGroup(groupId, 'Daily Summary', ..., 'price_summary')`

### Frontend

6. **Initialize Firebase client** (`lib/firebase.ts`)
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getMessaging, getToken, onMessage } from 'firebase/messaging';
   const firebaseConfig = { /* from env */ };
   const app = initializeApp(firebaseConfig);
   export const messaging = getMessaging(app);
   ```

7. **Create useNotifications hook**
   - Request permission on mount
   - Get FCM token → send to backend
   - Listen for foreground messages → show toast (sonner/shadcn toast)
   - Fetch unread count

8. **Create service worker** (`public/firebase-messaging-sw.js`)
   - Handle background notifications
   - Show native notification with title + body

9. **Build NotificationBell** — icon in header, badge with unread count, click opens dropdown

10. **Build NotificationList** — dropdown with notification items, "Mark all read" button, link to relevant page

## Todo List
- [ ] Create FirebaseModule and FirebaseService with Admin SDK
- [ ] Create NotificationsModule, Service, Controller
- [ ] Implement notifyUser and notifyGroup methods
- [ ] Implement notification CRUD (list, mark read)
- [ ] Add FCM token update endpoint to UsersController
- [ ] Wire notifications into VotesService, WeeklyMenusService, GroupsService
- [ ] Uncomment FCM in DailySummaryCron
- [ ] Initialize Firebase client in frontend
- [ ] Create useNotifications hook (permission, token, foreground)
- [ ] Create firebase-messaging-sw.js service worker
- [ ] Build NotificationBell component
- [ ] Build NotificationList dropdown
- [ ] Test: create vote → member receives push notification → in-app notification appears → mark as read

## Success Criteria
- FCM token registered on login/app load
- Push notification received when vote created, menu confirmed, member joined
- In-app notification center shows all notifications
- Mark as read works (individual + all)
- Invalid tokens cleaned up automatically
- Background notifications work via service worker

## Risk Assessment
- **Permission denied**: Handle gracefully, notifications still stored in DB for in-app viewing
- **Token refresh**: Update token on each app load (tokens can change)
- **FCM quota**: Firebase free tier: 500 messages/day; upgrade if needed

## Security Considerations
- Firebase service account key in env only (never in frontend)
- FCM tokens are user-specific, stored securely
- Notification data should not contain sensitive details in plain text
- Verify user ownership when marking notifications as read

## Next Steps
- Phase 11: Testing & Deployment
