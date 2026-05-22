create or replace function public.dashboard_stats()
returns table (
  gmv numeric,
  platform_fee numeric,
  vendor_net numeric,
  total_vendors int,
  total_users int,
  total_events int,
  live_events int
) language sql security definer as $$
  select
    coalesce(sum(t.amount),0)                as gmv,
    coalesce(sum(t.platform_fee),0)          as platform_fee,
    coalesce(sum(t.vendor_net),0)            as vendor_net,
    (select count(*) from profiles where role='vendor') as total_vendors,
    (select count(*) from profiles)          as total_users,
    (select count(*) from events)            as total_events,
    (select count(*) from events where status='published') as live_events;
$$;
