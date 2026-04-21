'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import {
    TrackingConfig,
    TrackingContextValue,
    TrackingEventName,
    CustomData,
    UserData,
    EVENT_MAPPING
} from '@/lib/tracking/types';
import {
    mapSupabaseConfigToTracking,
    generateEventId,
    getFacebookCookies,
    getUtmParams
} from '@/lib/tracking/utils';

// Declarações globais para TypeScript
declare global {
    interface Window {
        fbq: any;
        _fbq: any;
        gtag: any;
        dataLayer: any[];
        ttq: any;
    }
}

const TrackingContext = createContext<TrackingContextValue>({
    config: null,
    isLoaded: false,
    trackEvent: () => { },
});

export const useTracking = () => useContext(TrackingContext);

/**
 * Injects raw user-pasted HTML (scripts + noscript/iframes) into the DOM.
 * Using innerHTML does NOT execute <script> tags, so we clone each script
 * element so the browser runs it.
 */
function RawHtmlInjector({ html, target, id }: { html: string; target: 'head' | 'body'; id: string }) {
    useEffect(() => {
        if (!html) return;
        const container = document.createElement('div');
        container.setAttribute('data-tracking-injected', id);
        container.innerHTML = html;

        const host = target === 'head' ? document.head : document.body;
        const mounted: Node[] = [];

        Array.from(container.childNodes).forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'SCRIPT') {
                const original = node as HTMLScriptElement;
                const script = document.createElement('script');
                Array.from(original.attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
                if (original.textContent) script.textContent = original.textContent;
                host.appendChild(script);
                mounted.push(script);
            } else {
                const clone = node.cloneNode(true);
                host.appendChild(clone);
                mounted.push(clone);
            }
        });

        return () => {
            mounted.forEach((n) => {
                if (n.parentNode) n.parentNode.removeChild(n);
            });
        };
    }, [html, target, id]);

    return null;
}

interface TrackingProviderProps {
    children: ReactNode;
    /**
     * Optional server-side hydrated config. When present, pixel scripts
     * mount on first render (before hydration fetch), so Meta Pixel Helper
     * and other extensions detect events immediately on initial paint.
     */
    initialConfig?: TrackingConfig | null;
}

