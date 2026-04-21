'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
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
    Target,
    BookOpen,
    ShieldAlert,
    CheckCircle2,
    CircleDashed,
    MinusCircle,
    Eye,
    EyeOff,
    Copy,
    Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { getBusinessSettingsByGrupo, saveBusinessSettings, DEFAULT_SETTINGS } from '@/lib/business-config'
import { ConfigLinkCard } from '@/components/admin/config-link-card'

type SectionStatus = 'ready' | 'incomplete' | 'disabled'

function StatusBadge({ status, labels }: { status: SectionStatus; labels: { ready: string; incomplete: string; disabled: string } }) {
    if (status === 'ready') {
        return (
            <Badge className="gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50">
                <CheckCircle2 className="w-3 h-3" /> {labels.ready}
            </Badge>
        )
    }
    if (status === 'incomplete') {
        return (
            <Badge className="gap-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50">
                <CircleDashed className="w-3 h-3" /> {labels.incomplete}
            </Badge>
        )
    }
    return (
        <Badge className="gap-1 bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-50">
            <MinusCircle className="w-3 h-3" /> {labels.disabled}
        </Badge>
    )
}

function FieldHelp({ children, href, linkLabel }: { children: React.ReactNode; href?: string; linkLabel?: string }) {
    return (
        <p className="text-xs text-muted-foreground leading-relaxed">
            {children}
            {href && (
                <>
                    {' '}
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brandy-rose-600 hover:text-brandy-rose-700 underline underline-offset-2"
                    >
                        {linkLabel ?? 'Abrir'} <ExternalLink className="w-3 h-3" />
                    </a>
                </>
            )}
        </p>
    )
}

function TutorialSteps({ steps }: { steps: string[] }) {
    return (
        <ol className="space-y-2 pl-0 list-none">
            {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-brandy-rose-50 text-brandy-rose-600 flex items-center justify-center font-semibold text-[11px] shrink-0 mt-0.5">
                        {i + 1}
                    </span>
                    <span>{step}</span>
                </li>
            ))}
        </ol>
    )
}

