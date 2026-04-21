'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
    Save,
    Loader2,
    ChevronLeft,
    BarChart3,
    Facebook,
    Smartphone,
    Trophy,
    Activity,
    Code,
    Lightbulb,
    ExternalLink,
    Zap,
    Target
} from 'lucide-react'
import { toast } from 'sonner'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { getBusinessSettingsByGrupo, saveBusinessSettings, DEFAULT_SETTINGS } from '@/lib/business-config'
import { ConfigLinkCard } from '@/components/admin/config-link-card'

export default function TrackeamentoPage() {
    const { t } = useAdminI18n()
    const settingsT = t('settings')
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [config, setConfig] = useState<any>(DEFAULT_SETTINGS)

    useEffect(() => {
        const loadConfig = async () => {
            setIsLoading(true)
            const data = await getBusinessSettingsByGrupo('trackeamento')
            setConfig((prev: any) => ({ ...prev, ...data }))
            setIsLoading(false)
        }
        loadConfig()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await saveBusinessSettings(config, 'trackeamento')
            toast.success(settingsT.saved)
        } catch (error) {
            console.error('Error saving tracking config:', error)
            toast.error(settingsT.error)
        } finally {
            setIsSaving(false)
        }
    }

    const inputClasses = "bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-brandy-rose-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/admin/configuracoes')}
                        className="rounded-full shadow-sm bg-white border border-gray-100 hover:bg-gray-50"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="font-heading text-2xl text-foreground">{settingsT.tracking.title}</h1>
                        <p className="text-sm text-muted-foreground">{settingsT.tracking.subtitle}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600 shadow-sm">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {settingsT.saveChanges}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Meta Ads Section */}
                <Card className="shadow-sm border-gray-100 bg-white">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                                <Facebook className="w-5 h-5 text-[#1877F2]" />
                                {settingsT.tracking.sections.metaAds}
                            </CardTitle>
                            <Switch
                                checked={config.tracking_meta_enabled}
                                onCheckedChange={(val) => setConfig({ ...config, tracking_meta_enabled: val })}
                            />
                        </div>
                        <CardDescription>{settingsT.tracking.sections.metaAdsDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{settingsT.tracking.fields.pixelId}</Label>
                            <Input
                                placeholder="1234567890"
                                value={config.tracking_meta_pixel_id}
                                onChange={(e) => setConfig({ ...config, tracking_meta_pixel_id: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{settingsT.tracking.fields.accessToken}</Label>
                            <Input
                                type="password"
                                placeholder="EAA..."
                                value={config.tracking_meta_access_token}
                                onChange={(e) => setConfig({ ...config, tracking_meta_access_token: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-50 bg-gray-50/30">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">{settingsT.tracking.fields.conversionApi}</Label>
                                <p className="text-[10px] text-muted-foreground">{settingsT.tracking.fields.conversionApiDesc}</p>
                            </div>
                            <Switch
                                checked={config.tracking_meta_capi_enabled}
                                onCheckedChange={(val) => setConfig({ ...config, tracking_meta_capi_enabled: val })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{settingsT.tracking.fields.testEventCode}</Label>
                            <Input
                                placeholder="TEST12345"
                                value={config.tracking_meta_test_event_code}
                                onChange={(e) => setConfig({ ...config, tracking_meta_test_event_code: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Google Ads Section */}
                <Card className="shadow-sm border-gray-100 bg-white">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                                <Target className="w-5 h-5 text-[#4285F4]" />
                                {settingsT.tracking.sections.googleAds}
                            </CardTitle>
                            <Switch
                                checked={config.tracking_google_ads_enabled}
                                onCheckedChange={(val) => setConfig({ ...config, tracking_google_ads_enabled: val })}
                            />
                        </div>
                        <CardDescription>{settingsT.tracking.sections.googleAdsDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Conversion ID</Label>
                            <Input
                                placeholder="AW-123456789"
                                value={config.tracking_google_ads_id}
                                onChange={(e) => setConfig({ ...config, tracking_google_ads_id: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Conversion Label</Label>
                            <Input
                                placeholder="ab12CD34ef56"
                                value={config.tracking_google_ads_label}
                                onChange={(e) => setConfig({ ...config, tracking_google_ads_label: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Google Analytics 4 */}
                <Card className="shadow-sm border-gray-100 bg-white">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                                <Activity className="w-5 h-5 text-[#F9AB00]" />
                                {settingsT.tracking.sections.googleAnalytics}
                            </CardTitle>
                            <Switch
                                checked={config.tracking_ga4_enabled}
                                onCheckedChange={(val) => setConfig({ ...config, tracking_ga4_enabled: val })}
                            />
                        </div>
                        <CardDescription>{settingsT.tracking.sections.googleAnalyticsDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Measurement ID (G-XXXXX)</Label>
                            <Input
                                placeholder="G-ABC123DEF"
                                value={config.tracking_ga4_measurement_id}
                                onChange={(e) => setConfig({ ...config, tracking_ga4_measurement_id: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Google Tag Manager */}
                <Card className="shadow-sm border-gray-100 bg-white">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                                <Zap className="w-5 h-5 text-[#246FDB]" />
                                {settingsT.tracking.sections.gtm}
                            </CardTitle>
                            <Switch
                                checked={config.tracking_gtm_enabled}
                                onCheckedChange={(val) => setConfig({ ...config, tracking_gtm_enabled: val })}
                            />
                        </div>
                        <CardDescription>{settingsT.tracking.sections.gtmDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Container ID (GTM-XXXXX)</Label>
                            <Input
                                placeholder="GTM-ABC123D"
                                value={config.tracking_gtm_id}
                                onChange={(e) => setConfig({ ...config, tracking_gtm_id: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* TikTok & UTMify */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                    <Card className="shadow-sm border-gray-100 bg-white">
                        <CardHeader className="py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-md text-gray-900">
                                    <Smartphone className="w-4 h-4" />
                                    {settingsT.tracking.sections.tiktok}
                                </CardTitle>
                                <Switch
                                    checked={config.tracking_tiktok_enabled}
                                    onCheckedChange={(val) => setConfig({ ...config, tracking_tiktok_enabled: val })}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <Input
                                placeholder="TikTok Pixel ID"
                                value={config.tracking_tiktok_pixel_id}
                                onChange={(e) => setConfig({ ...config, tracking_tiktok_pixel_id: e.target.value })}
                                className={inputClasses}
                            />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-100 bg-white">
                        <CardHeader className="py-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-md text-gray-900">
                                    <Trophy className="w-4 h-4 text-purple-600" />
                                    {settingsT.tracking.sections.utmfy}
                                </CardTitle>
                                <Switch
                                    checked={config.tracking_utmify_enabled}
                                    onCheckedChange={(val) => setConfig({ ...config, tracking_utmify_enabled: val })}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                            <Input
                                placeholder="UTMify Pixel ID"
                                value={config.tracking_utmify_pixel_id}
                                onChange={(e) => setConfig({ ...config, tracking_utmify_pixel_id: e.target.value })}
                                className={inputClasses}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Custom Scripts */}
                <Card className="shadow-sm border-gray-100 bg-white lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                            <Code className="w-5 h-5 text-gray-600" />
                            {settingsT.tracking.sections.customScripts}
                        </CardTitle>
                        <CardDescription>{settingsT.tracking.sections.customScriptsDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Scripts no Header (Custom &lt;head&gt;)</Label>
                            <Textarea
                                placeholder="<!-- Adicione seus scripts aqui -->"
                                className={inputClasses + " font-mono text-xs min-h-[120px]"}
                                value={config.tracking_custom_head_scripts}
                                onChange={(e) => setConfig({ ...config, tracking_custom_head_scripts: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Scripts no Body (Custom &lt;body&gt;)</Label>
                            <Textarea
                                placeholder="<noscript>...</noscript>"
                                className={inputClasses + " font-mono text-xs min-h-[120px]"}
                                value={config.tracking_custom_body_scripts}
                                onChange={(e) => setConfig({ ...config, tracking_custom_body_scripts: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Implementation Tips and Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div className="md:col-span-2 space-y-6">
                    <h3 className="text-lg font-heading font-semibold flex items-center gap-2 text-gray-800">
                        <Lightbulb className="w-5 h-5 text-brandy-rose-500" />
                        {settingsT.tracking.tips.title}
                    </h3>
                    <div className="grid gap-4">
                        {[
                            settingsT.tracking.tips.tip1,
                            settingsT.tracking.tips.tip2,
                            settingsT.tracking.tips.tip3,
                            settingsT.tracking.tips.tip4
                        ].map((tip, i) => (
                            <div key={i} className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex gap-4 items-start group hover:border-brandy-rose-200 transition-all">
                                <div className="w-8 h-8 rounded-full bg-brandy-rose-50 flex items-center justify-center text-brandy-rose-500 font-bold text-sm shrink-0">
                                    {i + 1}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">{tip}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-brandy-rose-500 to-brandy-rose-600 text-white shadow-lg overflow-hidden relative">
                        <Zap className="absolute -top-4 -right-4 w-24 h-24 text-white/10 rotate-12" />
                        <h4 className="font-heading font-bold mb-2 relative z-10">Centralized Tracking</h4>
                        <p className="text-xs text-white/80 leading-relaxed relative z-10">
                            Configure pixels across all platforms in one place. Your scripts are automatically injected into the customer-facing website.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                            {settingsT.tracking.relatedLinks.title}
                        </h4>
                        <ConfigLinkCard
                            href="/admin/configuracoes/pagina-inicial"
                            icon={ExternalLink}
                            title={settingsT.tracking.relatedLinks.landing}
                            description={settingsT.tracking.relatedLinks.landingDesc}
                            className="py-4 bg-white border-gray-200"
                        />
                        <ConfigLinkCard
                            href="/admin/analytics"
                            icon={BarChart3}
                            title={settingsT.tracking.relatedLinks.analytics}
                            description={settingsT.tracking.relatedLinks.analyticsDesc}
                            className="py-4 bg-white border-gray-200"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
