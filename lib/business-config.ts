import { createClient } from '@/lib/supabase/client'

export interface BusinessSettings {
    // Empresa
    business_name: string;
    business_phone: string;
    business_phone_display: string;
    business_email: string;
    business_address: string;
    business_website: string;
    business_logo: string;
    business_description: string;
    social_facebook: string;
    social_instagram: string;
    social_twitter: string;
    social_google: string;

    // Página Inicial - Hero
    hero_title: string;
    hero_title_1: string;
    hero_title_2: string;
    hero_subtitle: string;
    hero_cta_text: string;
    hero_image: string;

    // Página Inicial - Badges
    badges_enabled: boolean;
    badges_rating: string;
    badges_reviews_count: string;
    badges_years_experience: string;
    badges_google_reviews_url: string;

    // Página Inicial - Chat/IA
    chat_enabled: boolean;
    /** @deprecated Use ai_name instead */
    chat_bot_name: string; // ai_name in DB
    ai_name: string;
    ai_avatar: string;
    ai_greeting: string;
    chat_position: string;

    // Página Inicial - FAQ
    faq_title: string;
    faq_subtitle: string;
    faq_items: { question: string; answer: string }[];

    // Página Inicial - About Us
    about_title: string;
    about_image: string;
    about_intro_p1: string;
    about_intro_p2: string;
    about_note: string;
    about_quote: string;
    about_highlights: string[];
    about_divider_subtitle: string;
    about_bio_p1: string;
    about_bio_p2: string;
    about_bio_p3: string;
    about_founder_name: string;
    about_founder_role: string;

    // Página Inicial - Services
    services_title: string;
    services_subtitle: string;
    services_cta_text: string;

    // Página Inicial - How It Works
    how_it_works_title: string;
    how_it_works_subtitle: string;
    how_it_works_cta: string;

    // Página Inicial - What's Included
    whats_included_title: string;
    whats_included_subtitle: string;
    whats_included_standard: string[];
    whats_included_optional: string[];

    // Página Inicial - Testimonials
    testimonials_title: string;
    testimonials_subtitle: string;
    testimonials_items: { name: string; role: string; content: string; rating: number }[];

    // Página Inicial - CTA Section
    cta_title: string;
    cta_subtitle: string;
    cta_button_text: string;

    // Página Inicial - Contact Form
    contact_title: string;
    contact_subtitle: string;

    // Página Inicial - Pricing Section
    pricing_title: string;
    pricing_subtitle: string;
    pricing_format: 'range' | 'starting_at'; // 'range' = "$120 - $200" | 'starting_at' = "Starting at $120"
    pricing_cta_text: string;
    pricing_cta_subtext: string;

    // Página Inicial - SEO
    seo_title: string;
    seo_description: string;
    seo_keywords: string;
    seo_og_image: string;

    // Página Inicial - Announcement
    announcement_enabled: boolean;
    announcement_text: string;
    announcement_bg_color: string;

    // Sistema - Horários
    operating_start: string;
    operating_end: string;
    operating_days: string[];

    // Sistema - Agendamento
    booking_min_notice_hours: number;
    booking_max_advance_days: number;
    booking_default_duration: number;
    booking_buffer_minutes: number;

    // Sistema - Precificação Recorrente
    desconto_weekly: number;
    desconto_biweekly: number;
    desconto_monthly: number;

    // Sistema - Notificações
    notification_reminder_24h: boolean;
    notification_reminder_2h: boolean;
    notification_new_booking: boolean;
    notification_cancellation: boolean;
    notification_channel_sms: boolean;
    notification_channel_email: boolean;

    // Trackeamento - Meta
    tracking_meta_enabled: boolean;
    tracking_meta_pixel_id: string;
    tracking_meta_access_token: string;
    tracking_meta_capi_enabled: boolean;
    tracking_meta_test_event_code: string;

    // Trackeamento - Google Ads
    tracking_google_ads_enabled: boolean;
    tracking_google_ads_id: string;
    tracking_google_ads_label: string;

