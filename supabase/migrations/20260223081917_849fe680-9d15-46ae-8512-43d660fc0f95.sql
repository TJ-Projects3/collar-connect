
-- Phase 1.1: Fix foreign keys on user_connections
ALTER TABLE public.user_connections
  DROP CONSTRAINT IF EXISTS user_connections_requester_id_fkey,
  DROP CONSTRAINT IF EXISTS user_connections_receiver_id_fkey;

ALTER TABLE public.user_connections
  ADD CONSTRAINT user_connections_requester_id_fkey
    FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT user_connections_receiver_id_fkey
    FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Phase 1.2: Fix notification triggers using wrong column
CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  insert into public.notifications (user_id, sender_id, type, title, body, reference_id)
  values (
    NEW.receiver_id,
    NEW.requester_id,
    'connection_request',
    'Connection Request',
    'You received a new connection request',
    NEW.id
  );
  return NEW;
end;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_connection_accept()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  if NEW.status = 'accepted' and OLD.status = 'pending' then
    insert into public.notifications (user_id, sender_id, type, title, body, reference_id)
    values (
      NEW.requester_id,
      NEW.receiver_id,
      'connection_accepted',
      'Connection Accepted',
      'Your connection request was accepted',
      NEW.id
    );
  end if;
  return NEW;
end;
$$;
