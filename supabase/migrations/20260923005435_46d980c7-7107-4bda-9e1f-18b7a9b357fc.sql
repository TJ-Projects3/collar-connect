CREATE OR REPLACE FUNCTION public.notify_mentions(_content text, _author uuid, _kind text, _ref uuid, _secondary uuid DEFAULT NULL, _allowed uuid[] DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _ids uuid[];
  _target uuid;
  _sender_name text;
  _label text;
BEGIN
  IF _content IS NULL OR _author IS NULL THEN RETURN; END IF;

  SELECT array_agg(DISTINCT m[1]::uuid) INTO _ids
  FROM regexp_matches(_content, '@\[[^\]]+\]\(([0-9a-fA-F-]{36})\)', 'g') AS m;

  IF _ids IS NULL THEN RETURN; END IF;

  SELECT full_name INTO _sender_name FROM public.profiles WHERE id = _author;
  _label := COALESCE(_sender_name, 'Someone') || ' mentioned you in a ' ||
            CASE _kind WHEN 'post' THEN 'post' WHEN 'reply' THEN 'comment' ELSE 'message' END;

  FOREACH _target IN ARRAY _ids LOOP
    IF _target = _author THEN CONTINUE; END IF;
    IF _allowed IS NOT NULL AND NOT (_target = ANY(_allowed)) THEN CONTINUE; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _target) THEN CONTINUE; END IF;
    IF public.is_blocked(_author, _target) THEN CONTINUE; END IF;

    INSERT INTO public.notifications (user_id, sender_id, type, title, body, reference_id, secondary_reference_id, is_read)
    VALUES (_target, _author, 'mention', 'New mention', _label, _ref, _secondary, false);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_mentions_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.notify_mentions(NEW.content, NEW.author_id, 'post', NEW.id, NULL, NULL);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_mentions_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.notify_mentions(NEW.content, NEW.author_id, 'reply', NEW.post_id, NEW.id, NULL);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_mentions_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.notify_mentions(NEW.content, NEW.sender_id, 'message', NEW.conversation_id, NEW.id, ARRAY[NEW.recipient_id]);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_mentions_post ON public.posts;
CREATE TRIGGER trg_notify_mentions_post AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.notify_mentions_post();

DROP TRIGGER IF EXISTS trg_notify_mentions_reply ON public.post_replies;
CREATE TRIGGER trg_notify_mentions_reply AFTER INSERT ON public.post_replies FOR EACH ROW EXECUTE FUNCTION public.notify_mentions_reply();

DROP TRIGGER IF EXISTS trg_notify_mentions_message ON public.messages;
CREATE TRIGGER trg_notify_mentions_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_mentions_message();