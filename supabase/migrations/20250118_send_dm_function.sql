-- Create send_dm RPC function for sending direct messages
create or replace function send_dm(
  sender uuid,
  recipient uuid,
  message_text text
)
returns json as $$
declare
  conversation_id uuid;
  new_message record;
begin
  -- Find or create conversation between sender and recipient
  select id into conversation_id
  from conversations
  where id in (
    select conversation_id from conversation_participants
    where user_id = sender
  )
  and id in (
    select conversation_id from conversation_participants
    where user_id = recipient
  );

  -- If conversation doesn't exist, create it
  if conversation_id is null then
    insert into conversations (last_message, last_message_at)
    values (message_text, now())
    returning id into conversation_id;

    -- Add both participants
    insert into conversation_participants (conversation_id, user_id)
    values (conversation_id, sender), (conversation_id, recipient);
  end if;

  -- Insert the message
  insert into messages (sender_id, recipient_id, content, created_at)
  values (sender, recipient, message_text, now())
  returning * into new_message;

  -- Update conversation's last message
  update conversations
  set last_message = message_text, last_message_at = now()
  where id = conversation_id;

  -- Return the message as JSON
  return row_to_json(new_message);
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function send_dm(uuid, uuid, text) to authenticated;
