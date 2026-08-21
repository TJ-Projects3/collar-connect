ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS technical_skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_tracks text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS work_status text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS work_authorization text,
  ADD COLUMN IF NOT EXISTS graduation_month smallint,
  ADD COLUMN IF NOT EXISTS mentorship_offerings text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS booking_url text,
  ADD COLUMN IF NOT EXISTS seniority_level text,
  ADD COLUMN IF NOT EXISTS hiring_work_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_email_domain text;

CREATE OR REPLACE FUNCTION public.validate_profile_role_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.graduation_month IS NOT NULL AND (NEW.graduation_month < 1 OR NEW.graduation_month > 12) THEN
    RAISE EXCEPTION 'graduation_month must be between 1 and 12';
  END IF;

  IF NEW.technical_skills IS NULL THEN NEW.technical_skills := '{}'; END IF;
  IF NEW.target_tracks IS NULL THEN NEW.target_tracks := '{}'; END IF;
  IF NEW.work_status IS NULL THEN NEW.work_status := '{}'; END IF;
  IF NEW.mentorship_offerings IS NULL THEN NEW.mentorship_offerings := '{}'; END IF;
  IF NEW.hiring_work_types IS NULL THEN NEW.hiring_work_types := '{}'; END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_profile_role_fields_trg ON public.profiles;
CREATE TRIGGER validate_profile_role_fields_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_role_fields();