ALTER TABLE public.post_replies
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image','gif'));