-- Fix the INSERT trigger for connection_request notifications to use correct columns (title/body)
CREATE OR REPLACE FUNCTION public.create_notification_for_connection_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, sender_id, type, title, body, reference_id)
    VALUES (
      NEW.receiver_id,
      NEW.requester_id,
      'connection_request',
      'New connection request',
      'You have a new connection request',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the INSERT trigger
DROP TRIGGER IF EXISTS on_connection_request_created ON public.user_connections;
CREATE TRIGGER on_connection_request_created
AFTER INSERT ON public.user_connections
FOR EACH ROW
EXECUTE FUNCTION public.create_notification_for_connection_request();

-- Update the UPDATE trigger to also notify the requester when their request is accepted
CREATE OR REPLACE FUNCTION public.update_notification_for_connection_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed back to pending (re-send after rejection cooldown)
  IF NEW.status = 'pending' AND OLD.status != 'pending' THEN
    INSERT INTO public.notifications (user_id, sender_id, type, title, body, reference_id)
    VALUES (
      NEW.receiver_id,
      NEW.requester_id,
      'connection_request',
      'New connection request',
      'You have a new connection request',
      NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- If status changed from pending to accepted, notify the original requester
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, sender_id, type, title, body, reference_id)
    VALUES (
      NEW.requester_id,
      NEW.receiver_id,
      'connection_accepted',
      'Connection request accepted',
      'Your connection request was accepted',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the UPDATE trigger
DROP TRIGGER IF EXISTS on_connection_status_updated ON public.user_connections;
CREATE TRIGGER on_connection_status_updated
AFTER UPDATE ON public.user_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_notification_for_connection_status();
