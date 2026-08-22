CREATE OR REPLACE FUNCTION public.protect_verified_recruiter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_privileged boolean;
BEGIN
  v_privileged := public.has_role(auth.uid(), 'admin')
    OR coalesce(auth.jwt() ->> 'role', '') = 'service_role';

  IF NOT v_privileged THEN
    IF NEW.is_verified_recruiter IS DISTINCT FROM OLD.is_verified_recruiter THEN
      NEW.is_verified_recruiter := OLD.is_verified_recruiter;
    END IF;
    IF NEW.recruiter_status IS DISTINCT FROM OLD.recruiter_status THEN
      NEW.recruiter_status := OLD.recruiter_status;
    END IF;
  END IF;

  -- Keep the legacy boolean aligned with the status
  IF NEW.recruiter_status IS DISTINCT FROM OLD.recruiter_status THEN
    NEW.is_verified_recruiter := (NEW.recruiter_status = 'approved');
  END IF;

  RETURN NEW;
END;
$function$;