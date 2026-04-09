-- =============================================
-- MIGRATION: Security — FASE 2A Kill remaining anon data leaks
-- Date: 2026-04-09
-- =============================================
-- 1. clientes "Anon can read clients for carol chat" leaked all customer PII
--    (names, phones, emails, addresses). Carol backend uses createAdminClient()
--    (service_role bypasses RLS), so this policy is dead code AND an active leak.
-- 2. configuracoes "Public read settings" allowed anon to read ALL settings
--    via PostgREST, including tracking_meta_access_token (Meta CAPI secret).
--    Replaced with a whitelist policy that mirrors the PUBLIC_KEYS list in
--    app/api/config/public/route.ts so DB and app agree on what anon sees.
-- =============================================

DROP POLICY IF EXISTS "Anon can read clients for carol chat" ON public.clientes;

DROP POLICY IF EXISTS "Public read settings" ON public.configuracoes;

CREATE POLICY "Anon read public settings keys"
  ON public.configuracoes FOR SELECT TO anon
  USING (
    chave = ANY (ARRAY[
      -- Business identity
      'business_name','business_phone','business_phone_display','business_email',
      'business_address','business_website','business_logo','business_description',
      'social_facebook','social_instagram','social_twitter','social_google',
      -- Hero / Badges / Chat / About / Services / How / Pricing / CTA / Contact / SEO / FAQ / Announcement
      'hero_title','hero_title_1','hero_title_2','hero_subtitle','hero_cta_text','hero_cta_secondary','hero_image',
      'badges_enabled','badges_rating','badges_reviews_count','badges_years_experience','badges_google_reviews_url',
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
      'empresa_nome','empresa_email','empresa_telefone'
    ])
  );