export default function TrackeamentoPage() {
    const { t } = useAdminI18n()
    const settingsT = t('settings')
    const tr = settingsT.tracking as typeof settingsT.tracking & {
        status: { ready: string; incomplete: string; disabled: string }
        autoEvents: { title: string; lead: string; schedule: string; contact: string; pageView: string }
        tutorial: {
            title: string
            subtitle: string
            meta: { title: string; step1: string; step2: string; step3: string; step4: string; step5: string }
            googleAds: { title: string; step1: string; step2: string; step3: string; step4: string }
            ga4: { title: string; step1: string; step2: string; step3: string }
            gtm: { title: string; step1: string; step2: string; step3: string }
            tiktok: { title: string; step1: string; step2: string }
            utmify: { title: string; step1: string; step2: string }
            verify: { title: string; step1: string; step2: string; step3: string; step4: string }
        }
        helpers: {
            pixelId: string
            accessToken: string
            testEventCode: string
            googleAdsId: string
            googleAdsLabel: string
            ga4Id: string
            gtmId: string
            tiktokPixelId: string
            utmifyPixelId: string
            customScripts: string
        }
        security: { accessTokenWarn: string }
    }
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [config, setConfig] = useState<any>(DEFAULT_SETTINGS)
    const [showToken, setShowToken] = useState(false)
    const [copiedDomain, setCopiedDomain] = useState(false)

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

    const statusLabels = tr.status

    const metaStatus: SectionStatus = useMemo(() => {
        if (!config.tracking_meta_enabled) return 'disabled'
        const hasPixel = !!config.tracking_meta_pixel_id
        const capiOk = !config.tracking_meta_capi_enabled || !!config.tracking_meta_access_token
        return hasPixel && capiOk ? 'ready' : 'incomplete'
    }, [config.tracking_meta_enabled, config.tracking_meta_pixel_id, config.tracking_meta_capi_enabled, config.tracking_meta_access_token])

    const googleAdsStatus: SectionStatus = useMemo(() => {
        if (!config.tracking_google_ads_enabled) return 'disabled'
        return config.tracking_google_ads_id && config.tracking_google_ads_label ? 'ready' : 'incomplete'
    }, [config.tracking_google_ads_enabled, config.tracking_google_ads_id, config.tracking_google_ads_label])

    const ga4Status: SectionStatus = useMemo(() => {
        if (!config.tracking_ga4_enabled) return 'disabled'
        return config.tracking_ga4_measurement_id ? 'ready' : 'incomplete'
    }, [config.tracking_ga4_enabled, config.tracking_ga4_measurement_id])

    const gtmStatus: SectionStatus = useMemo(() => {
        if (!config.tracking_gtm_enabled) return 'disabled'
        return config.tracking_gtm_id ? 'ready' : 'incomplete'
    }, [config.tracking_gtm_enabled, config.tracking_gtm_id])

    const tiktokStatus: SectionStatus = useMemo(() => {
        if (!config.tracking_tiktok_enabled) return 'disabled'
        return config.tracking_tiktok_pixel_id ? 'ready' : 'incomplete'
    }, [config.tracking_tiktok_enabled, config.tracking_tiktok_pixel_id])

    const utmifyStatus: SectionStatus = useMemo(() => {
        if (!config.tracking_utmify_enabled) return 'disabled'
        return config.tracking_utmify_pixel_id ? 'ready' : 'incomplete'
    }, [config.tracking_utmify_enabled, config.tracking_utmify_pixel_id])

    const readyCount = [metaStatus, googleAdsStatus, ga4Status, gtmStatus, tiktokStatus, utmifyStatus].filter((s) => s === 'ready').length
    const incompleteCount = [metaStatus, googleAdsStatus, ga4Status, gtmStatus, tiktokStatus, utmifyStatus].filter((s) => s === 'incomplete').length

    const copyOrigin = async () => {
        try {
            await navigator.clipboard.writeText(window.location.origin)
            setCopiedDomain(true)
            setTimeout(() => setCopiedDomain(false), 2000)
        } catch {
            toast.error(settingsT.error)
        }
    }

    const inputClasses = 'bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400'

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
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {readyCount} {tr.status.ready.toLowerCase()}
                        </span>
                        {incompleteCount > 0 && (
                            <span className="inline-flex items-center gap-1">
                                <CircleDashed className="w-3.5 h-3.5 text-amber-600" /> {incompleteCount} {tr.status.incomplete.toLowerCase()}
                            </span>
                        )}
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600 shadow-sm">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {settingsT.saveChanges}
                    </Button>
                </div>
            </div>

            {/* Tutorial colapsável no topo */}
            <Card className="shadow-sm border-brandy-rose-100 bg-gradient-to-br from-brandy-rose-50/40 to-white">
                <Accordion type="single" collapsible defaultValue={readyCount === 0 ? 'tutorial' : undefined}>
                    <AccordionItem value="tutorial" className="border-none">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-10 h-10 rounded-xl bg-brandy-rose-500 text-white flex items-center justify-center shadow-sm">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-heading text-base text-gray-900">{tr.tutorial.title}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">{tr.tutorial.subtitle}</div>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            {/* Domain copy helper */}
                            <div className="mb-4 flex items-center justify-between p-3 rounded-lg bg-white border border-gray-100">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-700">Domínio do site (pra configurar nos pixels):</p>
                                    <code className="text-xs text-gray-600 break-all">
                                        {typeof window !== 'undefined' ? window.location.origin : ''}
                                    </code>
                                </div>
                                <Button variant="ghost" size="sm" onClick={copyOrigin} className="gap-1 shrink-0">
                                    {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedDomain ? 'Copiado' : 'Copiar'}
                                </Button>
                            </div>

                            <Accordion type="multiple" className="space-y-2">
                                <AccordionItem value="meta" className="border border-gray-100 rounded-lg bg-white px-4">
                                    <AccordionTrigger className="hover:no-underline py-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <Facebook className="w-4 h-4 text-[#1877F2]" /> {tr.tutorial.meta.title}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4">
                                        <TutorialSteps
                                            steps={[
                                                tr.tutorial.meta.step1,
                                                tr.tutorial.meta.step2,
                                                tr.tutorial.meta.step3,
                                                tr.tutorial.meta.step4,
                                                tr.tutorial.meta.step5,
                                            ]}
                                        />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="google-ads" className="border border-gray-100 rounded-lg bg-white px-4">
                                    <AccordionTrigger className="hover:no-underline py-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <Target className="w-4 h-4 text-[#4285F4]" /> {tr.tutorial.googleAds.title}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4">
                                        <TutorialSteps
                                            steps={[
                                                tr.tutorial.googleAds.step1,
                                                tr.tutorial.googleAds.step2,
                                                tr.tutorial.googleAds.step3,
                                                tr.tutorial.googleAds.step4,
                                            ]}
                                        />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="ga4" className="border border-gray-100 rounded-lg bg-white px-4">
                                    <AccordionTrigger className="hover:no-underline py-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <Activity className="w-4 h-4 text-[#F9AB00]" /> {tr.tutorial.ga4.title}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4">
                                        <TutorialSteps steps={[tr.tutorial.ga4.step1, tr.tutorial.ga4.step2, tr.tutorial.ga4.step3]} />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="gtm" className="border border-gray-100 rounded-lg bg-white px-4">
                                    <AccordionTrigger className="hover:no-underline py-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <Zap className="w-4 h-4 text-[#246FDB]" /> {tr.tutorial.gtm.title}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4">
                                        <TutorialSteps steps={[tr.tutorial.gtm.step1, tr.tutorial.gtm.step2, tr.tutorial.gtm.step3]} />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="tiktok" className="border border-gray-100 rounded-lg bg-white px-4">
                                    <AccordionTrigger className="hover:no-underline py-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <Smartphone className="w-4 h-4" /> {tr.tutorial.tiktok.title}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4">
                                        <TutorialSteps steps={[tr.tutorial.tiktok.step1, tr.tutorial.tiktok.step2]} />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="utmify" className="border border-gray-100 rounded-lg bg-white px-4">
                                    <AccordionTrigger className="hover:no-underline py-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <Trophy className="w-4 h-4 text-purple-600" /> {tr.tutorial.utmify.title}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4">
                                        <TutorialSteps steps={[tr.tutorial.utmify.step1, tr.tutorial.utmify.step2]} />
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="verify" className="border border-emerald-100 rounded-lg bg-emerald-50/40 px-4">
                                    <AccordionTrigger className="hover:no-underline py-3">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                                            <CheckCircle2 className="w-4 h-4" /> {tr.tutorial.verify.title}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4">
                                        <TutorialSteps
                                            steps={[
                                                tr.tutorial.verify.step1,
                                                tr.tutorial.verify.step2,
                                                tr.tutorial.verify.step3,
                                                tr.tutorial.verify.step4,
                                            ]}
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </Card>

            {/* Eventos disparados */}
            <Card className="shadow-sm border-gray-100 bg-white">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-gray-900">
                        <Zap className="w-4 h-4 text-brandy-rose-500" /> {tr.autoEvents.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />{tr.autoEvents.lead}</div>
                        <div className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />{tr.autoEvents.schedule}</div>
                        <div className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />{tr.autoEvents.contact}</div>
                        <div className="flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />{tr.autoEvents.pageView}</div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Meta Ads Section */}
                <Card className="shadow-sm border-gray-100 bg-white">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                                <Facebook className="w-5 h-5 text-[#1877F2]" />
                                {settingsT.tracking.sections.metaAds}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <StatusBadge status={metaStatus} labels={statusLabels} />
                                <Switch
                                    checked={config.tracking_meta_enabled}
                                    onCheckedChange={(val) => setConfig({ ...config, tracking_meta_enabled: val })}
                                />
                            </div>
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
                            <FieldHelp href="https://business.facebook.com/events_manager" linkLabel="Events Manager">
                                {tr.helpers.pixelId}
                            </FieldHelp>
                        </div>
                        <div className="space-y-2">
                            <Label>{settingsT.tracking.fields.accessToken}</Label>
                            <div className="relative">
                                <Input
                                    type={showToken ? 'text' : 'password'}
                                    placeholder="EAA..."
                                    value={config.tracking_meta_access_token}
                                    onChange={(e) => setConfig({ ...config, tracking_meta_access_token: e.target.value })}
                                    className={inputClasses + ' pr-10'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowToken((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                    aria-label={showToken ? 'Ocultar' : 'Mostrar'}
                                >
                                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <FieldHelp>{tr.helpers.accessToken}</FieldHelp>
                            <Alert className="bg-amber-50 border-amber-200 py-2">
                                <ShieldAlert className="w-4 h-4 text-amber-600" />
                                <AlertDescription className="text-xs text-amber-800">
                                    {tr.security.accessTokenWarn}
                                </AlertDescription>
                            </Alert>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                            <div className="space-y-0.5 pr-3">
                                <Label className="text-sm font-medium">{settingsT.tracking.fields.conversionApi}</Label>
                                <p className="text-xs text-muted-foreground">{settingsT.tracking.fields.conversionApiDesc}</p>
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
                            <FieldHelp>{tr.helpers.testEventCode}</FieldHelp>
                        </div>
                    </CardContent>
                </Card>

                {/* Google Ads Section */}
                <Card className="shadow-sm border-gray-100 bg-white">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                                <Target className="w-5 h-5 text-[#4285F4]" />
                                {settingsT.tracking.sections.googleAds}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <StatusBadge status={googleAdsStatus} labels={statusLabels} />
                                <Switch
                                    checked={config.tracking_google_ads_enabled}
                                    onCheckedChange={(val) => setConfig({ ...config, tracking_google_ads_enabled: val })}
                                />
                            </div>
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
                            <FieldHelp href="https://ads.google.com" linkLabel="Google Ads">
                                {tr.helpers.googleAdsId}
                            </FieldHelp>
                        </div>
                        <div className="space-y-2">
                            <Label>Conversion Label</Label>
                            <Input
                                placeholder="ab12CD34ef56"
                                value={config.tracking_google_ads_label}
                                onChange={(e) => setConfig({ ...config, tracking_google_ads_label: e.target.value })}
                                className={inputClasses}
                            />
                            <FieldHelp>{tr.helpers.googleAdsLabel}</FieldHelp>
                        </div>
                    </CardContent>
                </Card>

                {/* Google Analytics 4 */}
                <Card className="shadow-sm border-gray-100 bg-white">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                                <Activity className="w-5 h-5 text-[#F9AB00]" />
                                {settingsT.tracking.sections.googleAnalytics}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <StatusBadge status={ga4Status} labels={statusLabels} />
                                <Switch
                                    checked={config.tracking_ga4_enabled}
                                    onCheckedChange={(val) => setConfig({ ...config, tracking_ga4_enabled: val })}
                                />
                            </div>
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
                            <FieldHelp href="https://analytics.google.com" linkLabel="GA4">
                                {tr.helpers.ga4Id}
                            </FieldHelp>
                        </div>
                    </CardContent>
                </Card>

                {/* Google Tag Manager */}
                <Card className="shadow-sm border-gray-100 bg-white">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                                <Zap className="w-5 h-5 text-[#246FDB]" />
                                {settingsT.tracking.sections.gtm}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <StatusBadge status={gtmStatus} labels={statusLabels} />
                                <Switch
                                    checked={config.tracking_gtm_enabled}
                                    onCheckedChange={(val) => setConfig({ ...config, tracking_gtm_enabled: val })}
                                />
                            </div>
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
                            <FieldHelp href="https://tagmanager.google.com" linkLabel="GTM">
                                {tr.helpers.gtmId}
                            </FieldHelp>
                        </div>
                    </CardContent>
                </Card>

                {/* TikTok & UTMify */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                    <Card className="shadow-sm border-gray-100 bg-white">
                        <CardHeader className="py-4">
                            <div className="flex items-center justify-between gap-3">
                                <CardTitle className="flex items-center gap-2 text-md text-gray-900">
                                    <Smartphone className="w-4 h-4" />
                                    {settingsT.tracking.sections.tiktok}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={tiktokStatus} labels={statusLabels} />
                                    <Switch
                                        checked={config.tracking_tiktok_enabled}
                                        onCheckedChange={(val) => setConfig({ ...config, tracking_tiktok_enabled: val })}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4 space-y-2">
                            <Input
                                placeholder="TikTok Pixel ID"
                                value={config.tracking_tiktok_pixel_id}
                                onChange={(e) => setConfig({ ...config, tracking_tiktok_pixel_id: e.target.value })}
                                className={inputClasses}
                            />
                            <FieldHelp href="https://ads.tiktok.com" linkLabel="TikTok Ads">
                                {tr.helpers.tiktokPixelId}
                            </FieldHelp>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-gray-100 bg-white">
                        <CardHeader className="py-4">
                            <div className="flex items-center justify-between gap-3">
                                <CardTitle className="flex items-center gap-2 text-md text-gray-900">
                                    <Trophy className="w-4 h-4 text-purple-600" />
                                    {settingsT.tracking.sections.utmfy}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={utmifyStatus} labels={statusLabels} />
                                    <Switch
                                        checked={config.tracking_utmify_enabled}
                                        onCheckedChange={(val) => setConfig({ ...config, tracking_utmify_enabled: val })}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-4 space-y-2">
                            <Input
                                placeholder="UTMify Pixel ID"
                                value={config.tracking_utmify_pixel_id}
                                onChange={(e) => setConfig({ ...config, tracking_utmify_pixel_id: e.target.value })}
                                className={inputClasses}
                            />
                            <FieldHelp href="https://app.utmify.com.br" linkLabel="UTMify">
                                {tr.helpers.utmifyPixelId}
                            </FieldHelp>
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
                        <CardDescription>{tr.helpers.customScripts}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Scripts no Header (Custom &lt;head&gt;)</Label>
                            <Textarea
                                placeholder="<!-- Adicione seus scripts aqui -->"
                                className={inputClasses + ' font-mono text-xs min-h-[120px]'}
                                value={config.tracking_custom_head_scripts}
                                onChange={(e) => setConfig({ ...config, tracking_custom_head_scripts: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Scripts no Body (Custom &lt;body&gt;)</Label>
                            <Textarea
                                placeholder="<noscript>...</noscript>"
                                className={inputClasses + ' font-mono text-xs min-h-[120px]'}
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
                            settingsT.tracking.tips.tip4,
                        ].map((tip, i) => (
                            <div
                                key={i}
                                className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex gap-4 items-start group hover:border-brandy-rose-200 transition-all"
                            >
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
