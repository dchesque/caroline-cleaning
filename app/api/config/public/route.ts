// app/api/config/public/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Public-safe configuration keys. Only these are returned to unauthenticated callers.
 * NEVER add tracking tokens, access tokens, notification settings, or system internals here.
 */
const PUBLIC_KEYS = [
    // Business identity
    'business_name', 'business_phone', 'business_phone_display',
    'business_email', 'business_address', 'business_website',
    'business_logo', 'business_description',
    'social_facebook', 'social_instagram', 'social_twitter', 'social_google',
    // Hero section
    'hero_title', 'hero_title_1', 'hero_title_2', 'hero_subtitle',
    'hero_cta_text', 'hero_image',
    // Badges
    'badges_enabled', 'badges_rating', 'badges_reviews_count',
    'badges_years_experience', 'badges_google_reviews_url',
    // Chat / AI (public-facing settings only)
    'chat_enabled', 'chat_bot_name', 'ai_name', 'ai_avatar', 'ai_greeting', 'chat_position',
    // FAQ
    'faq_title', 'faq_subtitle', 'faq_items',
    // About Us
    'about_title', 'about_image', 'about_intro_p1', 'about_intro_p2',
    'about_note', 'about_quote', 'about_highlights', 'about_divider_subtitle',
    'about_bio_p1', 'about_bio_p2', 'about_bio_p3',
    'about_founder_name', 'about_founder_role',
    // Services
    'services_title', 'services_subtitle', 'services_cta_text',
    // How It Works
    'how_it_works_title', 'how_it_works_subtitle', 'how_it_works_cta',
    // What's Included
    'whats_included_title', 'whats_included_subtitle',
    'whats_included_standard', 'whats_included_optional',
    // Testimonials
    'testimonials_title', 'testimonials_subtitle', 'testimonials_items',
    // CTA Section
    'cta_title', 'cta_subtitle', 'cta_button_text',
    // Contact Form
    'contact_title', 'contact_subtitle',
    // Pricing display
    'pricing_title', 'pricing_subtitle', 'pricing_format',
    'pricing_cta_text', 'pricing_cta_subtext',
    // SEO
    'seo_title', 'seo_description', 'seo_keywords', 'seo_og_image',
    // Announcement banner
    'announcement_enabled', 'announcement_text', 'announcement_bg_color',
    // Operating hours (public-facing schedule info)
    'operating_start', 'operating_end', 'operating_days',
]

export async function GET() {
    try {
        const supabase = await createClient()

        // Buscar configurações — only public-safe keys
        const { data: config } = await supabase
            .from('configuracoes')
            .select('chave, valor')
            .in('chave', PUBLIC_KEYS)

        // Buscar áreas ativas
        const { data: areas } = await supabase
            .from('areas_atendidas')
            .select('nome, cidade')
            .eq('ativo', true)
            .order('nome')

        // Buscar pricing ativo
        const { data: pricing } = await supabase
            .from('pricing_config')
            .select('*')
            .eq('is_active', true)
            .order('display_order')

        // Montar objeto de configuração
        const businessConfig = config?.reduce((acc, item) => {
            acc[item.chave] = item.valor
            return acc
        }, {} as Record<string, any>) || {}

        return NextResponse.json({
            business: businessConfig,
            areas: areas || [],
            pricing: pricing || [],
        })
    } catch (error) {
        console.error('Error fetching public config:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
