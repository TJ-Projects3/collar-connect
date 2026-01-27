-- Fix search_path security issue on send_dm function
DROP FUNCTION IF EXISTS public.send_dm(uuid, uuid, text);

CREATE FUNCTION public.send_dm(sender uuid, recipient uuid, message_text text)
RETURNS SETOF public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  convo_id uuid;
  new_message public.messages;
BEGIN
  -- Find existing conversation
  SELECT c.id INTO convo_id
  FROM public.conversations c
  JOIN public.conversation_participants p1
    ON p1.conversation_id = c.id AND p1.user_id = sender
  JOIN public.conversation_participants p2
    ON p2.conversation_id = c.id AND p2.user_id = recipient
  LIMIT 1;

  -- Create conversation + participants if missing
  IF convo_id IS NULL THEN
    INSERT INTO public.conversations DEFAULT VALUES
    RETURNING id INTO convo_id;

    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (convo_id, sender), (convo_id, recipient);
  END IF;

  -- Insert and return message
  INSERT INTO public.messages (
    conversation_id, sender_id, recipient_id, content
  ) VALUES (
    convo_id, sender, recipient, message_text
  ) RETURNING * INTO new_message;

  RETURN NEXT new_message;
END;
$$;