-- Sync pending connection requests with notifications
-- This creates notifications for any pending requests that don't have them yet

INSERT INTO public.notifications (user_id, type, content, reference_id)
SELECT 
  uc.receiver_id as user_id,
  'connection_request' as type,
  'You have a new connection request' as content,
  uc.id as reference_id
FROM public.user_connections uc
WHERE uc.status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n 
    WHERE n.type = 'connection_request' 
      AND n.reference_id = uc.id
  )
ON CONFLICT DO NOTHING;
