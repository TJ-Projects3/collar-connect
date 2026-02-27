-- Replace public SELECT policy with authenticated-only policy
DROP POLICY "Anyone can view experiences" ON public.experiences;

CREATE POLICY "Authenticated users can view experiences"
  ON public.experiences FOR SELECT
  TO authenticated
  USING (true);