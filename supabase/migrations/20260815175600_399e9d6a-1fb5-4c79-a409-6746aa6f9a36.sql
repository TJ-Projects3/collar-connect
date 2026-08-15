-- 1. Extend the persona enum (referenced by text comparison elsewhere so it stays transaction-safe)
ALTER TYPE public.profile_type ADD VALUE IF NOT EXISTS 'industry';

-- 2. Profile columns for the industry persona + student visibility control
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS industry_role_title text,
  ADD COLUMN IF NOT EXISTS industry_company text,
  ADD COLUMN IF NOT EXISTS industry_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visible_to_industry boolean NOT NULL DEFAULT true;

-- Only admins may flip industry_verified
CREATE OR REPLACE FUNCTION public.protect_industry_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.industry_verified IS DISTINCT FROM OLD.industry_verified THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.industry_verified := OLD.industry_verified;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_industry_verified_trg ON public.profiles;
CREATE TRIGGER protect_industry_verified_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_industry_verified();

-- 3. Company accounts
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  website text,
  company_size text,
  industry text,
  description text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS companies_owner_unique ON public.companies(owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view companies"
ON public.companies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Owners can create their company"
ON public.companies FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and admins can update companies"
ON public.companies FOR UPDATE TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners and admins can delete companies"
ON public.companies FOR DELETE TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS companies_updated_at ON public.companies;
CREATE TRIGGER companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Company verification is admin-controlled
CREATE OR REPLACE FUNCTION public.protect_company_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_verified AND NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.is_verified := false;
    END IF;
  ELSIF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.is_verified := OLD.is_verified;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_company_verification_trg ON public.companies;
CREATE TRIGGER protect_company_verification_trg
BEFORE INSERT OR UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.protect_company_verification();

-- 4. Daily caps for industry accounts, enforced server-side
CREATE TABLE IF NOT EXISTS public.talent_access_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  access_kind text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS talent_access_log_viewer_day
  ON public.talent_access_log(viewer_id, access_kind, created_at DESC);

GRANT SELECT ON public.talent_access_log TO authenticated;
GRANT ALL ON public.talent_access_log TO service_role;

ALTER TABLE public.talent_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Viewers can read their own access log"
ON public.talent_access_log FOR SELECT TO authenticated
USING (auth.uid() = viewer_id OR public.has_role(auth.uid(), 'admin'));

-- Returns { allowed, remaining, limit, uncapped } and records the access when allowed.
CREATE OR REPLACE FUNCTION public.record_talent_access(_target_id uuid, _kind text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type text;
  v_limit int;
  v_used int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _kind NOT IN ('view', 'contact') THEN
    RAISE EXCEPTION 'Invalid access kind';
  END IF;

  SELECT profile_type::text INTO v_type FROM public.profiles WHERE id = auth.uid();

  -- Recruiters and admins are uncapped
  IF v_type = 'recruiter' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('allowed', true, 'uncapped', true, 'remaining', null, 'limit', null);
  END IF;

  IF v_type <> 'industry' THEN
    RETURN jsonb_build_object('allowed', false, 'uncapped', false, 'remaining', 0, 'limit', 0);
  END IF;

  v_limit := CASE WHEN _kind = 'view' THEN 60 ELSE 15 END;

  SELECT count(*) INTO v_used
  FROM public.talent_access_log
  WHERE viewer_id = auth.uid()
    AND access_kind = _kind
    AND created_at >= (now() - interval '1 day');

  IF v_used >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'uncapped', false, 'remaining', 0, 'limit', v_limit);
  END IF;

  INSERT INTO public.talent_access_log (viewer_id, target_id, access_kind)
  VALUES (auth.uid(), _target_id, _kind);

  RETURN jsonb_build_object(
    'allowed', true,
    'uncapped', false,
    'remaining', v_limit - v_used - 1,
    'limit', v_limit
  );
END;
$$;

-- Read-only remaining-quota helper for UI display
CREATE OR REPLACE FUNCTION public.talent_access_quota()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type text;
  v_views int;
  v_contacts int;
BEGIN
  SELECT profile_type::text INTO v_type FROM public.profiles WHERE id = auth.uid();

  IF v_type = 'recruiter' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('uncapped', true);
  END IF;

  SELECT
    count(*) FILTER (WHERE access_kind = 'view'),
    count(*) FILTER (WHERE access_kind = 'contact')
  INTO v_views, v_contacts
  FROM public.talent_access_log
  WHERE viewer_id = auth.uid()
    AND created_at >= (now() - interval '1 day');

  RETURN jsonb_build_object(
    'uncapped', false,
    'views_used', COALESCE(v_views, 0),
    'views_limit', 60,
    'contacts_used', COALESCE(v_contacts, 0),
    'contacts_limit', 15
  );
END;
$$;