    // Trackeamento - GA4
    tracking_ga4_enabled: boolean;
    tracking_ga4_measurement_id: string;

    // Trackeamento - GTM
    tracking_gtm_enabled: boolean;
    tracking_gtm_id: string;

    // Trackeamento - TikTok
    tracking_tiktok_enabled: boolean;
    tracking_tiktok_pixel_id: string;

    // Trackeamento - UTMify
    tracking_utmify_enabled: boolean;
    tracking_utmify_pixel_id: string;

    // Scripts Customizados
    tracking_custom_head_scripts: string;
    tracking_custom_body_scripts: string;

    // Página Inicial - Before & After
    before_after_display_mode: 'slider' | 'hover';
    before_after_stat_count: number;
    before_after_stat_region: string;

    // Legacy/Others (keep for compatibility)
    [key: string]: any;
}

export const DEFAULT_SETTINGS: BusinessSettings = {
    business_name: 'Chesque Premium Cleaning',
    business_phone: '(803) 792-1351',
    business_phone_display: '(803) 792-1351',
    business_email: 'hello@chesquecleaning.com',
    business_address: '123 Ocean Drive, Miami, FL 33139',
    business_website: 'www.chesquecleaning.com',
    business_logo: '',
    business_description: 'Serving Fort Mill, SC, Charlotte, NC, and nearby cities with premium cleaning services.',
    social_facebook: '',
    social_instagram: '',
    social_twitter: '',
    social_google: '',

    hero_title: 'Premium Cleaning for Homes & Office',
    hero_title_1: 'Premium Cleaning for',
    hero_title_2: 'Homes & Office',
    hero_subtitle: 'Reliable residential and commercial cleaning services with carefully selected professionals, flexible scheduling, and consistent results.',
    hero_cta_text: 'Schedule a Visit',
    hero_image: '',

    badges_enabled: true,
    badges_rating: '4.9',
    badges_reviews_count: '150+',
    badges_years_experience: '5+',
    badges_google_reviews_url: '',

    before_after_display_mode: 'slider',
    before_after_stat_count: 500,
    before_after_stat_region: 'Tampa Bay',

    chat_enabled: true,
    chat_bot_name: 'Carol',
    ai_name: 'Carol',
    ai_avatar: '',
    ai_greeting: "Hi! I'm Carol from Chesque Premium Cleaning. How can I help you today?",
    chat_position: 'bottom-right',

    faq_title: 'Frequently Asked Questions',
    faq_subtitle: 'Common questions about our cleaning services.',
    faq_items: [
        {
            question: "Which areas do you serve?",
            answer: "We serve Fort Mill and Charlotte, and nearby cities in the surrounding region. Text us your ZIP code and we'll confirm availability.",
        },
        {
            question: "Do you clean both homes and offices?",
            answer: "Yes! We offer residential and office cleaning with flexible scheduling options for both.",
        },
        {
            question: "Are your cleaners background-checked?",
            answer: "Absolutely. Every team member passes a thorough background check through national databases before joining us.",
        },
        {
            question: "What's your cancellation policy?",
            answer: "You can reschedule or cancel with 48-hour notice, no fees, no hassle. We understand plans change.",
        },
        {
            question: "Do I need to sign a contract?",
            answer: "No long-term contracts, ever. You can pause or cancel your service anytime. We believe in earning your business every visit.",
        },
        {
            question: "What's included in a regular cleaning?",
            answer: "A standard clean covers key living areas, kitchen, bathrooms, dusting, and floors. We confirm your exact checklist by text before each appointment.",
        },
        {
            question: "What's the difference between deep cleaning and regular cleaning?",
            answer: "Deep cleaning focuses on buildup, detail work, edges, and extra scrubbing — ideal for first-time cleans or seasonal resets. Regular cleaning maintains that freshness.",
        },
        {
            question: "Do you bring supplies and equipment?",
            answer: "Supplies and equipment are provided by the client by default. However, we can provide professional-grade supplies if agreed in advance — just let us know!",
        },
        {
            question: "Do you clean homes with pets?",
            answer: "Of course! Just let us know what pets you have so we can plan accordingly. We love furry friends.",
        },
        {
            question: "Will I have the same cleaner every time?",
            answer: "We aim for consistency! Your preferences and home details are saved and shared with your regular cleaning team. Most clients see the same professionals each visit.",
        },
        {
            question: "Do I need to be home during the cleaning?",
            answer: "Not at all. Many clients provide entry instructions (lockbox, garage code, etc.). We'll coordinate everything by text.",
        },
        {
            question: "What if I'm not satisfied?",
            answer: "If anything does not meet your expectations, we will make it right at no extra cost.",
        }
    ],

    about_title: 'Built on Trust. Delivered with Care.',
    about_image: '/images/thayna.jpg',
    about_intro_p1: 'Every cleaning follows the highest quality standards with close attention to detail.',
    about_intro_p2: 'If anything does not meet your expectations, we will make it right at no extra cost.',
    about_note: 'We proudly serve Fort Mill, SC & Charlotte, NC with a local focus and personalized service. Once you become a client, we keep your preferences on file to ensure consistency at every visit.',
    about_quote: 'Our goal is simple: your home should feel fresh, clean, and taken care of, every single time.',
    about_highlights: [
        'Experienced professionals',
        'Proven cleaning process',
        'Commitment to excellence',
        'Freedom to pause or cancel anytime',
    ],
    about_divider_subtitle: 'The Person Behind the Service',
    about_bio_p1: "Thayna founded Chesque Premium Cleaning with one mission: to bring the same care and attention to your home that she gives to her own. Originally from Brazil, she built this business on trust, dedication, and a passion for making people's lives easier.",
    about_bio_p2: "With over 2 years of hands-on experience serving homes across New York and New Jersey, she personally ensures that every team member delivers the same high standard in every visit.",
    about_bio_p3: "As a mother and homeowner herself, Thayna understands how important it is to come home to a clean, welcoming space, and that's the experience she's committed to creating for every client, every time.",
    about_founder_name: 'Thayna Chesque',
    about_founder_role: 'Founder & Owner',

    // Services Section Defaults
    services_title: 'Cleaning Services',
    services_subtitle: 'From routine care to detailed deep cleaning, each service is customized to meet the specific needs of your space.',
    services_cta_text: 'Schedule Visit Now',

    // How It Works Defaults
    how_it_works_title: 'How Scheduling Works',
    how_it_works_subtitle: 'Keeping your space clean has never been easier.',
    how_it_works_cta: 'Request a Visit',

    // What's Included Defaults
    whats_included_title: "What's Included in Every Cleaning",
    whats_included_subtitle: 'We follow a consistent cleaning standard for every visit. Final details are always confirmed by message before the service.',
    whats_included_standard: [
        'Kitchen cleaning (sinks and external surfaces)',
        'Bathroom cleaning (sinks, toilets, mirrors, and surfaces)',
        'Cleaning of accessible surfaces',
        'Vacuuming of floors and carpets',
        'Floor cleaning (when applicable)',
        'Trash removal (upon request)',
    ],
    whats_included_optional: [
        'Interior oven or refrigerator cleaning',
        'Interior cleaning of empty cabinets',
        'Interior window cleaning',
        'Areas requiring extra attention',
        'Office cleaning outside business hours',
    ],

    // Testimonials Defaults
    testimonials_title: 'What Our Clients Say',
    testimonials_subtitle: '⭐ Average rating 4.9 based on 150+ reviews',
    testimonials_items: [
        {
            name: 'Client Feedback',
            role: 'Verified Review',
            content: "At first, I was hesitant to hire a cleaning service, but the experience was great. Three months in, and I'm still extremely satisfied.",
            rating: 5,
        },
        {
            name: 'Client Feedback',
            role: 'Verified Review',
            content: "Everything was handled by message, fast, simple, and very convenient.",
            rating: 5,
        },
        {
            name: 'Client Feedback',
            role: 'Verified Review',
            content: "I love the flexibility. I paused service during a trip and restarted without any issues. Excellent flexibility. No contracts and no hassle.",
            rating: 5,
        },
    ],

    // CTA Section Defaults
    cta_title: 'Ready for a Spotless Home or Office?',
    cta_subtitle: 'Serving Fort Mill, SC, Charlotte, NC, and nearby cities. Chat with Carol for a fast quote and easy scheduling.',
    cta_button_text: 'Request a Visit',

    // Contact Form Defaults
    contact_title: 'Prefer a Callback?',
    contact_subtitle: 'Leave your info and we\'ll reach out to you, no chat required.',

    // Pricing Section Defaults
    pricing_title: 'Transparent Pricing',
    pricing_subtitle: 'Honest pricing with no hidden fees. Final quote depends on home size and specific needs.',
    pricing_format: 'starting_at' as const,
    pricing_cta_text: 'Schedule Visit Now',
    pricing_cta_subtext: 'Want an exact quote? Chat with Carol, most quotes ready in under 5 minutes.',

    seo_title: 'Chesque Premium Cleaning | Professional House Cleaning',
    seo_description: 'Professional house cleaning services. Book your free estimate 24/7.',
    seo_keywords: 'house cleaning, cleaning service, professional cleaning',
    seo_og_image: '',

    announcement_enabled: true,
    announcement_text: 'Personalized service available 24/7',
    announcement_bg_color: '#C48B7F',

    operating_start: '08:00',
    operating_end: '18:00',
    operating_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],

    booking_min_notice_hours: 24,
    booking_max_advance_days: 60,
    booking_default_duration: 180,
    booking_buffer_minutes: 60,

    desconto_weekly: 20,
    desconto_biweekly: 15,
    desconto_monthly: 10,

    notification_reminder_24h: true,
    notification_reminder_2h: true,
    notification_new_booking: true,
    notification_cancellation: true,
    notification_channel_sms: true,
    notification_channel_email: true,

    // Tracking Defaults
    tracking_meta_enabled: false,
    tracking_meta_pixel_id: '',
    tracking_meta_access_token: '',
    tracking_meta_capi_enabled: false,
    tracking_meta_test_event_code: '',
    tracking_google_ads_enabled: false,
    tracking_google_ads_id: '',
    tracking_google_ads_label: '',
    tracking_ga4_enabled: false,
    tracking_ga4_measurement_id: '',
    tracking_gtm_enabled: false,
    tracking_gtm_id: '',
    tracking_tiktok_enabled: false,
    tracking_tiktok_pixel_id: '',
    tracking_utmify_enabled: false,
    tracking_utmify_pixel_id: '',
    tracking_custom_head_scripts: '',
    tracking_custom_body_scripts: '',
};

