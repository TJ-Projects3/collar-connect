-- 1. conversations: group fields
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS is_group boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- 2. participants: role + joined_at
ALTER TABLE public.conversation_participants
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS joined_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversation_participants_role_check') THEN
    ALTER TABLE public.conversation_participants
      ADD CONSTRAINT conversation_participants_role_check CHECK (role IN ('admin','member'));
  END IF;
END $$;

-- 3. messages: conversation-scoped; recipient_id only for direct chats
ALTER TABLE public.messages ALTER COLUMN recipient_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON public.messages (conversation_id, created_at);

-- 4. membership helpers
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_admin(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id AND user_id = _user_id AND role = 'admin'
  )
$$;

REVOKE ALL ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_conversation_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_conversation_admin(uuid, uuid) TO authenticated, service_role;

-- 5. RLS: membership based
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can update read state" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their messages" ON public.messages;

CREATE POLICY "Participants can view conversation messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Participants can send conversation messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_member(conversation_id, auth.uid())
    AND NOT public.recruiter_blocked(auth.uid())
    AND (recipient_id IS NULL OR NOT public.is_blocked(auth.uid(), recipient_id))
  );

CREATE POLICY "Participants can update read state"
  ON public.messages FOR UPDATE TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()))
  WITH CHECK (public.is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Senders and recipients can delete their messages"
  ON public.messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (public.is_conversation_member(id, auth.uid()));

DROP POLICY IF EXISTS "Users can insert themselves" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their participant rows" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their participation" ON public.conversation_participants;

CREATE POLICY "Participants can view member lists"
  ON public.conversation_participants FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Users can join conversations"
  ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Members can leave and admins can remove"
  ON public.conversation_participants FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_conversation_admin(conversation_id, auth.uid()));

-- 6. group RPCs
CREATE OR REPLACE FUNCTION public.create_group_conversation(_title text, _participant_ids uuid[], _avatar_url text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_conversation_id uuid;
  v_ids uuid[];
  v_target uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _title IS NULL OR length(btrim(_title)) = 0 THEN RAISE EXCEPTION 'Group name is required'; END IF;
  IF length(btrim(_title)) > 80 THEN RAISE EXCEPTION 'Group name is too long'; END IF;
  IF public.recruiter_blocked(v_uid) THEN
    RAISE EXCEPTION 'Your recruiter account is pending approval and cannot create groups yet';
  END IF;

  SELECT array_agg(DISTINCT p) INTO v_ids
  FROM unnest(coalesce(_participant_ids, '{}'::uuid[])) AS p
  WHERE p <> v_uid;

  IF v_ids IS NULL OR array_length(v_ids, 1) < 2 THEN
    RAISE EXCEPTION 'Select at least 2 other people for a group';
  END IF;
  IF array_length(v_ids, 1) > 49 THEN
    RAISE EXCEPTION 'Groups are limited to 50 people';
  END IF;

  FOREACH v_target IN ARRAY v_ids LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.user_connections
      WHERE status = 'accepted'
        AND ((requester_id = v_uid AND receiver_id = v_target)
          OR (receiver_id = v_uid AND requester_id = v_target))
    ) THEN
      RAISE EXCEPTION 'You can only add your connections to a group';
    END IF;
    IF public.is_blocked(v_uid, v_target) THEN
      RAISE EXCEPTION 'You cannot add one of these people';
    END IF;
  END LOOP;

  INSERT INTO public.conversations (title, is_group, avatar_url, created_by)
  VALUES (btrim(_title), true, nullif(btrim(coalesce(_avatar_url, '')), ''), v_uid)
  RETURNING id INTO v_conversation_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES (v_conversation_id, v_uid, 'admin');

  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  SELECT v_conversation_id, p, 'member' FROM unnest(v_ids) AS p
  ON CONFLICT DO NOTHING;

  RETURN v_conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_group_message(_conversation_id uuid, _content text)
