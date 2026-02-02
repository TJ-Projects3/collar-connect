-- Create send_dm RPC function for sending direct messages
create or replace function send_dm(
  sender uuid,
  recipient uuid,
  message_text text
)
returns json as $$
declare
  new_message record;
begin
  -- Insert the message
  insert into messages (sender_id, recipient_id, content, created_at)
  values (sender, recipient, message_text, now())
  returning * into new_message;

  -- Return the message as JSON
  return row_to_json(new_message);
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function send_dm(uuid, uuid, text) to authenticated;
