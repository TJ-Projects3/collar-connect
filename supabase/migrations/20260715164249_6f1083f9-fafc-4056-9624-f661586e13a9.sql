ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS portfolio_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS resume_url text,
  ADD COLUMN IF NOT EXISTS featured_projects jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Enforce at most 3 featured projects and array shape
CREATE OR REPLACE FUNCTION public.validate_featured_projects()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.featured_projects IS NULL THEN
    NEW.featured_projects := '[]'::jsonb;
  END IF;
  IF jsonb_typeof(NEW.featured_projects) <> 'array' THEN
    RAISE EXCEPTION 'featured_projects must be a JSON array';
  END IF;
  IF jsonb_array_length(NEW.featured_projects) > 3 THEN
    RAISE EXCEPTION 'A maximum of 3 featured projects is allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_featured_projects_trigger ON public.profiles;
CREATE TRIGGER validate_featured_projects_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_featured_projects();