-- Create enum for event types
CREATE TYPE public.event_type AS ENUM ('virtual', 'in_person', 'hybrid');

-- Create enum for resource types
CREATE TYPE public.resource_type AS ENUM ('job', 'article', 'video', 'download');

-- Create enum for attendee status
CREATE TYPE public.attendee_status AS ENUM ('registered', 'waitlisted', 'cancelled', 'attended');

-- 1. EVENTS TABLE
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type event_type NOT NULL DEFAULT 'virtual',
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  location text,
  virtual_link text,
  capacity integer,
  image_url text,
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events RLS: Anyone can view published events, admins can manage all
CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all events"
  ON public.events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. EVENT_SPEAKERS TABLE
CREATE TABLE public.event_speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  title text,
  bio text,
  avatar_url text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_speakers ENABLE ROW LEVEL SECURITY;

-- Speakers RLS: Anyone can view, admins can manage
CREATE POLICY "Anyone can view event speakers"
  ON public.event_speakers FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage event speakers"
  ON public.event_speakers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. EVENT_ATTENDEES TABLE
CREATE TABLE public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status attendee_status NOT NULL DEFAULT 'registered',
  registered_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Attendees RLS: Users can manage own registrations, admins can view all
CREATE POLICY "Users can view own registrations"
  ON public.event_attendees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations"
  ON public.event_attendees FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can register for events"
  ON public.event_attendees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registration"
  ON public.event_attendees FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel own registration"
  ON public.event_attendees FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all registrations"
  ON public.event_attendees FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_event_attendees_updated_at
  BEFORE UPDATE ON public.event_attendees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. RESOURCES TABLE (Content Hub)
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content text,
  resource_type resource_type NOT NULL,
  external_url text,
  file_url text,
  image_url text,
  company text,
  location text,
  tags text[],
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Resources RLS: Anyone can view published, admins can manage all
CREATE POLICY "Anyone can view published resources"
  ON public.resources FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all resources"
  ON public.resources FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();