
-- Remove duplicate reactions keeping earliest
DELETE FROM public.post_likes a
USING public.post_likes b
WHERE a.post_id = b.post_id
  AND a.user_id = b.user_id
  AND a.ctid > b.ctid;

ALTER TABLE public.post_likes
  ADD CONSTRAINT post_likes_post_user_unique UNIQUE (post_id, user_id);
