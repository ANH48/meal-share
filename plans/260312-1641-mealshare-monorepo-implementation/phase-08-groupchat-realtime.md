---
title: "Phase 08 - GroupChat with Real-time"
status: complete
priority: P2
effort: 2h
---

# Phase 08: GroupChat with Real-time

## Context Links
- Parent: [plan.md](./plan.md)
- Research: [Realtime Research](./researcher-02-realtime-chat-financial-voting-deployment.md)
- Dependencies: Phase 02 (RLS + Realtime enabled), Phase 05 (group membership)

## Overview
Implement group chat where members send/edit/delete messages in real-time. NestJS handles message CRUD via REST API. Supabase Realtime broadcasts changes to frontend subscribers. Removed members lose access immediately via RLS.

## Key Insights
- NestJS writes messages → Supabase Realtime broadcasts to frontend (no WebSocket in NestJS)
- RLS policy on `group_messages`: SELECT only for active members
- Soft-delete: `deleted_at` timestamp, client renders "Message deleted"
- System messages (`type='system'`) for auto-generated price summaries (Phase 09)
- Frontend subscribes via `supabase.channel('group:${groupId}').on('postgres_changes', ...)`

## Requirements

### Functional
- Send text messages to group
- Edit own messages (updates content + edited_at)
- Soft-delete own messages (sets deleted_at)
- Real-time message delivery to all active members
- System messages rendered differently (no sender, styled as notification)
- Message pagination (load older messages)
- Removed members immediately lose chat access

### Non-functional
- Supabase Realtime for live updates (no polling)
- Message list: infinite scroll (newest at bottom, load older on scroll up)
- RLS as defense-in-depth (NestJS guards are primary)

## Architecture

### Message Flow
```
User sends message → POST /messages → NestJS inserts into group_messages
→ Supabase Realtime detects INSERT → broadcasts to subscribers
→ Frontend receives via channel → appends to message list
```

### Real-time Subscription
```typescript
const channel = supabase
  .channel(`group:${groupId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'group_messages',
    filter: `group_id=eq.${groupId}`
  }, (payload) => {
    // INSERT: append new message
    // UPDATE: update existing (edit or delete)
  })
  .subscribe();
```

## Related Code Files

### Files to Create (Backend)
- `apps/api/src/modules/messages/messages.module.ts`
- `apps/api/src/modules/messages/messages.controller.ts`
- `apps/api/src/modules/messages/messages.service.ts`
- `apps/api/src/modules/messages/dto/create-message.dto.ts`
- `apps/api/src/modules/messages/dto/update-message.dto.ts`

### Files to Create (Frontend)
- `apps/web/src/app/(dashboard)/groups/[groupId]/chat/page.tsx`
- `apps/web/src/components/chat/message-list.tsx` — scrollable message container
- `apps/web/src/components/chat/message-bubble.tsx` — individual message
- `apps/web/src/components/chat/message-input.tsx` — text input + send button
- `apps/web/src/components/chat/system-message.tsx` — system message style
- `apps/web/src/hooks/use-realtime-messages.ts` — Supabase subscription hook
- `apps/web/src/lib/supabase.ts` — Supabase client (anon key, for Realtime)
- `apps/web/src/lib/api/messages.ts`

### Files to Modify
- `apps/api/src/app.module.ts` — import MessagesModule

## Implementation Steps

### Backend

1. **Create MessagesModule** — import PrismaModule, GroupsModule

2. **Create DTOs**
   ```typescript
   export class CreateMessageDto {
     @IsUUID() groupId: string;
     @IsString() @MinLength(1) @MaxLength(2000) content: string;
   }
   export class UpdateMessageDto {
     @IsString() @MinLength(1) @MaxLength(2000) content: string;
   }
   ```

3. **Implement MessagesService**
   - `create(dto, userId)`: verify active member → insert message (type='user') → return with sender
   - `createSystemMessage(groupId, content)`: insert message (type='system', sender=null)
   - `update(messageId, dto, userId)`: verify ownership + type='user' → update content + edited_at
   - `softDelete(messageId, userId)`: verify ownership → set deleted_at
   - `findByGroup(groupId, cursor?, limit=50)`: paginated messages, newest first
     - Include sender name/avatar
     - Return cursor for pagination
   - `findById(messageId)`: single message

4. **Implement MessagesController**
   - `POST /messages` — send message (GroupMemberGuard)
   - `GET /messages?groupId=X&cursor=Y&limit=50` — paginated messages (GroupMemberGuard)
   - `PATCH /messages/:id` — edit message (owner only)
   - `DELETE /messages/:id` — soft-delete (owner only)

### Frontend

5. **Create Supabase client** (`lib/supabase.ts`)
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
   ```

