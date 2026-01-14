'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    Layout,
    Save,
    Loader2,
    ChevronLeft,
    Megaphone,
    Monitor,
    Star,
    MessageSquare,
    Search,
    ExternalLink,
    Upload,
    Trash2,
    Sparkles,
    DollarSign,
    Box
} from 'lucide-react'
import { toast } from 'sonner'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { getBusinessSettingsByGrupo, saveBusinessSettings, DEFAULT_SETTINGS } from '@/lib/business-config'
import { ConfigLinkCard } from '@/components/admin/config-link-card'

export default function PaginaInicialConfigPage() {
    const { t } = useAdminI18n()
    const settingsT = t('settings')
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState<string | null>(null)
    const [config, setConfig] = useState<any>(DEFAULT_SETTINGS)

    const supabase = createClient()

    useEffect(() => {
        const loadConfig = async () => {
            setIsLoading(true)
            const data = await getBusinessSettingsByGrupo('pagina_inicial')
            setConfig((prev: any) => ({ ...prev, ...data }))
            setIsLoading(false)
        }
        loadConfig()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await saveBusinessSettings(config, 'pagina_inicial')
            toast.success(settingsT.saved)
        } catch (error) {
            console.error('Error saving landing config:', error)
            toast.error(settingsT.error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(field)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${field}-${Math.random()}.${fileExt}`
            const filePath = `landing/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('company-assets')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('company-assets')
                .getPublicUrl(filePath)

            setConfig((prev: any) => ({ ...prev, [field]: publicUrl }))
            toast.success('Image uploaded successfully')
        } catch (error) {
            console.error(`Error uploading ${field}:`, error)
            toast.error('Error uploading image')
        } finally {
            setIsUploading(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-brandy-rose-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                        <h1 className="font-heading text-2xl text-foreground">{settingsT.landing.title}</h1>
                        <p className="text-sm text-muted-foreground">{settingsT.landing.subtitle}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild className="hidden sm:flex gap-2 border-gray-200">
                        <a href="/" target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                            {settingsT.landing.preview}
                        </a>
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {settingsT.saveChanges}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Announcement Bar */}
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Megaphone className="w-5 h-5 text-brandy-rose-500" />
                            {settingsT.landing.sections.announcement}
                        </CardTitle>
                        <CardDescription>{settingsT.landing.sections.announcementDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="announcementEnabled">{settingsT.landing.fields.announcementEnabled}</Label>
                            <Switch
                                id="announcementEnabled"
                                checked={config.announcement_enabled}
                                onCheckedChange={(checked) => setConfig({ ...config, announcement_enabled: checked })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{settingsT.landing.fields.announcementText}</Label>
                            <Input
                                value={config.announcement_text}
                                onChange={(e) => setConfig({ ...config, announcement_text: e.target.value })}
                                placeholder="Free estimate 24/7..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{settingsT.landing.fields.announcementBgColor}</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={config.announcement_bg_color}
                                    onChange={(e) => setConfig({ ...config, announcement_bg_color: e.target.value })}
                                    className="w-12 h-10 p-1"
                                />
                                <Input
                                    value={config.announcement_bg_color}
                                    onChange={(e) => setConfig({ ...config, announcement_bg_color: e.target.value })}
                                    className="flex-1 font-mono uppercase"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Hero Section */}
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Monitor className="w-5 h-5 text-brandy-rose-500" />
                            {settingsT.landing.sections.hero}
                        </CardTitle>
                        <CardDescription>{settingsT.landing.sections.heroDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{settingsT.landing.fields.heroTitle}</Label>
                            <Input
                                value={config.hero_title}
                                onChange={(e) => setConfig({ ...config, hero_title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{settingsT.landing.fields.heroSubtitle}</Label>
                            <Textarea
                                value={config.hero_subtitle}
                                onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
                                className="min-h-[80px]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{settingsT.landing.fields.heroCtaText}</Label>
                                <Input
                                    value={config.hero_cta_text}
                                    onChange={(e) => setConfig({ ...config, hero_cta_text: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{settingsT.landing.fields.heroCtaSecondary}</Label>
                                <Input
                                    value={config.hero_cta_secondary}
                                    onChange={(e) => setConfig({ ...config, hero_cta_secondary: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Badges de Confiança */}
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Star className="w-5 h-5 text-brandy-rose-500" />
                            {settingsT.landing.sections.trustBadges}
                        </CardTitle>
                        <CardDescription>{settingsT.landing.sections.trustBadgesDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="badgesEnabled">{settingsT.landing.fields.badgesEnabled}</Label>
                            <Switch
                                id="badgesEnabled"
                                checked={config.badges_enabled}
                                onCheckedChange={(checked) => setConfig({ ...config, badges_enabled: checked })}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>{settingsT.landing.fields.badgesRating}</Label>
                                <Input
                                    value={config.badges_rating}
                                    onChange={(e) => setConfig({ ...config, badges_rating: e.target.value })}
                                    placeholder="4.9"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{settingsT.landing.fields.badgesReviewsCount}</Label>
                                <Input
                                    value={config.badges_reviews_count}
                                    onChange={(e) => setConfig({ ...config, badges_reviews_count: e.target.value })}
                                    placeholder="200+"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{settingsT.landing.fields.badgesYearsExperience}</Label>
                                <Input
                                    value={config.badges_years_experience}
                                    onChange={(e) => setConfig({ ...config, badges_years_experience: e.target.value })}
                                    placeholder="5+"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{settingsT.landing.fields.badgesGoogleUrl}</Label>
                            <Input
                                value={config.badges_google_reviews_url}
                                onChange={(e) => setConfig({ ...config, badges_google_reviews_url: e.target.value })}
                                placeholder="https://g.page/..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Chat/IA Carol */}
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <MessageSquare className="w-5 h-5 text-brandy-rose-500" />
                            {settingsT.landing.sections.chat}
                        </CardTitle>
                        <CardDescription>{settingsT.landing.sections.chatDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="chatEnabled">{settingsT.landing.fields.chatEnabled}</Label>
                            <Switch
                                id="chatEnabled"
                                checked={config.chat_enabled}
                                onCheckedChange={(checked) => setConfig({ ...config, chat_enabled: checked })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{settingsT.landing.fields.aiName}</Label>
                                <Input
                                    value={config.ai_name}
                                    onChange={(e) => setConfig({ ...config, ai_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{settingsT.landing.fields.aiTone}</Label>
                                <Select
                                    value={config.ai_tone}
                                    onValueChange={(val) => setConfig({ ...config, ai_tone: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="friendly">{settingsT.landing.fields.aiToneOptions.friendly}</SelectItem>
                                        <SelectItem value="professional">{settingsT.landing.fields.aiToneOptions.professional}</SelectItem>
                                        <SelectItem value="casual">{settingsT.landing.fields.aiToneOptions.casual}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{settingsT.landing.fields.aiGreeting}</Label>
                            <Textarea
                                value={config.ai_greeting}
                                onChange={(e) => setConfig({ ...config, ai_greeting: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{settingsT.landing.fields.chatPosition}</Label>
                            <Select
                                value={config.chat_position}
                                onValueChange={(val) => setConfig({ ...config, chat_position: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bottom-right">{settingsT.landing.fields.chatPositionOptions.bottomRight}</SelectItem>
                                    <SelectItem value="bottom-left">{settingsT.landing.fields.chatPositionOptions.bottomLeft}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* SEO Settings */}
                <Card className="lg:col-span-2 shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Search className="w-5 h-5 text-brandy-rose-500" />
                            {settingsT.landing.sections.seo}
                        </CardTitle>
                        <CardDescription>{settingsT.landing.sections.seoDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{settingsT.landing.fields.seoTitle}</Label>
                                    <Input
                                        value={config.seo_title}
                                        onChange={(e) => setConfig({ ...config, seo_title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{settingsT.landing.fields.seoDescription}</Label>
                                    <Textarea
                                        value={config.seo_description}
                                        onChange={(e) => setConfig({ ...config, seo_description: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{settingsT.landing.fields.seoKeywords}</Label>
                                    <Input
                                        value={config.seo_keywords}
                                        onChange={(e) => setConfig({ ...config, seo_keywords: e.target.value })}
                                        placeholder="cleaning, home, charlotte..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label>{settingsT.landing.fields.seoOgImage}</Label>
                                <div className="relative aspect-video rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden group">
                                    {config.seo_og_image ? (
                                        <>
                                            <img src={config.seo_og_image} alt="SEO Preview" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setConfig({ ...config, seo_og_image: '' })}
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-8 h-8 text-white" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Search className="w-12 h-12" />
                                            <span>Preview SEO Image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="seo-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 'seo_og_image')}
                                        disabled={isUploading === 'seo_og_image'}
                                    />
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full gap-2 cursor-pointer"
                                    >
                                        <label htmlFor="seo-upload">
                                            {isUploading === 'seo_og_image' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            Upload Image
                                        </label>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Links Relacionados */}
            <div className="pt-6 border-t border-gray-100">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">{settingsT.landing.relatedLinks.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ConfigLinkCard
                        href="/admin/servicos"
                        icon={Sparkles}
                        title={settingsT.landing.relatedLinks.services}
                        description={settingsT.landing.relatedLinks.servicesDesc}
                        className="py-4"
                    />
                    <ConfigLinkCard
                        href="/admin/configuracoes/sistema" // Pricing is usually here or global
                        icon={DollarSign}
                        title={settingsT.landing.relatedLinks.pricing}
                        description={settingsT.landing.relatedLinks.pricingDesc}
                        className="py-4"
                    />
                    <ConfigLinkCard
                        href="/admin/servicos?tab=addons"
                        icon={Box}
                        title={settingsT.landing.relatedLinks.addons}
                        description={settingsT.landing.relatedLinks.addonsDesc}
                        className="py-4"
                    />
                </div>
            </div>
        </div>
    )
}
