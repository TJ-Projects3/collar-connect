
-- 1. Remove permissive INSERT policy on notifications
-- SECURITY DEFINER triggers bypass RLS, so no INSERT policy needed
DROP POLICY "Allow notification inserts" ON public.notifications;

-- 2. Remove overly permissive INSERT and UPDATE on conversations
-- send_dm() is SECURITY DEFINER and bypasses RLS for create/update
DROP POLICY "Users can create conversations" ON public.conversations;
DROP POLICY "Allow participants to update conversation" ON public.conversations;
