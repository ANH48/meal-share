---
title: "Phase 05 - Group Management"
status: pending
priority: P1
effort: 2h
---

# Phase 05: Group Management

## Context Links
- Parent: [plan.md](./plan.md)
- Research: [Realtime Research](./research/researcher-02-realtime-chat-financial-voting-deployment.md)
- Dependencies: Phase 03 (auth system)

## Overview
Implement group CRUD, invite system (nanoid codes), member management (join, remove), and group role enforcement. Build frontend pages for creating groups, viewing group list, group settings, and invite sharing.

## Key Insights
- Group creator auto-assigned as leader via `group_members.role = 'leader'`
- Invite codes: reusable, 10-char nanoid, leader can regenerate
- Removing a member: set `group_members.status = 'removed'`, `removed_at` timestamp
- RLS immediately revokes chat/data access for removed members
- `GroupMemberGuard` checks active membership + required role from route params

## Requirements

### Functional
- Create group (name, description) → creator becomes leader
- Generate unique invite code (nanoid 10 chars)
- Join group via invite code (URL: `/join?code=XXX`)
- Leader can remove members (set status to 'removed')
- Leader can regenerate invite code
- List user's groups (active memberships only)
- View group members with roles
- Leave group (participant only, leader cannot leave)

### Non-functional
- Invite code collision: nanoid(10) has ~1 trillion combinations, sufficient
- Member count per group: no hard limit for MVP

## Architecture

### Invite Flow
```
Leader creates group → nanoid(10) invite code → share link /join?code=XXX
User clicks link → validate code → check not already member → insert group_member → redirect to group
```

### Member Removal
```
Leader removes participant → UPDATE group_members SET status='removed', removed_at=now()
→ RLS revokes chat access → participant loses group from their list
```

## Related Code Files

### Files to Create (Backend)
- `apps/api/src/modules/groups/groups.module.ts`
- `apps/api/src/modules/groups/groups.controller.ts`
- `apps/api/src/modules/groups/groups.service.ts`
- `apps/api/src/modules/groups/dto/create-group.dto.ts`
- `apps/api/src/modules/groups/dto/update-group.dto.ts`

### Files to Create (Frontend)
- `apps/web/src/app/(dashboard)/groups/page.tsx` — my groups list
- `apps/web/src/app/(dashboard)/groups/create/page.tsx` — create group
- `apps/web/src/app/(dashboard)/groups/[groupId]/page.tsx` — group overview
- `apps/web/src/app/(dashboard)/groups/[groupId]/settings/page.tsx` — group settings (leader)
- `apps/web/src/app/join/page.tsx` — join group via invite code
- `apps/web/src/components/groups/group-card.tsx`
- `apps/web/src/components/groups/member-list.tsx`
- `apps/web/src/components/groups/invite-link.tsx`
- `apps/web/src/lib/api/groups.ts` — API functions

### Files to Modify
- `apps/api/src/app.module.ts` — import GroupsModule

## Implementation Steps

1. **Install nanoid**
   ```bash
   cd apps/api && pnpm add nanoid
   ```

2. **Create GroupsModule** — import PrismaModule, UsersModule

3. **Create DTOs**
   ```typescript
   export class CreateGroupDto {
     @IsString() @MinLength(2) @MaxLength(100) name: string;
     @IsOptional() @IsString() @MaxLength(500) description?: string;
   }
   export class UpdateGroupDto extends PartialType(CreateGroupDto) {}
   ```

4. **Implement GroupsService**
   - `create(dto, userId)`: generate invite code → create group → create group_member(role='leader') in transaction
   - `findUserGroups(userId)`: query active memberships with group details
   - `findById(groupId)`: group with members
   - `joinByInviteCode(code, userId)`: validate code → check not already active member → insert group_member
   - `removeMember(groupId, memberId, requesterId)`: verify requester is leader → set status='removed'
   - `leaveGroup(groupId, userId)`: verify user is participant (not leader) → set status='removed'
   - `regenerateInviteCode(groupId, userId)`: verify leader → new nanoid → update group
   - `update(groupId, dto, userId)`: verify leader → update group
   - `getMembers(groupId)`: list active members with roles
   - `isActiveMember(groupId, userId)`: boolean check
   - `getMemberRole(groupId, userId)`: returns role or null

