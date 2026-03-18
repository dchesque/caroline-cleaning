'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
    Megaphone,
    Monitor,
    Star,
    MessageSquare,
    Search,
    ExternalLink,
    Upload,
    Trash2,
    Sparkles,
    Zap,
    CheckSquare,
    Quote,
    MousePointer,
    Phone,
    User,
    HelpCircle,
    DollarSign
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { getBusinessSettingsByGrupo, saveBusinessSettings, DEFAULT_SETTINGS } from '@/lib/business-config'
import { revalidateLandingPage } from '@/lib/actions/revalidate'

export default function PaginaInicialConfigPage() {
    const { t } = useAdminI18n()
    const settingsT = t('settings')
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState<string | null>(null)
    const [config, setConfig] = useState<any>(DEFAULT_SETTINGS)

    const supabase = createClient()
    const inputClasses = "bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"

    useEffect(() => {
        const loadConfig = async () => {
            setIsLoading(true)
            // Fetch both 'pagina_inicial' and 'empresa' groups because 
            // the about section and some global settings might be in 'empresa'
            const [lpData, empresaData] = await Promise.all([
                getBusinessSettingsByGrupo('pagina_inicial'),
                getBusinessSettingsByGrupo('empresa')
            ])
            
            // Merge in order of priority: Default < Empresa < Pagina Inicial
            setConfig((prev: any) => ({ 
                ...prev, 
                ...empresaData, 
                ...lpData 
            }))
            setIsLoading(false)
        }
        loadConfig()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await saveBusinessSettings(config, 'pagina_inicial')
            await revalidateLandingPage()
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

            {/* Accordion Sections */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-md overflow-hidden">
                <Accordion type="multiple" defaultValue={["announcement", "hero"]} className="w-full">

                    {/* Announcement Bar */}
                    <AccordionItem value="announcement" className="border-b-2 border-gray-200 bg-white">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <Megaphone className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">Announcement Bar</h3>
                                    <p className="text-sm text-muted-foreground">Top banner message</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label>Enable Announcement</Label>
                                    <Switch
                                        checked={config.announcement_enabled}
                                        onCheckedChange={(checked) => setConfig({ ...config, announcement_enabled: checked })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Announcement Text</Label>
                                    <Input
                                        value={config.announcement_text}
                                        onChange={(e) => setConfig({ ...config, announcement_text: e.target.value })}
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Background Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            value={config.announcement_bg_color || '#C48B7F'}
                                            onChange={(e) => setConfig({ ...config, announcement_bg_color: e.target.value })}
                                            className="w-12 h-10 p-1 cursor-pointer"
                                        />
                                        <Input
                                            value={config.announcement_bg_color || '#C48B7F'}
                                            onChange={(e) => setConfig({ ...config, announcement_bg_color: e.target.value })}
                                            className={cn(inputClasses, "flex-1")}
                                        />
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Hero Section */}
                    <AccordionItem value="hero" className="border-b-2 border-gray-200 bg-gray-50/50">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <Monitor className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">Hero Section</h3>
                                    <p className="text-sm text-muted-foreground">Main headline and call-to-action</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Title (Line 1)</Label>
                                        <Input
                                            value={config.hero_title_1}
                                            onChange={(e) => setConfig({ ...config, hero_title_1: e.target.value })}
                                            placeholder="Professional Cleaning,"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Title (Line 2 - Highlighted)</Label>
                                        <Input
                                            value={config.hero_title_2}
                                            onChange={(e) => setConfig({ ...config, hero_title_2: e.target.value })}
                                            placeholder="Instantly Scheduled"
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Subtitle</Label>
                                    <Textarea
                                        value={config.hero_subtitle}
                                        onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
                                        className={cn(inputClasses, "min-h-[80px]")}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Primary CTA Text</Label>
                                        <Input
                                            value={config.hero_cta_text}
                                            onChange={(e) => setConfig({ ...config, hero_cta_text: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Secondary CTA Text</Label>
                                        <Input
                                            value={config.hero_cta_secondary}
                                            onChange={(e) => setConfig({ ...config, hero_cta_secondary: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Trust Badges */}
                    <AccordionItem value="badges" className="border-b-2 border-gray-200 bg-white">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <Star className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">Trust Badges</h3>
                                    <p className="text-sm text-muted-foreground">Rating and credibility indicators</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label>Enable Trust Badges</Label>
                                    <Switch
                                        checked={config.badges_enabled}
                                        onCheckedChange={(checked) => setConfig({ ...config, badges_enabled: checked })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Rating</Label>
                                        <Input
                                            value={config.badges_rating}
                                            onChange={(e) => setConfig({ ...config, badges_rating: e.target.value })}
                                            placeholder="4.9"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reviews Count</Label>
                                        <Input
                                            value={config.badges_reviews_count}
                                            onChange={(e) => setConfig({ ...config, badges_reviews_count: e.target.value })}
                                            placeholder="200+"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Years Experience</Label>
                                        <Input
                                            value={config.badges_years_experience}
                                            onChange={(e) => setConfig({ ...config, badges_years_experience: e.target.value })}
                                            placeholder="5+"
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Google Reviews URL</Label>
                                    <Input
                                        value={config.badges_google_reviews_url}
                                        onChange={(e) => setConfig({ ...config, badges_google_reviews_url: e.target.value })}
                                        placeholder="https://g.page/r/..."
                                        className={inputClasses}
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Services Section */}
                    <AccordionItem value="services" className="border-b-2 border-gray-200 bg-gray-50/50">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <Sparkles className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">Services Section</h3>
                                    <p className="text-sm text-muted-foreground">Services showcase area</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label>Section Title</Label>
                                    <Input
                                        value={config.services_title}
                                        onChange={(e) => setConfig({ ...config, services_title: e.target.value })}
                                        placeholder="Cleaning Services"
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Section Subtitle</Label>
                                    <Textarea
                                        value={config.services_subtitle}
                                        onChange={(e) => setConfig({ ...config, services_subtitle: e.target.value })}
                                        className={cn(inputClasses, "min-h-[80px]")}
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Pricing Section */}
                    <AccordionItem value="pricing" className="border-b-2 border-gray-200 bg-white">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <DollarSign className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">Pricing Section</h3>
                                    <p className="text-sm text-muted-foreground">Pricing cards and format</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Section Title</Label>
                                        <Input
                                            value={config.pricing_title}
                                            onChange={(e) => setConfig({ ...config, pricing_title: e.target.value })}
                                            placeholder="Transparent Pricing"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Price Format</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant={config.pricing_format === 'range' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setConfig({ ...config, pricing_format: 'range' })}
                                                className={config.pricing_format === 'range' ? 'bg-brandy-rose-500 hover:bg-brandy-rose-600' : ''}
                                            >
                                                Range ($120 - $200)
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={config.pricing_format === 'starting_at' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setConfig({ ...config, pricing_format: 'starting_at' })}
                                                className={config.pricing_format === 'starting_at' ? 'bg-brandy-rose-500 hover:bg-brandy-rose-600' : ''}
                                            >
                                                Starting at ($120)
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Section Subtitle</Label>
                                    <Textarea
                                        value={config.pricing_subtitle}
                                        onChange={(e) => setConfig({ ...config, pricing_subtitle: e.target.value })}
                                        className={cn(inputClasses, "min-h-[60px]")}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>CTA Button Text</Label>
                                        <Input
                                            value={config.pricing_cta_text}
                                            onChange={(e) => setConfig({ ...config, pricing_cta_text: e.target.value })}
                                            placeholder="Schedule Visit Now"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CTA Subtext (above button)</Label>
                                        <Input
                                            value={config.pricing_cta_subtext}
                                            onChange={(e) => setConfig({ ...config, pricing_cta_subtext: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                    <p className="text-sm text-amber-800">
                                        💡 Para editar os valores de preço de cada serviço, acesse <strong>Configurações → Preços</strong> ou edite diretamente no banco de dados.
                                    </p>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* How It Works */}
                    <AccordionItem value="how-it-works" className="border-b-2 border-gray-200 bg-white">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <Zap className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">How It Works</h3>
                                    <p className="text-sm text-muted-foreground">Step-by-step process</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Section Title</Label>
                                        <Input
                                            value={config.how_it_works_title}
                                            onChange={(e) => setConfig({ ...config, how_it_works_title: e.target.value })}
                                            placeholder="How Scheduling Works"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CTA Button Text</Label>
                                        <Input
                                            value={config.how_it_works_cta}
                                            onChange={(e) => setConfig({ ...config, how_it_works_cta: e.target.value })}
                                            placeholder="Request a Visit"
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Section Subtitle</Label>
                                    <Input
                                        value={config.how_it_works_subtitle}
                                        onChange={(e) => setConfig({ ...config, how_it_works_subtitle: e.target.value })}
                                        className={inputClasses}
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* What's Included */}
                    <AccordionItem value="whats-included" className="border-b-2 border-gray-200 bg-gray-50/50">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <CheckSquare className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">What's Included</h3>
                                    <p className="text-sm text-muted-foreground">Service inclusions list</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Section Title</Label>
                                        <Input
                                            value={config.whats_included_title}
                                            onChange={(e) => setConfig({ ...config, whats_included_title: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Section Subtitle</Label>
                                        <Input
                                            value={config.whats_included_subtitle}
                                            onChange={(e) => setConfig({ ...config, whats_included_subtitle: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Standard Items (one per line)</Label>
                                        <Textarea
                                            value={(config.whats_included_standard || []).join('\n')}
                                            onChange={(e) => setConfig({ ...config, whats_included_standard: e.target.value.split('\n').filter((s: string) => s.trim()) })}
                                            placeholder="Kitchen cleaning&#10;Bathroom cleaning&#10;..."
                                            className={cn(inputClasses, "min-h-[120px]")}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Optional Items (one per line)</Label>
                                        <Textarea
                                            value={(config.whats_included_optional || []).join('\n')}
                                            onChange={(e) => setConfig({ ...config, whats_included_optional: e.target.value.split('\n').filter((s: string) => s.trim()) })}
                                            placeholder="Interior oven cleaning&#10;..."
                                            className={cn(inputClasses, "min-h-[120px]")}
                                        />
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Testimonials */}
                    <AccordionItem value="testimonials" className="border-b-2 border-gray-200 bg-white">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <Quote className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">Testimonials</h3>
                                    <p className="text-sm text-muted-foreground">Client reviews section</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Section Title</Label>
                                        <Input
                                            value={config.testimonials_title}
                                            onChange={(e) => setConfig({ ...config, testimonials_title: e.target.value })}
                                            placeholder="What Our Clients Say"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Section Subtitle</Label>
                                        <Input
                                            value={config.testimonials_subtitle}
                                            onChange={(e) => setConfig({ ...config, testimonials_subtitle: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* CTA Section */}
                    <AccordionItem value="cta" className="border-b-2 border-gray-200 bg-gray-50/50">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <MousePointer className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">CTA Section</h3>
                                    <p className="text-sm text-muted-foreground">Call-to-action banner</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        value={config.cta_title}
                                        onChange={(e) => setConfig({ ...config, cta_title: e.target.value })}
                                        placeholder="Ready for a Spotless Home?"
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Subtitle</Label>
                                    <Textarea
                                        value={config.cta_subtitle}
                                        onChange={(e) => setConfig({ ...config, cta_subtitle: e.target.value })}
                                        className={cn(inputClasses, "min-h-[60px]")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Button Text</Label>
                                    <Input
                                        value={config.cta_button_text}
                                        onChange={(e) => setConfig({ ...config, cta_button_text: e.target.value })}
                                        placeholder="Request a Visit"
                                        className={inputClasses}
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Contact Form */}
                    <AccordionItem value="contact" className="border-b-2 border-gray-200 bg-white">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <Phone className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">Contact Form</h3>
                                    <p className="text-sm text-muted-foreground">Callback request section</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Section Title</Label>
                                        <Input
                                            value={config.contact_title}
                                            onChange={(e) => setConfig({ ...config, contact_title: e.target.value })}
                                            placeholder="Prefer a Callback?"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Section Subtitle</Label>
                                        <Input
                                            value={config.contact_subtitle}
                                            onChange={(e) => setConfig({ ...config, contact_subtitle: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* About Us */}
                    <AccordionItem value="about" className="border-b-2 border-gray-200 bg-gray-50/50">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <User className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">About Us</h3>
                                    <p className="text-sm text-muted-foreground">Company information</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Section Title</Label>
                                            <Input
                                                value={config.about_title}
                                                onChange={(e) => setConfig({ ...config, about_title: e.target.value })}
                                                className={inputClasses}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Intro Paragraph 1</Label>
                                            <Textarea
                                                value={config.about_intro_p1}
                                                onChange={(e) => setConfig({ ...config, about_intro_p1: e.target.value })}
                                                className={cn(inputClasses, "min-h-[80px]")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Intro Paragraph 2</Label>
                                            <Textarea
                                                value={config.about_intro_p2}
                                                onChange={(e) => setConfig({ ...config, about_intro_p2: e.target.value })}
                                                className={cn(inputClasses, "min-h-[80px]")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Note Box</Label>
                                            <Textarea
                                                value={config.about_note}
                                                onChange={(e) => setConfig({ ...config, about_note: e.target.value })}
                                                className={cn(inputClasses, "min-h-[60px]")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Quote</Label>
                                            <Textarea
                                                value={config.about_quote}
                                                onChange={(e) => setConfig({ ...config, about_quote: e.target.value })}
                                                className={cn(inputClasses, "min-h-[60px]")}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Profile Image</Label>
                                            <div className="flex items-center gap-4">
                                                {config.about_image && (
                                                    <img src={config.about_image} alt="About" className="w-24 h-24 rounded-lg object-cover" />
                                                )}
                                                <div className="flex-1">
                                                    <label className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                                        {isUploading === 'about_image' ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Upload className="w-4 h-4" />
                                                        )}
                                                        <span className="text-sm">Upload Image</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(e, 'about_image')}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Founder Name</Label>
                                                <Input
                                                    value={config.about_founder_name}
                                                    onChange={(e) => setConfig({ ...config, about_founder_name: e.target.value })}
                                                    placeholder="Thayna"
                                                    className={inputClasses}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Founder Role</Label>
                                                <Input
                                                    value={config.about_founder_role}
                                                    onChange={(e) => setConfig({ ...config, about_founder_role: e.target.value })}
                                                    placeholder="Founder & Owner"
                                                    className={inputClasses}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Highlights (one per line)</Label>
                                            <Textarea
                                                value={(config.about_highlights || []).join('\n')}
                                                onChange={(e) => setConfig({ ...config, about_highlights: e.target.value.split('\n').filter((s: string) => s.trim()) })}
                                                placeholder="Experienced professionals&#10;Well-defined processes&#10;..."
                                                className={cn(inputClasses, "min-h-[100px]")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* FAQ */}
                    <AccordionItem value="faq" className="border-b-2 border-gray-200 bg-white">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <HelpCircle className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">FAQ</h3>
                                    <p className="text-sm text-muted-foreground">Frequently asked questions</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Section Title</Label>
                                        <Input
                                            value={config.faq_title}
                                            onChange={(e) => setConfig({ ...config, faq_title: e.target.value })}
                                            placeholder="Frequently Asked Questions"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Section Subtitle</Label>
                                        <Input
                                            value={config.faq_subtitle}
                                            onChange={(e) => setConfig({ ...config, faq_subtitle: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label>FAQ Items</Label>
                                    {(config.faq_items || []).map((faq: any, index: number) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-xs font-medium text-muted-foreground bg-white px-2 py-1 rounded">Q{index + 1}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                                    onClick={() => {
                                                        const newItems = [...config.faq_items]
                                                        newItems.splice(index, 1)
                                                        setConfig({ ...config, faq_items: newItems })
                                                    }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <Input
                                                value={faq.question}
                                                onChange={(e) => {
                                                    const newItems = [...config.faq_items]
                                                    newItems[index].question = e.target.value
                                                    setConfig({ ...config, faq_items: newItems })
                                                }}
                                                placeholder="Question"
                                                className={inputClasses}
                                            />
                                            <Textarea
                                                value={faq.answer}
                                                onChange={(e) => {
                                                    const newItems = [...config.faq_items]
                                                    newItems[index].answer = e.target.value
                                                    setConfig({ ...config, faq_items: newItems })
                                                }}
                                                placeholder="Answer"
                                                className={cn(inputClasses, "min-h-[60px]")}
                                            />
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full border-dashed"
                                        onClick={() => {
                                            setConfig({
                                                ...config,
                                                faq_items: [...(config.faq_items || []), { question: '', answer: '' }]
                                            })
                                        }}
                                    >
                                        + Add FAQ Item
                                    </Button>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Chat / AI */}
                    <AccordionItem value="chat" className="border-b-2 border-gray-200 bg-gray-50/50">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <MessageSquare className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">Chat / AI Assistant</h3>
                                    <p className="text-sm text-muted-foreground">Virtual assistant settings</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <Label>Enable Chat</Label>
                                    <Switch
                                        checked={config.chat_enabled}
                                        onCheckedChange={(checked) => setConfig({ ...config, chat_enabled: checked })}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>AI Name</Label>
                                        <Input
                                            value={config.ai_name}
                                            onChange={(e) => setConfig({ ...config, ai_name: e.target.value })}
                                            placeholder="Carol"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Avatar URL</Label>
                                        <Input
                                            value={config.ai_avatar}
                                            onChange={(e) => setConfig({ ...config, ai_avatar: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Greeting Message</Label>
                                    <Textarea
                                        value={config.ai_greeting}
                                        onChange={(e) => setConfig({ ...config, ai_greeting: e.target.value })}
                                        className={cn(inputClasses, "min-h-[80px]")}
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* SEO */}
                    <AccordionItem value="seo" className="bg-white">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <Search className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">SEO Settings</h3>
                                    <p className="text-sm text-muted-foreground">Search engine optimization</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label>Page Title</Label>
                                    <Input
                                        value={config.seo_title}
                                        onChange={(e) => setConfig({ ...config, seo_title: e.target.value })}
                                        className={inputClasses}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Meta Description</Label>
                                    <Textarea
                                        value={config.seo_description}
                                        onChange={(e) => setConfig({ ...config, seo_description: e.target.value })}
                                        className={cn(inputClasses, "min-h-[80px]")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Keywords</Label>
                                    <Input
                                        value={config.seo_keywords}
                                        onChange={(e) => setConfig({ ...config, seo_keywords: e.target.value })}
                                        placeholder="house cleaning, cleaning service, ..."
                                        className={inputClasses}
                                    />
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            {/* Floating Save Button (Mobile) */}
            <div className="fixed bottom-4 right-4 sm:hidden">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="lg"
                    className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600 shadow-lg"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                </Button>
            </div>
        </div>
    )
}
