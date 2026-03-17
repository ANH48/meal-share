-- Enable Supabase Realtime on group_messages table
-- Run this in the Supabase SQL editor

ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
