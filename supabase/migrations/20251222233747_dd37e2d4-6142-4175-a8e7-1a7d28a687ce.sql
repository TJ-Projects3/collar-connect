-- Create post_replies table
CREATE TABLE public.post_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view replies"
  ON public.post_replies
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create own replies"
  ON public.post_replies
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own replies"
  ON public.post_replies
  FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all replies"
  ON public.post_replies
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add reply_count to posts
ALTER TABLE public.posts ADD COLUMN reply_count INTEGER NOT NULL DEFAULT 0;

-- Function to increment reply count
CREATE OR REPLACE FUNCTION public.increment_post_replies()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET reply_count = reply_count + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement reply count
CREATE OR REPLACE FUNCTION public.decrement_post_replies()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.posts
  SET reply_count = GREATEST(reply_count - 1, 0)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER increment_replies_on_insert
  AFTER INSERT ON public.post_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_post_replies();

CREATE TRIGGER decrement_replies_on_delete
  AFTER DELETE ON public.post_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_post_replies();