// Mapping between Frontend Keys and Database Keys
const KEY_MAP: Record<string, string> = {
    business_name: 'empresa_nome',
    business_phone: 'empresa_telefone',
    business_email: 'empresa_email',
    operating_start: 'horario_inicio',
    operating_end: 'horario_fim',
    chat_bot_name: 'ai_name',
    ai_name: 'ai_name',
    booking_buffer_minutes: 'buffer_deslocamento',
};

// Mapping of keys to their respective groups/categories
const CONFIG_METADATA: Record<string, { grupo: string; categoria: string }> = {
    // Empresa
    business_name: { grupo: 'empresa', categoria: 'geral' },
    business_phone: { grupo: 'empresa', categoria: 'geral' },
    business_phone_display: { grupo: 'empresa', categoria: 'geral' },
    business_email: { grupo: 'empresa', categoria: 'geral' },
    business_address: { grupo: 'empresa', categoria: 'geral' },
    business_website: { grupo: 'empresa', categoria: 'geral' },
    business_logo: { grupo: 'empresa', categoria: 'geral' },
    business_description: { grupo: 'empresa', categoria: 'geral' },
    social_facebook: { grupo: 'empresa', categoria: 'geral' },
    social_instagram: { grupo: 'empresa', categoria: 'geral' },
    social_twitter: { grupo: 'empresa', categoria: 'geral' },
    social_google: { grupo: 'empresa', categoria: 'geral' },

    // Página Inicial
    hero_title: { grupo: 'pagina_inicial', categoria: 'geral' },
    hero_title_1: { grupo: 'pagina_inicial', categoria: 'geral' },
    hero_title_2: { grupo: 'pagina_inicial', categoria: 'geral' },
    hero_subtitle: { grupo: 'pagina_inicial', categoria: 'geral' },
    hero_cta_text: { grupo: 'pagina_inicial', categoria: 'geral' },
    hero_cta_secondary: { grupo: 'pagina_inicial', categoria: 'geral' },
    hero_image: { grupo: 'pagina_inicial', categoria: 'geral' },
    badges_enabled: { grupo: 'pagina_inicial', categoria: 'geral' },
    badges_rating: { grupo: 'pagina_inicial', categoria: 'geral' },
    badges_reviews_count: { grupo: 'pagina_inicial', categoria: 'geral' },
    badges_years_experience: { grupo: 'pagina_inicial', categoria: 'geral' },
    badges_google_reviews_url: { grupo: 'pagina_inicial', categoria: 'geral' },
    before_after_display_mode: { grupo: 'pagina_inicial', categoria: 'pagina_inicial' },
    before_after_stat_count:   { grupo: 'pagina_inicial', categoria: 'pagina_inicial' },
    before_after_stat_region:  { grupo: 'pagina_inicial', categoria: 'pagina_inicial' },
    ai_name: { grupo: 'pagina_inicial', categoria: 'geral' },
    ai_avatar: { grupo: 'pagina_inicial', categoria: 'geral' },
    ai_greeting: { grupo: 'pagina_inicial', categoria: 'geral' },
    chat_enabled: { grupo: 'pagina_inicial', categoria: 'geral' },
    chat_position: { grupo: 'pagina_inicial', categoria: 'geral' },
    seo_title: { grupo: 'pagina_inicial', categoria: 'geral' },
    seo_description: { grupo: 'pagina_inicial', categoria: 'geral' },
    seo_keywords: { grupo: 'pagina_inicial', categoria: 'geral' },
    seo_og_image: { grupo: 'pagina_inicial', categoria: 'geral' },
    announcement_enabled: { grupo: 'pagina_inicial', categoria: 'geral' },
    announcement_text: { grupo: 'pagina_inicial', categoria: 'geral' },
    announcement_bg_color: { grupo: 'pagina_inicial', categoria: 'geral' },
    
    // Services
    services_title: { grupo: 'pagina_inicial', categoria: 'geral' },
    services_subtitle: { grupo: 'pagina_inicial', categoria: 'geral' },
    services_cta_text: { grupo: 'pagina_inicial', categoria: 'geral' },
    
    // Pricing
    pricing_title: { grupo: 'pagina_inicial', categoria: 'geral' },
    pricing_subtitle: { grupo: 'pagina_inicial', categoria: 'geral' },
    pricing_format: { grupo: 'pagina_inicial', categoria: 'geral' },
    pricing_cta_text: { grupo: 'pagina_inicial', categoria: 'geral' },
    pricing_cta_subtext: { grupo: 'pagina_inicial', categoria: 'geral' },

    // FAQ
    faq_title: { grupo: 'pagina_inicial', categoria: 'geral' },
    faq_subtitle: { grupo: 'pagina_inicial', categoria: 'geral' },
    faq_items: { grupo: 'pagina_inicial', categoria: 'geral' },

    // How It Works
    how_it_works_title: { grupo: 'pagina_inicial', categoria: 'geral' },
    how_it_works_subtitle: { grupo: 'pagina_inicial', categoria: 'geral' },
    how_it_works_cta: { grupo: 'pagina_inicial', categoria: 'geral' },

    // What's Included
    whats_included_title: { grupo: 'pagina_inicial', categoria: 'geral' },
    whats_included_subtitle: { grupo: 'pagina_inicial', categoria: 'geral' },
    whats_included_standard: { grupo: 'pagina_inicial', categoria: 'geral' },
    whats_included_optional: { grupo: 'pagina_inicial', categoria: 'geral' },

    // Testimonials
    testimonials_title: { grupo: 'pagina_inicial', categoria: 'geral' },
    testimonials_subtitle: { grupo: 'pagina_inicial', categoria: 'geral' },
    testimonials_items: { grupo: 'pagina_inicial', categoria: 'geral' },

    // CTA Section
    cta_title: { grupo: 'pagina_inicial', categoria: 'geral' },
    cta_subtitle: { grupo: 'pagina_inicial', categoria: 'geral' },
    cta_button_text: { grupo: 'pagina_inicial', categoria: 'geral' },

    // Contact Form
    contact_title: { grupo: 'pagina_inicial', categoria: 'geral' },
    contact_subtitle: { grupo: 'pagina_inicial', categoria: 'geral' },
    
    // About Us (part of landing but related to founder/company)
    about_title: { grupo: 'pagina_inicial', categoria: 'geral' },
    about_image: { grupo: 'pagina_inicial', categoria: 'geral' },
    about_intro_p1: { grupo: 'pagina_inicial', categoria: 'geral' },
    about_intro_p2: { grupo: 'pagina_inicial', categoria: 'geral' },
    about_note: { grupo: 'pagina_inicial', categoria: 'geral' },
    about_quote: { grupo: 'pagina_inicial', categoria: 'geral' },
    about_highlights: { grupo: 'pagina_inicial', categoria: 'geral' },
    about_divider_subtitle: { grupo: 'pagina_inicial', categoria: 'geral' },
    about_bio_p1: { grupo: 'pagina_inicial', categoria: 'geral' },
    about_bio_p2: { grupo: 'pagina_inicial', categoria: 'geral' },
    about_bio_p3: { grupo: 'pagina_inicial', categoria: 'geral' },
    about_founder_name: { grupo: 'pagina_inicial', categoria: 'geral' },
    about_founder_role: { grupo: 'pagina_inicial', categoria: 'geral' },

    // Sistema
    operating_start: { grupo: 'sistema', categoria: 'horarios' },
    operating_end: { grupo: 'sistema', categoria: 'horarios' },
    operating_days: { grupo: 'sistema', categoria: 'horarios' },
    booking_min_notice_hours: { grupo: 'sistema', categoria: 'geral' },
    booking_max_advance_days: { grupo: 'sistema', categoria: 'geral' },
    booking_default_duration: { grupo: 'sistema', categoria: 'geral' },
    booking_buffer_minutes: { grupo: 'sistema', categoria: 'geral' },
    notification_reminder_24h: { grupo: 'sistema', categoria: 'notificacoes' },
    notification_reminder_2h: { grupo: 'sistema', categoria: 'notificacoes' },
    notification_new_booking: { grupo: 'sistema', categoria: 'notificacoes' },
    notification_cancellation: { grupo: 'sistema', categoria: 'notificacoes' },
    notification_channel_sms: { grupo: 'sistema', categoria: 'notificacoes' },
    notification_channel_email: { grupo: 'sistema', categoria: 'notificacoes' },

    // Descontos
    desconto_weekly: { grupo: 'sistema', categoria: 'precos' },
    desconto_biweekly: { grupo: 'sistema', categoria: 'precos' },
    desconto_monthly: { grupo: 'sistema', categoria: 'precos' },

    // Tracking
    tracking_meta_enabled: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_meta_pixel_id: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_meta_access_token: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_meta_capi_enabled: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_meta_test_event_code: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_google_ads_enabled: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_google_ads_id: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_google_ads_label: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_ga4_enabled: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_ga4_measurement_id: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_gtm_enabled: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_gtm_id: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_tiktok_enabled: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_tiktok_pixel_id: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_utmify_enabled: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_utmify_pixel_id: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_custom_head_scripts: { grupo: 'trackeamento', categoria: 'integracao' },
    tracking_custom_body_scripts: { grupo: 'trackeamento', categoria: 'integracao' },
};

