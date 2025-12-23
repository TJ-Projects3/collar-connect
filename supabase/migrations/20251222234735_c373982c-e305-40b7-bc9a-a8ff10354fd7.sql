-- Enable Row Level Security on post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes (needed for displaying like counts)
CREATE POLICY "Anyone can view likes"
ON public.post_likes
FOR SELECT
USING (true);

-- Users can only create likes for themselves
CREATE POLICY "Users can create own likes"
ON public.post_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own likes
CREATE POLICY "Users can delete own likes"
ON public.post_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all likes
CREATE POLICY "Admins can manage all likes"
ON public.post_likes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));