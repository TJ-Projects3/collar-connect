-- Create conversations table
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  last_message text,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Create conversation_participants junction table
create table if not exists conversation_participants (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(conversation_id, user_id)
);

-- Create indexes for performance
create index if not exists idx_conversation_participants_user_id on conversation_participants(user_id);
create index if not exists idx_conversation_participants_conversation_id on conversation_participants(conversation_id);
create index if not exists idx_conversations_last_message_at on conversations(last_message_at desc);

-- Enable RLS
alter table conversations enable row level security;
alter table conversation_participants enable row level security;

-- RLS Policy: Users can see conversations they're part of
create policy "Users can view their conversations"
  on conversations for select
  using (
    id in (
      select conversation_id from conversation_participants where user_id = auth.uid()
    )
  );

-- RLS Policy: Users can see conversation participants they're part of
create policy "Users can view participants in their conversations"
  on conversation_participants for select
  using (
    conversation_id in (
      select conversation_id from conversation_participants where user_id = auth.uid()
    )
  );