const REVERSE_KEY_MAP: Record<string, string> = Object.entries(KEY_MAP).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});

function parseValue(value: any): any {
    if (typeof value === 'string') {
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1);
        }
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (!isNaN(Number(value)) && value.trim() !== '') return Number(value);
    }
    return value;
}

export function mapDbToSettings(rows: any[]): BusinessSettings {
    const settings: any = { ...DEFAULT_SETTINGS };

    rows.forEach(row => {
        const key = REVERSE_KEY_MAP[row.chave] || row.chave;
        const parsedValue = parseValue(row.valor);
        settings[key] = parsedValue;

        // Ensure compatibility between ai_name and chat_bot_name
        if (row.chave === 'ai_name') {
            settings.ai_name = parsedValue;
            settings.chat_bot_name = parsedValue;
        }
    });

    return settings as BusinessSettings;
}

export async function getBusinessSettingsClient(): Promise<BusinessSettings> {
    try {
        const supabase = createClient();
        const { data } = await supabase
            .from('configuracoes')
            .select('chave, valor');

        if (!data) return DEFAULT_SETTINGS;
        return mapDbToSettings(data);
    } catch (error) {
        console.error('Error fetching settings on client:', error);
        return DEFAULT_SETTINGS;
    }
}

export async function getBusinessSettingsByGrupo(grupo: string): Promise<Partial<BusinessSettings>> {
    try {
        const supabase = createClient();
        const { data } = await supabase
            .from('configuracoes')
            .select('chave, valor')
            .eq('grupo', grupo);

        if (!data) return {};

        const settings: any = {};
        data.forEach(row => {
            const key = REVERSE_KEY_MAP[row.chave] || row.chave;
            settings[key] = parseValue(row.valor);
        });
        return settings;
    } catch (error) {
        console.error(`Error fetching settings for group ${grupo}:`, error);
        return {};
    }
}

