-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL, -- 'connection_request', 'connection_accepted', 'message', etc.
  content text NOT NULL,
  reference_id uuid, -- ID of related entity (connection, message, etc.)
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Modify existing user_connections table to support request flow
ALTER TABLE public.user_connections 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Update status column to remove default and add check constraint
ALTER TABLE public.user_connections 
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.user_connections 
  DROP CONSTRAINT IF EXISTS user_connections_status_check;

ALTER TABLE public.user_connections 
  ADD CONSTRAINT user_connections_status_check 
  CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Rename columns for clarity (requester sends the request, recipient receives it)
ALTER TABLE public.user_connections 
  RENAME COLUMN user_id TO requester_id;

ALTER TABLE public.user_connections 
  RENAME COLUMN connected_user_id TO recipient_id;

-- Enable RLS (notifications already has it, just ensure it's enabled)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop old RLS policies on user_connections if they exist
DROP POLICY IF EXISTS "Users can view own connections" ON public.user_connections;
DROP POLICY IF EXISTS "Users can create connections" ON public.user_connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON public.user_connections;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true); -- Allow system to create notifications

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_connections (updated for request flow)
CREATE POLICY "Users can view connections involving them" ON public.user_connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create connection requests" ON public.user_connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipients can update connection status" ON public.user_connections
  FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Users can delete own connection requests" ON public.user_connections
  FOR DELETE USING (auth.uid() = requester_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON public.user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_recipient ON public.user_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON public.user_connections(status);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_connections_updated_at ON public.user_connections;
CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON public.user_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
