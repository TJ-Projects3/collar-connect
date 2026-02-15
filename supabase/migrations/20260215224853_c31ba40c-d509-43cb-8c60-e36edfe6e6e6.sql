
-- Drop the old function (different signature: p_sender, p_recipient, p_content)
DROP FUNCTION IF EXISTS public.send_dm(uuid, uuid, text);

-- Recreate with param names matching the frontend code
CREATE OR REPLACE FUNCTION public.send_dm(sender uuid, recipient uuid, message_text text)
 RETURNS SETOF messages
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_conversation_id uuid;
  v_key text;
  v_user1 uuid;
  v_user2 uuid;
BEGIN
  IF sender < recipient THEN
    v_user1 := sender;
    v_user2 := recipient;
  ELSE
    v_user1 := recipient;
    v_user2 := sender;
  END IF;

  v_key := v_user1::text || '_' || v_user2::text;

  INSERT INTO conversations (conversation_key)
  VALUES (v_key)
  ON CONFLICT (conversation_key)
  DO UPDATE SET conversation_key = EXCLUDED.conversation_key
  RETURNING id INTO v_conversation_id;

  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, v_user1), (v_conversation_id, v_user2)
  ON CONFLICT DO NOTHING;

  RETURN QUERY
  INSERT INTO messages (sender_id, recipient_id, content, conversation_id)
  VALUES (sender, recipient, message_text, v_conversation_id)
  RETURNING *;

  UPDATE conversations c
  SET last_message = message_text, last_message_at = now()
  WHERE c.id = v_conversation_id;
END;
$function$;
