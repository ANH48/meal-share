-- Row Level Security Policies
-- Run this in the Supabase SQL editor after migration

-- Enable RLS on tables
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_orders ENABLE ROW LEVEL SECURITY;

-- group_messages: active group members can read messages
CREATE POLICY "active_members_read_messages"
  ON group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_messages.group_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
  );

-- group_messages: active group members can insert messages
CREATE POLICY "active_members_insert_messages"
  ON group_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = group_messages.group_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
  );

-- daily_orders: users can only see their own orders
CREATE POLICY "users_read_own_orders"
  ON daily_orders FOR SELECT
  USING (user_id = auth.uid());

-- daily_orders: users can only create their own orders
CREATE POLICY "users_insert_own_orders"
  ON daily_orders FOR INSERT
  WITH CHECK (user_id = auth.uid());
