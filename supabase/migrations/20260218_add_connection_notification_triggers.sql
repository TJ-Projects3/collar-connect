-- Create trigger function to automatically create notifications for connection requests
CREATE OR REPLACE FUNCTION public.create_notification_for_connection_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification for pending connection requests
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, sender_id, type, content, reference_id)
    VALUES (
      NEW.receiver_id,
      NEW.requester_id,
      'connection_request',
      'You have a new connection request',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_connection_request_created ON public.user_connections;

-- Create trigger to fire after connection request is inserted
CREATE TRIGGER on_connection_request_created
AFTER INSERT ON public.user_connections
FOR EACH ROW
EXECUTE FUNCTION public.create_notification_for_connection_request();

-- Also handle updates (if status changes to pending)
CREATE OR REPLACE FUNCTION public.update_notification_for_connection_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to pending, create notification
  IF NEW.status = 'pending' AND OLD.status != 'pending' THEN
    INSERT INTO public.notifications (user_id, sender_id, type, content, reference_id)
    VALUES (
      NEW.receiver_id,
      NEW.requester_id,
      'connection_request',
      'You have a new connection request',
      NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing update trigger if it exists
DROP TRIGGER IF EXISTS on_connection_status_updated ON public.user_connections;

-- Create trigger to fire on status updates
CREATE TRIGGER on_connection_status_updated
AFTER UPDATE ON public.user_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_notification_for_connection_status();
