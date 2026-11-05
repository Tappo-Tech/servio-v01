-- Cashier-only Web Push subscriptions and server-authoritative event dispatch.
-- The shared webhook credential is stored separately in Supabase Vault; never place it in this file.

create extension if not exists pg_net;

create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%'),
  p256dh text not null,
  auth text not null,
  language text not null default 'ar' check (language in ('ar', 'en')),
  device_label text not null default 'Cashier device',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_subscriptions_branch_idx
  on public.notification_subscriptions (tenant_id, branch_id, user_id);

create table if not exists public.notification_events (
  event_type text not null check (event_type in ('order', 'waiter_call')),
  event_id uuid not null,
  tenant_id uuid not null,
  branch_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (event_type, event_id)
);

create table if not exists public.notification_deliveries (
  event_type text not null,
  event_id uuid not null,
  subscription_id uuid not null references public.notification_subscriptions(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'expired')),
  http_status integer,
  attempted_at timestamptz,
  completed_at timestamptz,
  primary key (event_type, event_id, subscription_id),
  foreign key (event_type, event_id)
    references public.notification_events(event_type, event_id) on delete cascade
);

create index if not exists notification_deliveries_status_idx
  on public.notification_deliveries (status, attempted_at);

alter table public.notification_subscriptions enable row level security;
alter table public.notification_events enable row level security;
alter table public.notification_deliveries enable row level security;

drop policy if exists notification_subscriptions_select_self on public.notification_subscriptions;
create policy notification_subscriptions_select_self
  on public.notification_subscriptions for select to authenticated
  using (user_id = auth.uid());

drop policy if exists notification_subscriptions_delete_self on public.notification_subscriptions;
create policy notification_subscriptions_delete_self
  on public.notification_subscriptions for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.notification_subscriptions from anon, authenticated;
grant select, delete on public.notification_subscriptions to authenticated;
revoke all on public.notification_events from anon, authenticated;
revoke all on public.notification_deliveries from anon, authenticated;

