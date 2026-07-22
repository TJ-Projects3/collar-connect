
-- 1. Enum
DO $$ BEGIN
  CREATE TYPE public.profile_type AS ENUM ('student', 'recruiter');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_type public.profile_type NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS company_title text,
  ADD COLUMN IF NOT EXISTS is_verified_recruiter boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS university text,
  ADD COLUMN IF NOT EXISTS major text,
  ADD COLUMN IF NOT EXISTS graduation_year integer,
  ADD COLUMN IF NOT EXISTS gpa numeric(3,2);

-- 3. Prevent non-admins from setting is_verified_recruiter = true on their own row
CREATE OR REPLACE FUNCTION public.protect_verified_recruiter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_verified_recruiter IS DISTINCT FROM OLD.is_verified_recruiter THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.is_verified_recruiter := OLD.is_verified_recruiter;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_verified_recruiter_trg ON public.profiles;
CREATE TRIGGER protect_verified_recruiter_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_verified_recruiter();

-- 4. Update handle_new_user to persist profile_type + role-specific meta from signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type public.profile_type;
BEGIN
  v_type := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'profile_type', '')::public.profile_type,
    'student'
  );

  INSERT INTO public.profiles (
    id, full_name, profile_type,
    university, major, graduation_year,
    company_name, company_title
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    v_type,
    NULLIF(NEW.raw_user_meta_data ->> 'university', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'major', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'graduation_year', '')::int,
    NULLIF(NEW.raw_user_meta_data ->> 'company_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'company_title', '')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;