export function TrackingProvider({ children, initialConfig }: TrackingProviderProps) {
    const [config, setConfig] = useState<TrackingConfig | null>(initialConfig ?? null);
    const [isLoaded, setIsLoaded] = useState<boolean>(!!initialConfig);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    // Each platform's base snippet fires the initial PageView on its own.
    // We skip the first effect-driven PageView to avoid duplicates and only
    // emit PageView via trackEvent on subsequent SPA route changes.
    const initialPageViewSkipped = useRef(false);

    // Carregar configurações apenas se não veio do SSR
    useEffect(() => {
        if (initialConfig) return;
        async function loadConfig() {
            try {
                const response = await fetch('/api/tracking/config');
                const result = await response.json();

                if (result.success && result.data) {
                    const trackingConfig = mapSupabaseConfigToTracking(result.data);
                    setConfig(trackingConfig);
                }
            } catch (error) {
                console.error('Failed to load tracking config:', error);
            } finally {
                setIsLoaded(true);
            }
        }

        loadConfig();
    }, [initialConfig]);

    // Função principal de tracking
    const trackEvent = useCallback((
        eventName: TrackingEventName,
        customData?: Partial<CustomData>,
        userData?: Partial<UserData>
    ) => {
        if (!config) return;

        const eventId = generateEventId();
        const { fbc, fbp } = getFacebookCookies();
        const utmParams = getUtmParams();

        // Preparar dados do evento
        const eventData = {
            ...customData,
            currency: customData?.currency || 'USD',
        };

        // Preparar dados do usuário
        const userDataWithCookies: Partial<UserData> = {
            ...userData,
            fbc: fbc || undefined,
            fbp: fbp || undefined,
        };

        // ========== CLIENT-SIDE TRACKING ==========

        // Meta Pixel
        if (config.meta_enabled && config.meta_pixel_id && typeof window !== 'undefined' && window.fbq) {
            const metaEvent = EVENT_MAPPING.meta[eventName] || eventName;
            window.fbq('track', metaEvent, eventData, { eventID: eventId });
        }

        // Google Analytics 4
        if (config.ga4_enabled && config.ga4_measurement_id && typeof window !== 'undefined' && window.gtag) {
            const googleEvent = EVENT_MAPPING.google[eventName] || eventName;
            window.gtag('event', googleEvent, {
                ...eventData,
                event_id: eventId,
            });
        }

        // Google Ads Conversion
        if (config.google_ads_enabled && config.google_ads_id && typeof window !== 'undefined' && window.gtag) {
            if (eventName === 'Lead' || eventName === 'Schedule') {
                window.gtag('event', 'conversion', {
                    send_to: `${config.google_ads_id}/${config.google_ads_label}`,
                    value: eventData.value || 0,
                    currency: eventData.currency,
                    event_id: eventId,
                });
            }
        }

        // GTM DataLayer
        if (config.gtm_enabled && config.gtm_id && typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: eventName,
                eventId: eventId,
                ...eventData,
                ...utmParams,
            });
        }

        // TikTok Pixel
        if (config.tiktok_enabled && config.tiktok_pixel_id && typeof window !== 'undefined' && window.ttq) {
            const tiktokEvent = EVENT_MAPPING.tiktok[eventName] || eventName;
            window.ttq.track(tiktokEvent, {
                ...eventData,
                event_id: eventId,
            });
        }

        // ========== SERVER-SIDE TRACKING ==========

        // Enviar para API de eventos (Meta CAPI + logging)
        if (config.meta_capi_enabled || true) { // Sempre loga no servidor
            fetch('/api/tracking/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_name: eventName,
                    event_id: eventId,
                    event_source_url: window.location.href,
                    user_data: userDataWithCookies,
                    custom_data: eventData,
                }),
            }).catch(err => console.error('Server tracking error:', err));
        }

    }, [config]);

    // Disparar PageView em mudanças de rota (SPA). Pula a primeira invocação
    // porque a snippet inline de cada pixel já disparou o PageView inicial.
    useEffect(() => {
        if (!isLoaded || !config) return;
        if (!initialPageViewSkipped.current) {
            initialPageViewSkipped.current = true;
            return;
        }
        const timer = setTimeout(() => {
            trackEvent('PageView', { content_name: document.title });
        }, 100);
        return () => clearTimeout(timer);
    }, [pathname, searchParams, isLoaded, config, trackEvent]);

    return (
        <TrackingContext.Provider value={{ config, isLoaded, trackEvent }}>
            {/* Scripts de Tracking */}
            {isLoaded && config && (
                <>
                    {/* Meta Pixel — official snippet: init + track PageView */}
                    {config.meta_enabled && config.meta_pixel_id && (
                        <Script
                            id="meta-pixel"
                            strategy="afterInteractive"
                            dangerouslySetInnerHTML={{
                                __html: `
                                    !function(f,b,e,v,n,t,s)
                                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                                    n.queue=[];t=b.createElement(e);t.async=!0;
                                    t.src=v;s=b.getElementsByTagName(e)[0];
                                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                                    'https://connect.facebook.net/en_US/fbevents.js');
                                    fbq('init', '${config.meta_pixel_id}');
                                    fbq('track', 'PageView');
                                `,
                            }}
                        />
                    )}
                    {/* Meta Pixel noscript fallback */}
                    {config.meta_enabled && config.meta_pixel_id && (
                        <noscript>
                            <img
                                height={1}
                                width={1}
                                style={{ display: 'none' }}
                                alt=""
                                src={`https://www.facebook.com/tr?id=${config.meta_pixel_id}&ev=PageView&noscript=1`}
                            />
                        </noscript>
                    )}

                    {/* Google Tag (GA4 + Ads) */}
                    {(config.ga4_enabled || config.google_ads_enabled) && (
                        <>
                            <Script
                                id="gtag-base"
                                strategy="afterInteractive"
                                src={`https://www.googletagmanager.com/gtag/js?id=${config.ga4_measurement_id || config.google_ads_id}`}
                            />
                            <Script
                                id="gtag-config"
                                strategy="afterInteractive"
                                dangerouslySetInnerHTML={{
                                    __html: `
                                        window.dataLayer = window.dataLayer || [];
                                        function gtag(){dataLayer.push(arguments);}
                                        gtag('js', new Date());
                                        ${config.ga4_enabled && config.ga4_measurement_id ? `gtag('config', '${config.ga4_measurement_id}');` : ''}
                                        ${config.google_ads_enabled && config.google_ads_id ? `gtag('config', '${config.google_ads_id}');` : ''}
                                    `,
                                }}
                            />
                        </>
                    )}

                    {/* Google Tag Manager */}
                    {config.gtm_enabled && config.gtm_id && (
                        <>
                            <Script
                                id="gtm-script"
                                strategy="afterInteractive"
                                dangerouslySetInnerHTML={{
                                    __html: `
                                        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                                        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                                        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                                        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                                        })(window,document,'script','dataLayer','${config.gtm_id}');
                                    `,
                                }}
                            />
                        </>
                    )}

                    {/* TikTok Pixel */}
                    {config.tiktok_enabled && config.tiktok_pixel_id && (
                        <Script
                            id="tiktok-pixel"
                            strategy="afterInteractive"
                            dangerouslySetInnerHTML={{
                                __html: `
                                    !function (w, d, t) {
                                        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
                                        ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
                                        ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
                                        for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
                                        ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
                                        ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
                                        ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
                                        var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
                                        var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                                        ttq.load('${config.tiktok_pixel_id}');
                                        ttq.page();
                                    }(window, document, 'ttq');
                                `,
                            }}
                        />
                    )}

                    {/* UTMify — official: pixel.js with data-utmify-pixel-id + utms/latest.js for UTM capture */}
                    {config.utmify_enabled && config.utmify_pixel_id && (
                        <>
                            <Script
                                id="utmify-pixel"
                                strategy="afterInteractive"
                                src="https://cdn.utmify.com.br/scripts/pixel/pixel.js"
                                data-utmify-pixel-id={config.utmify_pixel_id}
                                async
                                defer
                            />
                            <Script
                                id="utmify-utms"
                                strategy="afterInteractive"
                                src="https://cdn.utmify.com.br/scripts/utms/latest.js"
                                data-utmify-prevent-xcod-sck=""
                                data-utmify-prevent-subids=""
                                async
                                defer
                            />
                        </>
                    )}

                    {/* Custom Head Scripts (user-pasted raw HTML, scripts execute) */}
                    {config.custom_head_scripts && (
                        <RawHtmlInjector html={config.custom_head_scripts} target="head" id="custom-head-scripts" />
                    )}
                </>
            )}

            {children}

            {/* GTM NoScript (deve estar no body) */}
            {isLoaded && config?.gtm_enabled && config?.gtm_id && (
                <noscript>
                    <iframe
                        src={`https://www.googletagmanager.com/ns.html?id=${config.gtm_id}`}
                        height="0"
                        width="0"
                        style={{ display: 'none', visibility: 'hidden' }}
                    />
                </noscript>
            )}

            {/* Custom Body Scripts (user-pasted raw HTML, scripts execute) */}
            {isLoaded && config?.custom_body_scripts && (
                <RawHtmlInjector html={config.custom_body_scripts} target="body" id="custom-body-scripts" />
            )}
        </TrackingContext.Provider>
    );
}
