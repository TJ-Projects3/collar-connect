
-- Remove both public SELECT policies
DROP POLICY "Anyone can view profiles" ON public.profiles;
DROP POLICY "Profiles are viewable by everyone" ON public.profiles;

-- Replace with authenticated-only policy
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
