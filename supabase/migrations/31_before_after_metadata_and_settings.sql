-- supabase/migrations/31_before_after_metadata_and_settings.sql
-- Adds optional metadata to before_after items + seeds display settings.

alter table public.before_after
  add column if not exists tipo_servico text,
  add column if not exists cidade       text;

-- Seed display settings into the configuracoes KV table so defaults exist in DB.
-- Notes:
--   * `valor` is jsonb, so values are wrapped via to_jsonb (strings as JSON
--     strings, numbers as JSON numbers).
--   * `categoria` is constrained to a fixed allow-list (see configuracoes_categoria_check);
--     'before_after' is not allowed, so we follow the existing landing-page convention
--     of grupo='pagina_inicial' / categoria='pagina_inicial' and use the chave prefix
--     (`before_after_*`) as the sub-section discriminator.
--   * Existing rows are left alone (on conflict do nothing) — admin can edit freely.
insert into public.configuracoes (chave, valor, grupo, categoria)
values
  ('before_after_display_mode', to_jsonb('slider'::text),    'pagina_inicial', 'pagina_inicial'),
  ('before_after_stat_count',   to_jsonb(500),               'pagina_inicial', 'pagina_inicial'),
  ('before_after_stat_region',  to_jsonb('Tampa Bay'::text), 'pagina_inicial', 'pagina_inicial')
on conflict (chave) do nothing;
