// lib/tracking/utils.ts

import { TrackingConfig } from './types';
import crypto from 'crypto';

/**
 * Gera um event_id único para deduplicação
 */
export function generateEventId(): string {
    return `evt_${crypto.randomUUID()}`;
}

/**
 * Hash SHA256 para dados sensíveis (email, telefone)
 */
export function hashData(data: string): string {
    if (!data) return '';
    const normalized = data.toLowerCase().trim();
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Normaliza telefone para formato E.164
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  // Already has US country code (1 + 10 digits)
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits;
  }

  // Standard US number (10 digits: area code + number)
  if (digits.length === 10) {
    return `1${digits}`;
  }

  // International format or already complete
  if (digits.length > 11) {
    return digits;
  }

  // Fallback: return as-is (too short or ambiguous)
  return digits;
}

/**
 * Extrai cookies do Facebook (fbc, fbp)
 */
export function getFacebookCookies(): { fbc: string | null; fbp: string | null } {
    if (typeof document === 'undefined') {
        return { fbc: null, fbp: null };
    }

    const getCookie = (name: string): string | null => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop()?.split(';').shift() || null;
        }
        return null;
    };

    return {
        fbc: getCookie('_fbc'),
        fbp: getCookie('_fbp'),
    };
}

/**
 * Obtém parâmetros UTM da URL
 */
export function getUtmParams(): Record<string, string> {
    if (typeof window === 'undefined') return {};

    const params = new URLSearchParams(window.location.search);
    const utmParams: Record<string, string> = {};

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ttclid'].forEach(param => {
        const value = params.get(param);
        if (value) {
            utmParams[param] = value;
        }
    });

    return utmParams;
}

/**
 * Mapeia configurações do Supabase para TrackingConfig
 */
export function mapSupabaseConfigToTracking(configs: Array<{ chave: string; valor: unknown }>): TrackingConfig {
    const getValue = (key: string): string => {
        const config = configs.find(c => c.chave === key);
        if (!config || config.valor == null) return '';
        const raw = config.valor;
        if (typeof raw === 'string') return raw.replace(/^"|"$/g, '');
        if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
        return '';
    };

    const getBool = (key: string): boolean => {
        const config = configs.find(c => c.chave === key);
        if (!config) return false;
        const raw = config.valor;
        if (typeof raw === 'boolean') return raw;
        if (typeof raw === 'number') return raw === 1;
        if (typeof raw === 'string') {
            const v = raw.replace(/^"|"$/g, '').toLowerCase();
            return v === 'true' || v === '1';
        }
        return false;
    };

    return {
        meta_enabled: getBool('tracking_meta_enabled'),
        meta_pixel_id: getValue('tracking_meta_pixel_id'),
        meta_access_token: getValue('tracking_meta_access_token'),
        meta_capi_enabled: getBool('tracking_meta_capi_enabled'),
        meta_test_event_code: getValue('tracking_meta_test_event_code'),

        google_ads_enabled: getBool('tracking_google_ads_enabled'),
        google_ads_id: getValue('tracking_google_ads_id'),
        google_ads_label: getValue('tracking_google_ads_label'),

        ga4_enabled: getBool('tracking_ga4_enabled'),
        ga4_measurement_id: getValue('tracking_ga4_measurement_id'),

        gtm_enabled: getBool('tracking_gtm_enabled'),
        gtm_id: getValue('tracking_gtm_id'),

        tiktok_enabled: getBool('tracking_tiktok_enabled'),
        tiktok_pixel_id: getValue('tracking_tiktok_pixel_id'),

        utmify_enabled: getBool('tracking_utmify_enabled'),
        utmify_pixel_id: getValue('tracking_utmify_pixel_id'),

        custom_head_scripts: getValue('tracking_custom_head_scripts'),
        custom_body_scripts: getValue('tracking_custom_body_scripts'),
    };
}