create or replace function public.save_cashier_notification_subscription(
  p_subscription jsonb,
  p_branch_id uuid,
  p_language text,
  p_device_label text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_subscription_id uuid;
  v_endpoint text := p_subscription->>'endpoint';
  v_p256dh text := p_subscription->'keys'->>'p256dh';
  v_auth text := p_subscription->'keys'->>'auth';
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_language not in ('ar', 'en') then raise exception 'Unsupported language' using errcode = '22023'; end if;
  if v_endpoint is null or length(v_endpoint) > 2048 or v_endpoint not like 'https://%'
     or v_p256dh is null or length(v_p256dh) > 256 or v_auth is null or length(v_auth) > 256 then
    raise exception 'Invalid push subscription' using errcode = '22023';
  end if;

  select c.tenant_id into v_tenant_id
  from public.profiles p
  join public.cashiers c on c.auth_user_id = p.id
  join public.branches b on b.id = c.branch_id and b.tenant_id = c.tenant_id and b.is_active
  where p.id = v_user_id and p.role = 'cashier'
    and c.is_active and c.branch_id = p_branch_id;

  if v_tenant_id is null then raise exception 'Active cashier branch required' using errcode = '42501'; end if;

  insert into public.notification_subscriptions (
    user_id, tenant_id, branch_id, endpoint, p256dh, auth, language, device_label, updated_at
  ) values (
    v_user_id, v_tenant_id, p_branch_id, v_endpoint, v_p256dh, v_auth, p_language,
    left(coalesce(nullif(btrim(p_device_label), ''), 'Cashier device'), 80), now()
  )
  on conflict (endpoint) do update set
    user_id = excluded.user_id,
    tenant_id = excluded.tenant_id,
    branch_id = excluded.branch_id,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    language = excluded.language,
    device_label = excluded.device_label,
    updated_at = now()
  returning id into v_subscription_id;

  return v_subscription_id;
end;
$$;

revoke all on function public.save_cashier_notification_subscription(jsonb, uuid, text, text) from public, anon;
grant execute on function public.save_cashier_notification_subscription(jsonb, uuid, text, text) to authenticated;

create or replace function public.claim_cashier_notification_deliveries(
  p_secret text,
  p_event_type text,
  p_event_id uuid
)
returns table (
  subscription_id uuid,
  push_subscription jsonb,
  notification_title text,
  notification_body text,
  notification_url text
)
language plpgsql
security definer
set search_path = public, auth, vault, pg_temp
as $$
declare
  v_expected_secret text;
  v_tenant_id uuid;
  v_branch_id uuid;
  v_table_number text;
  v_new_event integer;
  v_recent_events integer;
begin
  select decrypted_secret into v_expected_secret
  from vault.decrypted_secrets
  where name = 'servio_notify_webhook_secret'
  limit 1;

  if v_expected_secret is null or p_secret is null or p_secret <> v_expected_secret then
    raise exception 'Unauthorized notification dispatch' using errcode = '28000';
  end if;
  if p_event_type not in ('order', 'waiter_call') or p_event_id is null then
    raise exception 'Invalid notification event' using errcode = '22023';
  end if;

  if p_event_type = 'order' then
    select o.tenant_id, o.branch_id, o.table_number::text
      into v_tenant_id, v_branch_id, v_table_number
    from public.orders o where o.id = p_event_id;
  else
    select w.tenant_id, w.branch_id, w.table_number::text
      into v_tenant_id, v_branch_id, v_table_number
    from public.waiter_calls w where w.id = p_event_id;
  end if;

  if v_tenant_id is null or v_branch_id is null then return; end if;
  if not exists (
    select 1 from public.branches b
    where b.id = v_branch_id and b.tenant_id = v_tenant_id and b.is_active
  ) then return; end if;

  insert into public.notification_events (event_type, event_id, tenant_id, branch_id)
  values (p_event_type, p_event_id, v_tenant_id, v_branch_id)
  on conflict do nothing;
  get diagnostics v_new_event = row_count;
  if v_new_event = 0 then return; end if;

  select count(*) into v_recent_events
  from public.notification_events e
  where e.tenant_id = v_tenant_id and e.branch_id = v_branch_id
    and e.event_type = p_event_type and e.created_at >= now() - interval '1 minute';
  if v_recent_events > 120 then return; end if;

  insert into public.notification_deliveries (event_type, event_id, subscription_id)
  select p_event_type, p_event_id, s.id
  from public.notification_subscriptions s
  join public.profiles p on p.id = s.user_id and p.role = 'cashier' and p.tenant_id = s.tenant_id
  join public.cashiers c on c.auth_user_id = s.user_id and c.is_active
    and c.tenant_id = s.tenant_id and c.branch_id = s.branch_id
  where s.tenant_id = v_tenant_id and s.branch_id = v_branch_id
  on conflict do nothing;

  return query
  update public.notification_deliveries d
  set status = 'sending', attempted_at = now()
  from public.notification_subscriptions s
  where d.event_type = p_event_type and d.event_id = p_event_id
    and d.subscription_id = s.id and d.status = 'pending'
  returning s.id,
    jsonb_build_object('endpoint', s.endpoint, 'keys', jsonb_build_object('p256dh', s.p256dh, 'auth', s.auth)),
    case when s.language = 'en'
      then case when p_event_type = 'order' then 'New order' else 'New service call' end
      else case when p_event_type = 'order' then 'طلب جديد' else 'استدعاء خدمة جديد' end
    end,
    case when s.language = 'en'
      then (case when p_event_type = 'order' then 'New order' else 'New service call' end) || ' — Table ' || coalesce(v_table_number, '—')
      else (case when p_event_type = 'order' then 'طلب جديد' else 'استدعاء خدمة جديد' end) || ' — الطاولة ' || coalesce(v_table_number, '—')
    end,
    '/dashboard';
end;
$$;

create or replace function public.record_cashier_notification_delivery(
  p_secret text,
  p_event_type text,
  p_event_id uuid,
  p_subscription_id uuid,
  p_status text,
  p_http_status integer
)
returns boolean
language plpgsql
security definer
set search_path = public, vault, pg_temp
as $$
declare
  v_expected_secret text;
  v_updated integer;
begin
  select decrypted_secret into v_expected_secret
  from vault.decrypted_secrets
  where name = 'servio_notify_webhook_secret'
  limit 1;

  if v_expected_secret is null or p_secret is null or p_secret <> v_expected_secret then
    raise exception 'Unauthorized notification dispatch' using errcode = '28000';
  end if;
  if p_status not in ('sent', 'failed', 'expired') then
    raise exception 'Invalid delivery status' using errcode = '22023';
  end if;

  update public.notification_deliveries
  set status = p_status, http_status = p_http_status, completed_at = now()
  where event_type = p_event_type and event_id = p_event_id
    and subscription_id = p_subscription_id and status = 'sending';
  get diagnostics v_updated = row_count;

  if p_status = 'expired' then
    delete from public.notification_subscriptions where id = p_subscription_id;
  end if;

  return v_updated > 0;
end;
$$;

revoke all on function public.claim_cashier_notification_deliveries(text, text, uuid) from public, authenticated;
grant execute on function public.claim_cashier_notification_deliveries(text, text, uuid) to anon;
revoke all on function public.record_cashier_notification_delivery(text, text, uuid, uuid, text, integer) from public, authenticated;
grant execute on function public.record_cashier_notification_delivery(text, text, uuid, uuid, text, integer) to anon;

create or replace function public.queue_new_cashier_notification()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net, pg_temp
as $$
declare
  v_secret text;
  v_event_type text;
begin
  v_event_type := case when tg_table_name = 'orders' then 'order' else 'waiter_call' end;
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'servio_notify_webhook_secret'
  limit 1;

  if v_secret is null then
    raise warning 'SERVIO Web Push secret is not configured; notification was skipped';
    return new;
  end if;

  perform net.http_post(
    url := 'https://servio-mvp.vercel.app/api/notifications/dispatch',
    body := jsonb_build_object('event_type', v_event_type, 'event_id', new.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    timeout_milliseconds := 3000
  );
  return new;
exception when others then
  raise warning 'SERVIO Web Push enqueue failed for % (SQLSTATE %)', tg_table_name, sqlstate;
  return new;
end;
$$;

revoke all on function public.queue_new_cashier_notification() from public, anon, authenticated;

drop trigger if exists orders_queue_cashier_notification on public.orders;
create trigger orders_queue_cashier_notification
after insert on public.orders
for each row execute function public.queue_new_cashier_notification();

drop trigger if exists waiter_calls_queue_cashier_notification on public.waiter_calls;
create trigger waiter_calls_queue_cashier_notification
after insert on public.waiter_calls
for each row execute function public.queue_new_cashier_notification();
