// lib/tracking/types.ts

export interface TrackingConfig {
    // Meta Ads
    meta_enabled: boolean;
    meta_pixel_id: string;
    meta_access_token: string;
    meta_capi_enabled: boolean;
    meta_test_event_code: string;

    // Google Ads
    google_ads_enabled: boolean;
    google_ads_id: string;
    google_ads_label: string;

    // Google Analytics 4
    ga4_enabled: boolean;
    ga4_measurement_id: string;

    // Google Tag Manager
    gtm_enabled: boolean;
    gtm_id: string;

    // TikTok
    tiktok_enabled: boolean;
    tiktok_pixel_id: string;

    // UTMify
    utmify_enabled: boolean;
    utmify_pixel_id: string;

    // Custom Scripts
    custom_head_scripts: string;
    custom_body_scripts: string;
}

export interface TrackingEventData {
    event_name: TrackingEventName;
    event_id?: string;
    user_data?: UserData;
    custom_data?: CustomData;
}

export interface UserData {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    external_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;  // Facebook Click ID (from _fbc cookie)
    fbp?: string;  // Facebook Browser ID (from _fbp cookie)
}

export interface CustomData {
    value?: number;
    currency?: string;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    num_items?: number;
    order_id?: string;
    predicted_ltv?: number;
    status?: string;
}

export type TrackingEventName =
    | 'PageView'
    | 'InitiateChat'
    | 'Lead'
    | 'CompleteRegistration'
    | 'Schedule'
    | 'Contact'
    | 'ClickToCall'
    | 'ClickToWhatsApp'
    | 'ViewContent'
    | 'Search';

export interface TrackingContextValue {
    config: TrackingConfig | null;
    isLoaded: boolean;
    trackEvent: (eventName: TrackingEventName, data?: Partial<CustomData>, userData?: Partial<UserData>) => void;
}

// Mapeamento de eventos por plataforma
export const EVENT_MAPPING = {
    meta: {
        PageView: 'PageView',
        InitiateChat: 'InitiateCheckout',
        Lead: 'Lead',
        CompleteRegistration: 'CompleteRegistration',
        Schedule: 'Schedule',
        Contact: 'Contact',
        ClickToCall: 'Contact',
        ClickToWhatsApp: 'Contact',
        ViewContent: 'ViewContent',
        Search: 'Search',
    },
    google: {
        PageView: 'page_view',
        InitiateChat: 'begin_checkout',
        Lead: 'generate_lead',
        CompleteRegistration: 'sign_up',
        Schedule: 'purchase',
        Contact: 'contact',
        ClickToCall: 'click',
        ClickToWhatsApp: 'click',
        ViewContent: 'view_item',
        Search: 'search',
    },
    tiktok: {
        PageView: 'PageView',
        InitiateChat: 'InitiateCheckout',
        Lead: 'SubmitForm',
        CompleteRegistration: 'CompleteRegistration',
        Schedule: 'PlaceAnOrder',
        Contact: 'Contact',
        ClickToCall: 'ClickButton',
        ClickToWhatsApp: 'ClickButton',
        ViewContent: 'ViewContent',
        Search: 'Search',
    },
} as const;