export async function saveBusinessSettings(settings: Partial<BusinessSettings>, grupoInput?: string) {
    const supabase = createClient();

    // Use a Map to ensure unique keys (last value wins)
    const configMap = new Map<string, any>();

    Object.entries(settings).forEach(([key, value]) => {
        // Only save if the key is defined in DEFAULT_SETTINGS to avoid saving junk
        if (!(key in DEFAULT_SETTINGS)) return;

        const meta = CONFIG_METADATA[key];
        const dbKey = KEY_MAP[key] || key;
        
        // IMPORTANT: If a key is not in metadata, we skip it if a specific group is requested
        // to avoid hijacking the key into the current group.
        if (!meta && grupoInput) {
            return;
        }

        // If a specific group was requested, only save keys that belong to that group
        if (grupoInput && meta && meta.grupo !== grupoInput) {
            return;
        }

        const targetGrupo = grupoInput || (meta ? meta.grupo : 'geral');
        const targetCategoria = meta ? meta.categoria : (grupoInput || 'geral');

        configMap.set(dbKey, {
            chave: dbKey,
            valor: value, // Supabase JSONB handles it
            categoria: targetCategoria,
            grupo: targetGrupo
        });
    });

    const rows = Array.from(configMap.values());
    if (rows.length === 0) return;

    const { error } = await supabase
        .from('configuracoes')
        .upsert(rows, { onConflict: 'chave' });

    if (error) throw error;
}

