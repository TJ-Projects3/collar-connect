-- Fix RLS Policies for user_connections to use correct column names (receiver_id not recipient_id)
DROP POLICY IF EXISTS "Users can view connections involving them" ON public.user_connections;
DROP POLICY IF EXISTS "Users can create connection requests" ON public.user_connections;
DROP POLICY IF EXISTS "Recipients can update connection status" ON public.user_connections;
DROP POLICY IF EXISTS "Users can delete own connection requests" ON public.user_connections;

-- Corrected RLS Policies using actual column names
CREATE POLICY "Users can view connections involving them" ON public.user_connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create connection requests" ON public.user_connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipients can update connection status" ON public.user_connections
  FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete own connection requests" ON public.user_connections
  FOR DELETE USING (auth.uid() = requester_id);

-- Fix indexes to use correct column names
DROP INDEX IF EXISTS idx_user_connections_recipient;
CREATE INDEX IF NOT EXISTS idx_user_connections_receiver ON public.user_connections(receiver_id);
