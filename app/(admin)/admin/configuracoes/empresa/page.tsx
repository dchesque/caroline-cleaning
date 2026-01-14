'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Building2,
    Save,
    Loader2,
    ChevronLeft,
    Upload,
    Trash2,
    Phone,
    Mail,
    Globe,
    MapPin,
    Share2,
    Users,
    Sparkles,
    Map
} from 'lucide-react'
import { toast } from 'sonner'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { getBusinessSettingsByGrupo, saveBusinessSettings, DEFAULT_SETTINGS } from '@/lib/business-config'
import { ConfigLinkCard } from '@/components/admin/config-link-card'

export default function EmpresaConfigPage() {
    const { t } = useAdminI18n()
    const settingsT = t('settings')
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [config, setConfig] = useState<any>(DEFAULT_SETTINGS)

    const supabase = createClient()

    useEffect(() => {
        const loadConfig = async () => {
            setIsLoading(true)
            const data = await getBusinessSettingsByGrupo('empresa')
            setConfig((prev: any) => ({ ...prev, ...data }))
            setIsLoading(false)
        }
        loadConfig()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await saveBusinessSettings(config, 'empresa')
            toast.success(settingsT.saved)
        } catch (error) {
            console.error('Error saving company config:', error)
            toast.error(settingsT.error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `logo-${Math.random()}.${fileExt}`
            const filePath = `logos/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('company-assets')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('company-assets')
                .getPublicUrl(filePath)

            setConfig((prev: any) => ({ ...prev, business_logo: publicUrl }))
            toast.success('Logo uploaded successfuly')
        } catch (error) {
            console.error('Error uploading logo:', error)
            toast.error('Error uploading logo')
        } finally {
            setIsUploading(false)
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
                        <h1 className="font-heading text-2xl text-foreground">{settingsT.company.title}</h1>
                        <p className="text-sm text-muted-foreground">{settingsT.company.subtitle}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {settingsT.saveChanges}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 className="w-5 h-5 text-brandy-rose-500" />
                            {settingsT.company.sections.basicInfo}
                        </CardTitle>
                        <CardDescription>{settingsT.company.sections.basicInfoDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="businessName">{settingsT.company.fields.businessName}</Label>
                            <Input
                                id="businessName"
                                value={config.business_name}
                                onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="businessDescription">{settingsT.company.fields.businessDescription}</Label>
                            <Textarea
                                id="businessDescription"
                                value={config.business_description}
                                onChange={(e) => setConfig({ ...config, business_description: e.target.value })}
                                className="bg-white min-h-[100px]"
                                rows={4}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Marca (Logo) */}
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Sparkles className="w-5 h-5 text-brandy-rose-500" />
                            {settingsT.company.sections.branding}
                        </CardTitle>
                        <CardDescription>{settingsT.company.sections.brandingDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Label>{settingsT.company.fields.businessLogo}</Label>
                        <div className="flex items-center gap-6">
                            <div className="relative w-32 h-32 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden group">
                                {config.business_logo ? (
                                    <>
                                        <img src={config.business_logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                        <button
                                            onClick={() => setConfig({ ...config, business_logo: '' })}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-6 h-6 text-white" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <Building2 className="w-8 h-8" />
                                        <span className="text-[10px]">No Logo</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="logo-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        disabled={isUploading}
                                    />
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full gap-2 cursor-pointer border-brandy-rose-200 hover:bg-brandy-rose-50 hover:text-brandy-rose-600"
                                    >
                                        <label htmlFor="logo-upload">
                                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            {settingsT.company.fields.uploadLogo}
                                        </label>
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Recommended: SVG or Transparent PNG. Max 2MB.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contato */}
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Phone className="w-5 h-5 text-brandy-rose-500" />
                            {settingsT.company.sections.contact}
                        </CardTitle>
                        <CardDescription>{settingsT.company.sections.contactDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    {settingsT.company.fields.businessPhone}
                                </Label>
                                <Input
                                    value={config.business_phone}
                                    onChange={(e) => setConfig({ ...config, business_phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    {settingsT.company.fields.businessPhoneDisplay}
                                </Label>
                                <Input
                                    value={config.business_phone_display}
                                    onChange={(e) => setConfig({ ...config, business_phone_display: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Mail className="w-3 h-3" />
                                    {settingsT.company.fields.businessEmail}
                                </Label>
                                <Input
                                    type="email"
                                    value={config.business_email}
                                    onChange={(e) => setConfig({ ...config, business_email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Globe className="w-3 h-3" />
                                    {settingsT.company.fields.businessWebsite}
                                </Label>
                                <Input
                                    value={config.business_website}
                                    onChange={(e) => setConfig({ ...config, business_website: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <MapPin className="w-3 h-3" />
                                {settingsT.company.fields.businessAddress}
                            </Label>
                            <Input
                                value={config.business_address}
                                onChange={(e) => setConfig({ ...config, business_address: e.target.value })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Redes Sociais */}
                <Card className="shadow-sm border-gray-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Share2 className="w-5 h-5 text-brandy-rose-500" />
                            {settingsT.company.sections.social}
                        </CardTitle>
                        <CardDescription>{settingsT.company.sections.socialDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{settingsT.company.fields.socialFacebook}</Label>
                                <Input
                                    value={config.social_facebook}
                                    onChange={(e) => setConfig({ ...config, social_facebook: e.target.value })}
                                    placeholder="https://facebook.com/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{settingsT.company.fields.socialInstagram}</Label>
                                <Input
                                    value={config.social_instagram}
                                    onChange={(e) => setConfig({ ...config, social_instagram: e.target.value })}
                                    placeholder="https://instagram.com/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{settingsT.company.fields.socialTwitter}</Label>
                                <Input
                                    value={config.social_twitter}
                                    onChange={(e) => setConfig({ ...config, social_twitter: e.target.value })}
                                    placeholder="https://twitter.com/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{settingsT.company.fields.socialGoogle}</Label>
                                <Input
                                    value={config.social_google}
                                    onChange={(e) => setConfig({ ...config, social_google: e.target.value })}
                                    placeholder="https://g.page/..."
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Links Relacionados */}
            <div className="pt-6 border-t border-gray-100">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">{settingsT.company.relatedLinks.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ConfigLinkCard
                        href="/admin/servicos"
                        icon={Sparkles}
                        title={settingsT.company.relatedLinks.services}
                        description={settingsT.company.relatedLinks.servicesDesc}
                        className="py-4"
                    />
                    <ConfigLinkCard
                        href="/admin/equipe"
                        icon={Users}
                        title={settingsT.company.relatedLinks.team}
                        description={settingsT.company.relatedLinks.teamDesc}
                        className="py-4"
                    />
                    <ConfigLinkCard
                        href="/admin/servicos" // Assuming areas fits here or use specific route
                        icon={Map}
                        title={settingsT.company.relatedLinks.areas}
                        description={settingsT.company.relatedLinks.areasDesc}
                        className="py-4"
                    />
                </div>
            </div>
        </div>
    )
}
