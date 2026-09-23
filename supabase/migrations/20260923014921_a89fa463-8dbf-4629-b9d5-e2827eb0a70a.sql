ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mentions_connections_only boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.notify_mentions(_content text, _author uuid, _kind text, _ref uuid, _secondary uuid DEFAULT NULL::uuid, _allowed uuid[] DEFAULT NULL::uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _ids uuid[];
  _target uuid;
  _sender_name text;
  _label text;
  _restricted boolean;
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

    SELECT mentions_connections_only INTO _restricted FROM public.profiles WHERE id = _target;
    IF COALESCE(_restricted, false)
       AND NOT EXISTS (
         SELECT 1 FROM public.user_connections
         WHERE status = 'accepted'
           AND ((requester_id = _author AND receiver_id = _target)
             OR (requester_id = _target AND receiver_id = _author))
       )
    THEN CONTINUE; END IF;

    INSERT INTO public.notifications (user_id, sender_id, type, title, body, reference_id, secondary_reference_id, is_read)
    VALUES (_target, _author, 'mention', 'New mention', _label, _ref, _secondary, false);
  END LOOP;
END;
$function$;