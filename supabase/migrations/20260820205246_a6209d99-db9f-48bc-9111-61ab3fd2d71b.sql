REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_blocked(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recruiter_blocked(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_dm(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_hashtags(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_talent_access(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.talent_access_quota() TO authenticated;