RETURNS SETOF public.messages LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_conversation_member(_conversation_id, v_uid) THEN
    RAISE EXCEPTION 'You are not a member of this conversation';
  END IF;
  IF _content IS NULL OR length(btrim(_content)) = 0 THEN RAISE EXCEPTION 'Message content cannot be empty'; END IF;
  IF length(_content) > 10000 THEN RAISE EXCEPTION 'Message content exceeds maximum length of 10000 characters'; END IF;
  IF public.recruiter_blocked(v_uid) THEN
    RAISE EXCEPTION 'Your recruiter account is pending approval and cannot send messages yet';
  END IF;

  RETURN QUERY
  INSERT INTO public.messages (sender_id, recipient_id, content, conversation_id)
  VALUES (v_uid, NULL, btrim(_content), _conversation_id)
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_group_participants(_conversation_id uuid, _participant_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_target uuid;
  v_count int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_conversation_admin(_conversation_id, v_uid) THEN
    RAISE EXCEPTION 'Only group admins can add people';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.conversations WHERE id = _conversation_id AND is_group) THEN
    RAISE EXCEPTION 'Not a group conversation';
  END IF;

  FOREACH v_target IN ARRAY coalesce(_participant_ids, '{}'::uuid[]) LOOP
    IF v_target = v_uid THEN CONTINUE; END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.user_connections
      WHERE status = 'accepted'
        AND ((requester_id = v_uid AND receiver_id = v_target)
          OR (receiver_id = v_uid AND requester_id = v_target))
    ) THEN
      RAISE EXCEPTION 'You can only add your connections to a group';
    END IF;
    IF public.is_blocked(v_uid, v_target) THEN
      RAISE EXCEPTION 'You cannot add one of these people';
    END IF;

    INSERT INTO public.conversation_participants (conversation_id, user_id, role)
    VALUES (_conversation_id, v_target, 'member')
    ON CONFLICT DO NOTHING;
  END LOOP;

  SELECT count(*) INTO v_count FROM public.conversation_participants WHERE conversation_id = _conversation_id;
  IF v_count > 50 THEN RAISE EXCEPTION 'Groups are limited to 50 people'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_group_participant(_conversation_id uuid, _user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _user_id <> v_uid AND NOT public.is_conversation_admin(_conversation_id, v_uid) THEN
    RAISE EXCEPTION 'Only group admins can remove people';
  END IF;

  DELETE FROM public.conversation_participants
  WHERE conversation_id = _conversation_id AND user_id = _user_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id AND role = 'admin'
  ) THEN
    UPDATE public.conversation_participants
    SET role = 'admin'
    WHERE conversation_id = _conversation_id
      AND user_id = (
        SELECT user_id FROM public.conversation_participants
        WHERE conversation_id = _conversation_id
        ORDER BY joined_at ASC LIMIT 1
      );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_group(_conversation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  PERFORM public.remove_group_participant(_conversation_id, auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.set_participant_role(_conversation_id uuid, _user_id uuid, _role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_conversation_admin(_conversation_id, v_uid) THEN
    RAISE EXCEPTION 'Only group admins can change roles';
  END IF;
  IF _role NOT IN ('admin','member') THEN RAISE EXCEPTION 'Invalid role'; END IF;

  UPDATE public.conversation_participants
  SET role = _role
  WHERE conversation_id = _conversation_id AND user_id = _user_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'A group needs at least one admin';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.rename_group(_conversation_id uuid, _title text, _avatar_url text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_conversation_admin(_conversation_id, v_uid) THEN
    RAISE EXCEPTION 'Only group admins can rename the group';
  END IF;
  IF _title IS NULL OR length(btrim(_title)) = 0 THEN RAISE EXCEPTION 'Group name is required'; END IF;
  IF length(btrim(_title)) > 80 THEN RAISE EXCEPTION 'Group name is too long'; END IF;

  UPDATE public.conversations
  SET title = btrim(_title),
      avatar_url = COALESCE(nullif(btrim(coalesce(_avatar_url, '')), ''), avatar_url)
  WHERE id = _conversation_id AND is_group;
END;
$$;

REVOKE ALL ON FUNCTION public.create_group_conversation(text, uuid[], text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_group_message(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_group_participants(uuid, uuid[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_group_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leave_group(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_participant_role(uuid, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rename_group(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_group_conversation(text, uuid[], text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_group_message(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_group_participants(uuid, uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_group_participant(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.leave_group(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_participant_role(uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rename_group(uuid, text, text) TO authenticated, service_role;

-- 7. notifications fan out to all participants
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_sender_name text;
  v_is_group boolean;
  v_title text;
BEGIN
  SELECT COALESCE(full_name, 'Someone') INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
  SELECT is_group, title INTO v_is_group, v_title FROM public.conversations WHERE id = NEW.conversation_id;

  IF COALESCE(v_is_group, false) THEN
    INSERT INTO public.notifications (user_id, sender_id, type, title, body, reference_id)
    SELECT cp.user_id, NEW.sender_id, 'message', 'New group message',
           COALESCE(v_sender_name, 'Someone') || ' posted in ' || COALESCE(v_title, 'a group chat'),
           NEW.conversation_id
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
      AND cp.user_id <> NEW.sender_id
      AND NOT public.is_blocked(NEW.sender_id, cp.user_id);
  ELSIF NEW.recipient_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, sender_id, type, title, body, reference_id)
    VALUES (NEW.recipient_id, NEW.sender_id, 'message', 'New Message',
            'You have a new message from ' || COALESCE(v_sender_name, 'Someone'),
            NEW.conversation_id);
  END IF;

  RETURN NEW;
END;
$$;

-- 8. mentions allowed for any participant of the conversation
CREATE OR REPLACE FUNCTION public.notify_mentions_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_allowed uuid[];
BEGIN
  SELECT array_agg(user_id) INTO v_allowed
  FROM public.conversation_participants
  WHERE conversation_id = NEW.conversation_id AND user_id <> NEW.sender_id;

  PERFORM public.notify_mentions(NEW.content, NEW.sender_id, 'message', NEW.conversation_id, NEW.id, v_allowed);
  RETURN NEW;
END;
$$;