5. **Implement GroupsController**
   - `POST /groups` — create group (auth required)
   - `GET /groups` — my groups (auth required)
   - `GET /groups/:groupId` — group detail (GroupMemberGuard)
   - `PATCH /groups/:groupId` — update group (leader only)
   - `POST /groups/join` — join by invite code `{ code: string }` (auth required)
   - `GET /groups/:groupId/members` — member list (GroupMemberGuard)
   - `DELETE /groups/:groupId/members/:memberId` — remove member (leader only)
   - `POST /groups/:groupId/leave` — leave group (participant only)
   - `POST /groups/:groupId/regenerate-invite` — regenerate code (leader only)

6. **Update GroupMemberGuard** (created in Phase 03)
   - Extract `groupId` from request params
   - Query `group_members` for active membership
   - Attach `groupRole` to request object for downstream use
   - Support `@Roles('leader')` for group-scoped role checks

7. **Build My Groups Page** (`groups/page.tsx`)
   - Grid of group cards (name, description, member count, role badge)
   - "Create Group" button
   - Empty state for no groups

8. **Build Create Group Page** (`groups/create/page.tsx`)
   - Form: name, description
   - On success: redirect to group overview, show invite code

9. **Build Group Overview Page** (`groups/[groupId]/page.tsx`)
   - Group name, description
   - Navigation tabs: Overview, Menu, Vote, Orders, Chat, Analytics
   - Member list sidebar
   - Invite link component (copy to clipboard)

10. **Build Group Settings Page** (leader only)
    - Edit name/description
    - Regenerate invite code
    - Member management (remove button per member)

11. **Build Join Page** (`/join?code=XXX`)
    - If authenticated: auto-join, redirect to group
    - If not authenticated: redirect to login, then back to join

12. **Build reusable components**
    - `GroupCard`: name, member count, role badge, link to group
    - `MemberList`: avatar, name, role badge, remove button (leader only)
    - `InviteLink`: display code, copy button, share options

## Todo List
- [ ] Create GroupsModule, Service, Controller
- [ ] Create DTOs with validation
- [ ] Implement group creation with leader auto-assignment
- [ ] Implement invite code generation (nanoid)
- [ ] Implement join by invite code
- [ ] Implement member removal (leader only)
- [ ] Implement leave group (participant only)
- [ ] Implement invite code regeneration
- [ ] Update GroupMemberGuard with group-scoped role check
- [ ] Build my groups list page
- [ ] Build create group page
- [ ] Build group overview page with navigation tabs
- [ ] Build group settings page (leader)
- [ ] Build join page
- [ ] Build GroupCard, MemberList, InviteLink components
- [ ] Test: create group → share invite → join → view members → remove member

## Success Criteria
- Create group assigns creator as leader
- Invite code generates and join works
- Removed members lose access (status='removed')
- GroupMemberGuard blocks non-members
- Leader-only endpoints block participants
- Frontend pages functional with proper role-based UI

## Risk Assessment
- **Invite code collision**: Extremely unlikely with nanoid(10), but handle unique constraint violation gracefully
- **Race condition on join**: Use unique constraint `(group_id, user_id)` to prevent double membership
- **Leader leaving**: Prevent leader from leaving; future: transfer leadership

## Security Considerations
- GroupMemberGuard on all group-scoped endpoints
- Leader-only operations verified server-side
- Invite codes not guessable (nanoid with sufficient entropy)
- Removed members immediately lose access via status check

## Next Steps
- Phase 06: Weekly Menu & Voting System
