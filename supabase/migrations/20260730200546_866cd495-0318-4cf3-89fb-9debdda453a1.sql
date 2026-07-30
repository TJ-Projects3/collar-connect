DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_status') THEN
    CREATE TYPE public.availability_status AS ENUM (
      'summer_intern',
      'fall_coop',
      'part_time',
      'full_time_new_grad',
      'not_looking'
    );
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS availability public.availability_status;