-- Create trigger function to automatically create notifications for messages
CREATE OR REPLACE FUNCTION public.create_notification_for_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Get sender's full name for the notification content
  INSERT INTO public.notifications (user_id, type, content, reference_id)
  SELECT 
    NEW.recipient_id,
    'message',
    'You have a new message from ' || COALESCE(p.full_name, 'Someone'),
    NEW.id
  FROM public.profiles p
  WHERE p.id = NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_message_created ON public.messages;

-- Create trigger to fire after message is inserted
CREATE TRIGGER on_message_created
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.create_notification_for_message();
