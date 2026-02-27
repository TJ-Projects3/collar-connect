-- Remove duplicate triggers that cause double notifications
DROP TRIGGER IF EXISTS trigger_notify_on_connection_request ON public.user_connections;
DROP TRIGGER IF EXISTS trigger_notify_on_connection_accept ON public.user_connections;