6. **Create useRealtimeMessages hook** (`hooks/use-realtime-messages.ts`)
   ```typescript
   export function useRealtimeMessages(groupId: string) {
     const [messages, setMessages] = useState<Message[]>([]);
     useEffect(() => {
       // Load initial messages from API
       // Subscribe to Supabase Realtime channel
       // Handle INSERT: append, UPDATE: update in place
       // Cleanup: unsubscribe on unmount
     }, [groupId]);
     return { messages, isLoading };
   }
   ```

7. **Build Chat Page** (`groups/[groupId]/chat/page.tsx`)
   - Uses useRealtimeMessages hook
   - MessageList (scrollable, auto-scroll to bottom)
   - MessageInput (fixed at bottom)
   - Load more button at top (or infinite scroll)

8. **Build MessageList** — scrollable container, renders MessageBubble or SystemMessage based on type

9. **Build MessageBubble**
   - Own messages: right-aligned, blue
   - Other messages: left-aligned, gray
   - Show sender name, timestamp
   - If deleted_at: show "Message deleted" in italic
   - If edited_at: show "(edited)" indicator
   - Context menu (right-click or long-press): Edit, Delete (own messages only)

10. **Build SystemMessage** — centered, muted text, no sender, icon indicator

11. **Build MessageInput**
    - Text input with send button
    - Enter to send, Shift+Enter for newline
    - Edit mode: pre-fill input when editing a message

12. **Handle edit/delete UI**
    - Edit: replace input content, show "Editing..." indicator, cancel button
    - Delete: confirmation dialog, then PATCH (soft delete)

## Todo List
- [ ] Create MessagesModule, Service, Controller
- [ ] Create DTOs with validation
- [ ] Implement message CRUD (create, edit, soft-delete)
- [ ] Implement createSystemMessage for cron jobs (Phase 09)
- [ ] Implement cursor-based pagination for messages
- [ ] Set up Supabase client in frontend
- [ ] Create useRealtimeMessages hook with Supabase subscription
- [ ] Build chat page layout
- [ ] Build MessageList with auto-scroll
- [ ] Build MessageBubble (own vs others, deleted, edited states)
- [ ] Build SystemMessage component
- [ ] Build MessageInput with send/edit modes
- [ ] Handle real-time INSERT and UPDATE events
- [ ] Test: send message → appears in real-time → edit → delete → system message display

## Success Criteria
- Messages appear in real-time without page refresh
- Edit updates content + shows "(edited)" indicator
- Soft-delete shows "Message deleted"
- System messages render correctly
- Pagination loads older messages
- Removed members lose access immediately (RLS + guard)
- Subscription cleans up on unmount/navigation

## Risk Assessment
- **Supabase Realtime connection limits**: Free tier supports ~200 concurrent connections; sufficient for MVP
- **Message ordering**: Use `created_at` + `id` for stable sorting
- **Stale subscriptions**: Clean up on component unmount and group navigation

## Security Considerations
- GroupMemberGuard on all REST endpoints
- RLS on group_messages as defense-in-depth
- Message edit/delete only by owner (verified server-side)
- Content sanitization to prevent XSS (escape HTML in frontend)
- Max message length (2000 chars)

## Next Steps
- Phase 09: Financial Dashboard & Cron Jobs
