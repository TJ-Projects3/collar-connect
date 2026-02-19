-- Add sender_id to notifications for direct joins to profiles
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill sender_id for existing connection_request notifications
UPDATE public.notifications n
SET sender_id = uc.requester_id
FROM public.user_connections uc
WHERE n.type = 'connection_request'
  AND n.reference_id = uc.id
  AND n.sender_id IS NULL;

-- Backfill sender_id for existing connection_accepted notifications
UPDATE public.notifications n
SET sender_id = uc.receiver_id
FROM public.user_connections uc
WHERE n.type = 'connection_accepted'
  AND n.reference_id = uc.id
  AND n.sender_id IS NULL;

-- Backfill sender_id for existing message notifications
UPDATE public.notifications n
SET sender_id = m.sender_id
FROM public.messages m
WHERE n.type = 'message'
  AND n.reference_id = m.id
  AND n.sender_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON public.notifications(sender_id);
