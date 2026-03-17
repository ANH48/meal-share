// These mirror the Prisma enums defined in apps/api/prisma/schema.prisma

export enum GlobalRole {
  admin = 'admin',
  user = 'user',
}

export enum GroupMemberRole {
  leader = 'leader',
  participant = 'participant',
}

export enum GroupMemberStatus {
  active = 'active',
  removed = 'removed',
}

export enum WeeklyMenuStatus {
  draft = 'draft',
  confirmed = 'confirmed',
}

export enum VoteStatus {
  open = 'open',
  closed = 'closed',
  results = 'results',
}

export enum MessageType {
  user = 'user',
  system = 'system',
}
