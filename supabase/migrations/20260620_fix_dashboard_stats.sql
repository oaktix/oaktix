-- Fix dashboard_stats(): add missing FROM clause so GMV/fee/vendor_net actually aggregate
-- Both prior migrations (20240604, 20240901) referenced alias `t` without a FROM clause,
-- causing PostgreSQL to reject the function and return NULL/0 for all sum() columns.

create or replace function public.dashboard_stats()
returns table (
  gmv           numeric,
  platform_fee  numeric,
  vendor_net    numeric,
  total_vendors int,
  total_users   int,
  total_events  int,
  live_events   int
) language sql security definer as $$
  select
    coalesce(sum(t.amount), 0)::numeric           as gmv,
    coalesce(sum(t.platform_fee), 0)::numeric     as platform_fee,
    coalesce(sum(t.vendor_net), 0)::numeric       as vendor_net,
    (select count(*)::int from profiles where role = 'vendor')           as total_vendors,
    (select count(*)::int from profiles)                                  as total_users,
    (select count(*)::int from events)                                    as total_events,
    (select count(*)::int from events where status = 'published')        as live_events
  from transactions t
  where t.status = 'success'
$$;

-- Grant execute to authenticated users (super admin calls this via RPC with their session)
grant execute on function public.dashboard_stats() to authenticated;
