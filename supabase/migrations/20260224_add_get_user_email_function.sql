-- Create a function to safely get user email from auth.users
CREATE OR REPLACE FUNCTION public.get_user_email(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = user_id LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.get_user_email(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_user_email(UUID) IS 'Safely retrieves the email address associated with a user ID from auth.users table';
