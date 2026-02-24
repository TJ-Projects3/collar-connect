-- Create email_preferences table to store user email notification settings
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_on_message BOOLEAN DEFAULT true,
  email_on_connection_request BOOLEAN DEFAULT true,
  email_on_connection_accepted BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT false,
  digest_frequency TEXT DEFAULT 'daily', -- daily, weekly
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create email_logs table to track sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_preferences
CREATE POLICY "Users can view own email preferences" ON public.email_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences" ON public.email_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences" ON public.email_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for email_logs (users can view their own, system can insert)
CREATE POLICY "Users can view own email logs" ON public.email_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update email logs" ON public.email_logs
  FOR UPDATE USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON public.email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_notification_id ON public.email_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status, created_at DESC);

-- Function to create default email preferences for new users
CREATE OR REPLACE FUNCTION public.create_email_preferences_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create email preferences for new users
DROP TRIGGER IF EXISTS on_auth_user_created_create_email_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_create_email_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_email_preferences_for_new_user();

-- Add comment for documentation
COMMENT ON TABLE public.email_preferences IS 'Stores user preferences for email notifications';
COMMENT ON TABLE public.email_logs IS 'Logs of all email notifications sent to users';
