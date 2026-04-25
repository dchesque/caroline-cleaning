-- supabase/migrations/32_before_after_settings_anon_read.sql
-- Allow anon role to read the three before_after display settings.
-- The existing "Anon read public settings keys" policy uses a fixed allow-list,
-- so new keys must be added explicitly. We drop and recreate it with the
-- additional `before_after_*` keys appended.

drop policy if exists "Anon read public settings keys" on public.configuracoes;

create policy "Anon read public settings keys"
  on public.configuracoes
  for select
  to anon
  using (
    chave = any (array[
      'business_name','business_phone','business_phone_display','business_email',
      'business_address','business_website','business_logo','business_description',
      'social_facebook','social_instagram','social_twitter','social_google',
      'hero_title','hero_title_1','hero_title_2','hero_subtitle','hero_cta_text',
      'hero_cta_secondary','hero_image',
      'badges_enabled','badges_rating','badges_reviews_count','badges_years_experience',
      'badges_google_reviews_url',
      'chat_enabled','chat_bot_name','ai_name','ai_avatar','ai_greeting','chat_position','ai_tone',
      'faq_title','faq_subtitle','faq_items',
      'about_title','about_image','about_intro_p1','about_intro_p2','about_note','about_quote',
      'about_highlights','about_divider_subtitle','about_bio_p1','about_bio_p2','about_bio_p3',
      'about_founder_name','about_founder_role',
      'services_title','services_subtitle','services_cta_text',
      'how_it_works_title','how_it_works_subtitle','how_it_works_cta',
      'whats_included_title','whats_included_subtitle','whats_included_standard','whats_included_optional',
      'testimonials_title','testimonials_subtitle','testimonials_items',
      'cta_title','cta_subtitle','cta_button_text',
      'contact_title','contact_subtitle',
      'pricing_title','pricing_subtitle','pricing_format','pricing_cta_text','pricing_cta_subtext',
      'seo_title','seo_description','seo_keywords','seo_og_image',
      'announcement_enabled','announcement_text','announcement_bg_color',
      'operating_start','operating_end','operating_days',
      'empresa_nome','empresa_email','empresa_telefone',
      -- Before & After display settings (added 2026-04-24)
      'before_after_display_mode','before_after_stat_count','before_after_stat_region'
    ])
    or (
      chave like 'tracking_%'
      and chave not like '%access_token%'
      and chave not like '%secret%'
      and chave not like '%api_key%'
      and chave not like '%private%'
    )
  );
