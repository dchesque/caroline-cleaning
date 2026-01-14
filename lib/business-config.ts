import { createClient } from '@/lib/supabase/client'
// Server client import removed to prevent build error in client components

export interface BusinessSettings {
    business_name: string;
    business_phone: string;
    business_phone_display: string;
    business_email: string;
    business_address: string;
    business_website: string;
    business_logo: string;
    business_description: string;
    chat_bot_name: string;
    hero_title_1: string;
    hero_title_2: string;
    hero_subtitle: string;
    hero_cta_text: string;
    announcement_text: string;
    social_facebook: string;
    social_instagram: string;
    social_twitter: string;
    social_google: string;
    operating_start: string;
    operating_end: string;
    operating_days: string[];
    notify_new_booking: boolean;
    notify_cancellation: boolean;
    notify_reminder: boolean;
    reminder_hours: number;
    min_booking_notice: number;
    max_booking_advance: number;
    default_duration: number;
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
    business_description: 'Serving Charlotte, NC, Fort Mill, SC, and nearby cities with premium cleaning services tailored to your lifestyle.',
    chat_bot_name: 'Carol',
    hero_title_1: 'Premium Cleaning for Homes &',
    hero_title_2: 'Offices in Charlotte & Fort Mill',
    hero_subtitle: 'Reliable residential and commercial cleaning services with carefully selected professionals, flexible scheduling, and consistent results.',
    hero_cta_text: 'Schedule a Visit',
    announcement_text: 'Serving Charlotte, NC & Fort Mill, SC — plus nearby cities. • Chat with Carol 24/7',
    social_facebook: '',
    social_instagram: '',
    social_twitter: '',
    social_google: '',
    operating_start: '08:00',
    operating_end: '18:00',
    operating_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    notify_new_booking: true,
    notify_cancellation: true,
    notify_reminder: true,
    reminder_hours: 24,
    min_booking_notice: 24,
    max_booking_advance: 30,
    default_duration: 180,
};

// Mapping between Frontend Keys and Database Keys (chave)
// Keys not in this map will be stored as-is
const KEY_MAP: Record<string, string> = {
    business_name: 'empresa_nome',
    business_phone: 'empresa_telefone',
    business_email: 'empresa_email',
    operating_start: 'horario_inicio',
    operating_end: 'horario_fim',
};

const REVERSE_KEY_MAP: Record<string, string> = Object.entries(KEY_MAP).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});

function parseValue(value: any): any {
    if (typeof value === 'string') {
        // Remove quotes if they exist (legacy artifact from schema seeds)
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1);
        }
        return value;
    }
    return value;
}

function formatValue(value: any): any {
    // Retain type, Supabase handles JSONB
    return value;
}

export function mapDbToSettings(rows: any[]): BusinessSettings {
    const settings: any = { ...DEFAULT_SETTINGS };

    rows.forEach(row => {
        const key = REVERSE_KEY_MAP[row.chave] || row.chave;
        if (key in DEFAULT_SETTINGS) {
            settings[key] = parseValue(row.valor);
        }
    });

    return settings as BusinessSettings;
}

// getBusinessSettingsServer removed - use lib/business-config-server.ts instead

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

export async function saveBusinessSettings(settings: BusinessSettings) {
    const supabase = createClient();

    // Prepare rows for upsert
    const rows = Object.entries(settings).map(([key, value]) => {
        const dbKey = KEY_MAP[key] || key;
        return {
            chave: dbKey,
            valor: formatValue(value),
            categoria: 'geral' // Default category, could be refined
        };
    });

    const { error } = await supabase
        .from('configuracoes')
        .upsert(rows, { onConflict: 'chave' });

    if (error) throw error;
}
