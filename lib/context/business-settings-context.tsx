'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { BusinessSettings, getBusinessSettingsClient } from '@/lib/business-config'

const BusinessSettingsContext = createContext<BusinessSettings | undefined>(undefined)

export function BusinessSettingsProvider({
    children,
    initialSettings
}: {
    children: React.ReactNode
    initialSettings: BusinessSettings
}) {
    const [settings, setSettings] = useState<BusinessSettings>(initialSettings)

    // Optional: sync settings if they change in DB (not strictly required for now)
    /*
    useEffect(() => {
        const fetchSettings = async () => {
            const data = await getBusinessSettingsClient()
            setSettings(data)
        }
        fetchSettings()
    }, [])
    */

    return (
        <BusinessSettingsContext.Provider value={settings}>
            {children}
        </BusinessSettingsContext.Provider>
    )
}

export function useBusinessSettings() {
    const context = useContext(BusinessSettingsContext)
    if (context === undefined) {
        throw new Error('useBusinessSettings must be used within a BusinessSettingsProvider')
    }
    return context
}
