-- Messages between users
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- Basic connections between users (mutual)
CREATE TABLE public.user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  connected_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'accepted',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, connected_user_id)
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- RLS for messages
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert own sent message" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete own messages" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);

-- RLS for connections
CREATE POLICY "Users can view own connections" ON public.user_connections
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create connections" ON public.user_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections" ON public.user_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient_time
  ON public.messages(sender_id, recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_connections_user
  ON public.user_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_user_connections_connected
  ON public.user_connections(connected_user_id);
