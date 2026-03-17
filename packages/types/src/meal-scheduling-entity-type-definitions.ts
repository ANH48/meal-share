export interface Meal {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  scheduledAt: Date;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
