CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    company_name, company_title,
    company_email, company_website, linkedin_url, hiring_roles,
    industry_company, industry_role_title,
    current_company, "current_role", years_of_experience,
    areas_of_expertise, mentorship_opt_in
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    v_type,
    NULLIF(NEW.raw_user_meta_data ->> 'university', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'major', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'graduation_year', '')::int,
    NULLIF(NEW.raw_user_meta_data ->> 'company_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'company_title', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'company_email', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'company_website', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'linkedin_url', ''),
    COALESCE(
      string_to_array(NULLIF(btrim(NEW.raw_user_meta_data ->> 'hiring_roles'), ''), ','),
      '{}'
    ),
    NULLIF(NEW.raw_user_meta_data ->> 'industry_company', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'industry_role_title', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'industry_company', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'industry_role_title', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'years_of_experience', '')::int,
    COALESCE(
      string_to_array(NULLIF(btrim(NEW.raw_user_meta_data ->> 'areas_of_expertise'), ''), ','),
      '{}'
    ),
    COALESCE((NEW.raw_user_meta_data ->> 'mentorship_opt_in')::boolean, false)
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$function$;