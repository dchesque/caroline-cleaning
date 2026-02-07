'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, TranslationKeys, translations } from './translations';

interface AdminI18nContextType {
    locale: Locale;
    t: <T extends keyof TranslationKeys>(section: T) => TranslationKeys[T];
    setLocale: (locale: Locale) => void;
}

const AdminI18nContext = createContext<AdminI18nContextType | undefined>(undefined);

export function AdminI18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('pt-BR');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const savedLocale = localStorage.getItem('admin_locale') as Locale;
        if (savedLocale && (savedLocale === 'pt-BR' || savedLocale === 'en-US')) {
            setLocaleState(savedLocale);
        }
        setIsLoaded(true);
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem('admin_locale', newLocale);
    };

    // Função de tradução simplificada que retorna a seção inteira
    // ou podemos fazer uma mais granular se preferir.
    // Para ser leve, vamos retornar a seção e usar nos componentes.
    const t = <T extends keyof TranslationKeys>(section: T): TranslationKeys[T] => {
        return (translations[locale] as any)[section];
    };

    // Evita flash de conteúdo traduzido errado
    if (!isLoaded) return null;

    return (
        <AdminI18nContext.Provider value={{ locale, t, setLocale }}>
            {children}
        </AdminI18nContext.Provider>
    );
}

export function useAdminI18n() {
    const context = useContext(AdminI18nContext);
    if (context === undefined) {
        throw new Error('useAdminI18n must be used within an AdminI18nProvider');
    }
    return context;
}
