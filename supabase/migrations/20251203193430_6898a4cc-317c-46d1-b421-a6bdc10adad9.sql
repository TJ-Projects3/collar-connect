-- 1. Drop the redundant users table
DROP TABLE IF EXISTS public.users;

-- 2. Add company column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company text;

-- 3. Fix handle_updated_at function security
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;