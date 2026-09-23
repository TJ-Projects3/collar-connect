REVOKE ALL ON FUNCTION public.notify_mentions(text, uuid, text, uuid, uuid, uuid[]) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.notify_mentions_post() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.notify_mentions_reply() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.notify_mentions_message() FROM anon, authenticated, public;