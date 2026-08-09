-- These legacy igreja functions are not application RPCs.
-- The user trigger runs independently, and campaign_views already has an anon INSERT policy.
revoke execute on function public.handle_new_user_igreja() from authenticated;
revoke execute on function public.increment_campaign_views(uuid) from authenticated;
