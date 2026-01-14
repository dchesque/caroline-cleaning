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
    hero_subtitle: string;
    hero_cta_text: string;
    hero_cta_secondary: string;
    hero_image: string;

    // Página Inicial - Badges
    badges_enabled: boolean;
    badges_rating: string;
    badges_reviews_count: string;
    badges_years_experience: string;
    badges_google_reviews_url: string;

    // Página Inicial - Chat/IA
    chat_enabled: boolean;
    chat_bot_name: string; // ai_name in DB
    ai_name: string;
    ai_avatar: string;
    ai_greeting: string;
    ai_tone: string;
    chat_position: string;

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

    // Sistema - Notificações
    notification_reminder_24h: boolean;
    notification_reminder_2h: boolean;
    notification_new_booking: boolean;
    notification_cancellation: boolean;
    notification_channel_sms: boolean;
    notification_channel_email: boolean;

    // Legacy/Others (keep for compatibility)
    [key: string]: any;
}

export const DEFAULT_SETTINGS: BusinessSettings = {
    business_name: 'Caroline Premium Cleaning',
    business_phone: '(551) 389-7394',
    business_phone_display: '(551) 389-7394',
    business_email: 'hello@carolinecleaning.com',
    business_address: '123 Ocean Drive, Miami, FL 33139',
    business_website: 'www.carolinecleaning.com',
    business_logo: '',
    business_description: 'Serving Charlotte, NC and nearby cities with premium cleaning services.',
    social_facebook: '',
    social_instagram: '',
    social_twitter: '',
    social_google: '',

    hero_title: 'Professional Cleaning, Instantly Scheduled',
    hero_subtitle: 'Book your free estimate 24/7 through our chat assistant. No contracts, background-checked staff, satisfaction guaranteed.',
    hero_cta_text: 'Schedule Visit Now',
    hero_cta_secondary: 'Talk to Carol',
    hero_image: '',

    badges_enabled: true,
    badges_rating: '4.9',
    badges_reviews_count: '200+',
    badges_years_experience: '5+',
    badges_google_reviews_url: '',

    chat_enabled: true,
    chat_bot_name: 'Carol',
    ai_name: 'Carol',
    ai_avatar: '',
    ai_greeting: "Hi! I'm Carol from Caroline Premium Cleaning. How can I help you today?",
    ai_tone: 'friendly',
    chat_position: 'bottom-right',

    seo_title: 'Caroline Premium Cleaning | Professional House Cleaning',
    seo_description: 'Professional house cleaning services. Book your free estimate 24/7.',
    seo_keywords: 'house cleaning, cleaning service, professional cleaning',
    seo_og_image: '',

    announcement_enabled: true,
    announcement_text: 'Serving Charlotte, NC & nearby cities. • Chat with Carol 24/7',
    announcement_bg_color: '#C48B7F',

    operating_start: '08:00',
    operating_end: '18:00',
    operating_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],

    booking_min_notice_hours: 24,
    booking_max_advance_days: 60,
    booking_default_duration: 180,
    booking_buffer_minutes: 30,

    notification_reminder_24h: true,
    notification_reminder_2h: true,
    notification_new_booking: true,
    notification_cancellation: true,
    notification_channel_sms: true,
    notification_channel_email: true,
};

// Mapping between Frontend Keys and Database Keys
const KEY_MAP: Record<string, string> = {
    business_name: 'empresa_nome',
    business_phone: 'empresa_telefone',
    business_email: 'empresa_email',
    operating_start: 'horario_inicio',
    operating_end: 'horario_fim',
    chat_bot_name: 'ai_name', // Syncing with migration
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
        settings[key] = parseValue(row.valor);
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

export async function saveBusinessSettings(settings: Partial<BusinessSettings>, grupo?: string) {
    const supabase = createClient();

    const rows = Object.entries(settings).map(([key, value]) => {
        const dbKey = KEY_MAP[key] || key;
        const row: any = {
            chave: dbKey,
            valor: value, // Supabase JSONB handles it
            categoria: grupo || 'geral'
        };
        if (grupo) row.grupo = grupo;
        return row;
    });

    const { error } = await supabase
        .from('configuracoes')
        .upsert(rows, { onConflict: 'chave' });

    if (error) throw error;
}

