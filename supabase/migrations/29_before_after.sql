-- supabase/migrations/29_before_after.sql
-- Before/After gallery table + public storage bucket

create table public.before_after (
  id            uuid        primary key default gen_random_uuid(),
  titulo        text        not null,
  imagem_antes  text        not null,
  imagem_depois text        not null,
  ordem         int         not null default 0,
  ativo         bool        not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index before_after_active_order_idx
  on public.before_after (ativo, ordem);

-- updated_at trigger (reuses function defined in 06_user_profiles.sql)
create trigger before_after_set_updated_at
  before update on public.before_after
  for each row execute function update_updated_at_column();

-- RLS
alter table public.before_after enable row level security;

create policy "before_after public read active"
  on public.before_after for select
  to anon, authenticated
  using (ativo = true);

-- Admin writes go through service_role (bypasses RLS); no write policies needed.
grant all on public.before_after to service_role;

-- Storage bucket (public read)
insert into storage.buckets (id, name, public)
values ('before-after', 'before-after', true)
on conflict (id) do nothing;

create policy "before_after bucket public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'before-after');
