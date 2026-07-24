
DROP TRIGGER IF EXISTS post_replies_increment ON public.post_replies;
DROP TRIGGER IF EXISTS post_replies_decrement ON public.post_replies;

CREATE TRIGGER post_replies_increment
AFTER INSERT ON public.post_replies
FOR EACH ROW EXECUTE FUNCTION public.increment_post_replies();

CREATE TRIGGER post_replies_decrement
AFTER DELETE ON public.post_replies
FOR EACH ROW EXECUTE FUNCTION public.decrement_post_replies();

-- Resync counts to actual
UPDATE public.posts p
SET reply_count = COALESCE(sub.c, 0)
FROM (
  SELECT post_id, COUNT(*)::int AS c FROM public.post_replies GROUP BY post_id
) sub
WHERE p.id = sub.post_id;

UPDATE public.posts
SET reply_count = 0
WHERE reply_count IS NULL OR id NOT IN (SELECT DISTINCT post_id FROM public.post_replies);
