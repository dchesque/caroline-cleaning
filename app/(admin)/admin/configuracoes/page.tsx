'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
    Building2,
    Save,
    Loader2,
    Phone,
    Laptop,
    Share2,
    MessageSquareMore,
    Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { AreasTab } from '@/components/admin/config/areas-tab'
import { PricingTab } from '@/components/admin/config/pricing-tab'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { getBusinessSettingsClient, saveBusinessSettings, DEFAULT_SETTINGS } from '@/lib/business-config'

export default function ConfiguracoesPage() {
    const { t } = useAdminI18n()
    const settingsT = t('settings')
    const common = t('common')
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [config, setConfig] = useState<any>(DEFAULT_SETTINGS)

    const supabase = createClient()

    useEffect(() => {
        // Load config from database
        const loadConfig = async () => {
            const settings = await getBusinessSettingsClient()
            if (settings) {
                setConfig(settings)
            }
        }
        loadConfig()
    }, [])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            await saveBusinessSettings(config)
            toast.success(common.save)
        } catch (error) {
            console.error('Error saving config:', error)
            toast.error(common.error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `logo-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('company-assets')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('company-assets')
                .getPublicUrl(filePath)

            setConfig((prev: any) => ({ ...prev, business_logo: publicUrl }))
            toast.success('Logo uploaded successfully')
        } catch (error) {
            console.error('Error uploading logo:', error)
            toast.error('Error uploading logo')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-h2 text-foreground">{settingsT.title}</h1>
                    <p className="text-body text-muted-foreground">
                        {settingsT.subtitle}
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isLoading} className="gap-2">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {settingsT.saveChanges}
                </Button>
            </div>

            <Tabs defaultValue="empresa" className="space-y-6">
                <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="empresa">{settingsT.tabs.company}</TabsTrigger>
                    <TabsTrigger value="horarios">{settingsT.tabs.hours}</TabsTrigger>
                    <TabsTrigger value="areas">{settingsT.company.areas}</TabsTrigger>
                    <TabsTrigger value="pricing">{settingsT.company.pricing}</TabsTrigger>
                    <TabsTrigger value="notificacoes">{settingsT.tabs.notifications}</TabsTrigger>
                    <TabsTrigger value="agendamento">{settingsT.tabs.booking}</TabsTrigger>
                </TabsList>

                {/* Company Info */}
                <TabsContent value="empresa" className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Identidade e Contato */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-brandy-rose-600" />
                                    {settingsT.company.title}
                                </CardTitle>
                                <CardDescription>
                                    {settingsT.company.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{settingsT.company.name}</Label>
                                    <Input
                                        className="bg-white border-input shadow-sm"
                                        value={config.business_name}
                                        onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{settingsT.company.logo}</Label>
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1 space-y-2">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                className="bg-white border-input shadow-sm cursor-pointer"
                                                onChange={handleLogoUpload}
                                                disabled={isUploading}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {settingsT.company.logoDimensions}
                                            </p>
                                        </div>
                                        {isUploading ? (
                                            <div className="w-20 h-10 flex items-center justify-center border border-pampas rounded bg-white">
                                                <Loader2 className="w-5 h-5 animate-spin text-brandy-rose-500" />
                                            </div>
                                        ) : config.business_logo ? (
                                            <div className="relative group">
                                                <div className="w-20 h-10 relative rounded border border-pampas overflow-hidden shrink-0 bg-white">
                                                    <img
                                                        src={config.business_logo}
                                                        alt="Logo Preview"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setConfig({ ...config, business_logo: '' })}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                    title={settingsT.company?.removeLogo || "Remove Logo"}
                                                    type="button"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{settingsT.company.phone} (WhatsApp/SMS)</Label>
                                        <Input
                                            className="bg-white border-input shadow-sm"
                                            value={config.business_phone}
                                            onChange={(e) => setConfig({ ...config, business_phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{settingsT.company.phoneDisplay}</Label>
                                        <Input
                                            className="bg-white border-input shadow-sm"
                                            value={config.business_phone_display}
                                            onChange={(e) => setConfig({ ...config, business_phone_display: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{settingsT.company.email}</Label>
                                        <Input
                                            className="bg-white border-input shadow-sm"
                                            type="email"
                                            value={config.business_email}
                                            onChange={(e) => setConfig({ ...config, business_email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{settingsT.company.website}</Label>
                                        <Input
                                            className="bg-white border-input shadow-sm"
                                            value={config.business_website}
                                            onChange={(e) => setConfig({ ...config, business_website: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{settingsT.company.address}</Label>
                                    <Input
                                        className="bg-white border-input shadow-sm"
                                        value={config.business_address}
                                        onChange={(e) => setConfig({ ...config, business_address: e.target.value })}
                                    />
                                </div>
                                <div className="pt-4 border-t border-pampas">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <MessageSquareMore className="w-4 h-4 text-brandy-rose-500" />
                                            {settingsT.company.botName}
                                        </Label>
                                        <Input
                                            className="bg-white border-input shadow-sm"
                                            value={config.chat_bot_name}
                                            onChange={(e) => setConfig({ ...config, chat_bot_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            {/* Hero & Announcement */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Laptop className="w-5 h-5 text-brandy-rose-600" />
                                        Hero & Announcement
                                    </CardTitle>
                                    <CardDescription>
                                        Customization of the top bar and hero section
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>{settingsT.company?.announcement}</Label>
                                        <Input
                                            className="bg-white border-input shadow-sm"
                                            value={config.announcement_text}
                                            onChange={(e) => setConfig({ ...config, announcement_text: e.target.value })}
                                            placeholder="Serving Charlotte, NC..."
                                        />
                                        <p className="text-xs text-muted-foreground">{settingsT.company?.announcementDesc}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{settingsT.company.heroTitle1}</Label>
                                        <Input
                                            className="bg-white border-input shadow-sm"
                                            value={config.hero_title_1}
                                            onChange={(e) => setConfig({ ...config, hero_title_1: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{settingsT.company.heroTitle2}</Label>
                                        <Input
                                            className="bg-white border-input shadow-sm"
                                            value={config.hero_title_2}
                                            onChange={(e) => setConfig({ ...config, hero_title_2: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{settingsT.company.heroSubtitle}</Label>
                                        <Textarea
                                            className="bg-white border-input shadow-sm resize-none rounded-lg border-pampas-300 focus:border-brandy-rose-500 focus:ring-brandy-rose-500 min-h-[100px]"
                                            value={config.hero_subtitle}
                                            onChange={(e) => setConfig({ ...config, hero_subtitle: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{settingsT.company.heroCta}</Label>
                                        <Input
                                            className="bg-white border-input shadow-sm"
                                            value={config.hero_cta_text}
                                            onChange={(e) => setConfig({ ...config, hero_cta_text: e.target.value })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Rodapé e Redes Sociais */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Share2 className="w-5 h-5 text-brandy-rose-600" />
                                        {settingsT.company.socialFacebook.split(' ')[0]}
                                    </CardTitle>
                                    <CardDescription>
                                        Configure as informações do rodapé e redes sociais
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>{settingsT.company.footerDescription}</Label>
                                        <Textarea
                                            className="bg-white border-input shadow-sm resize-none rounded-lg border-pampas-300 focus:border-brandy-rose-500 focus:ring-brandy-rose-500 min-h-[80px]"
                                            value={config.business_description}
                                            onChange={(e) => setConfig({ ...config, business_description: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">{settingsT.company.socialFacebook}</Label>
                                            <Input
                                                className="h-8 text-xs bg-white border-input shadow-sm"
                                                size={1}
                                                value={config.social_facebook}
                                                onChange={(e) => setConfig({ ...config, social_facebook: e.target.value })}
                                                placeholder="https://facebook.com/..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">{settingsT.company.socialInstagram}</Label>
                                            <Input
                                                className="h-8 text-xs bg-white border-input shadow-sm"
                                                size={1}
                                                value={config.social_instagram}
                                                onChange={(e) => setConfig({ ...config, social_instagram: e.target.value })}
                                                placeholder="https://instagram.com/..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">{settingsT.company.socialTwitter}</Label>
                                            <Input
                                                className="h-8 text-xs bg-white border-input shadow-sm"
                                                size={1}
                                                value={config.social_twitter}
                                                onChange={(e) => setConfig({ ...config, social_twitter: e.target.value })}
                                                placeholder="https://twitter.com/..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">{settingsT.company.socialGoogle}</Label>
                                            <Input
                                                className="h-8 text-xs bg-white border-input shadow-sm"
                                                size={1}
                                                value={config.social_google}
                                                onChange={(e) => setConfig({ ...config, social_google: e.target.value })}
                                                placeholder="https://g.page/..."
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="areas">
                    <AreasTab />
                </TabsContent>

                <TabsContent value="pricing">
                    <PricingTab />
                </TabsContent>

                {/* Operating Hours */}
                <TabsContent value="horarios">
                    <Card>
                        <CardHeader>
                            <CardTitle>{settingsT.hours.title}</CardTitle>
                            <CardDescription>
                                {settingsT.hours.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{settingsT.hours.start}</Label>
                                    <Input
                                        type="time"
                                        value={config.operating_start}
                                        onChange={(e) => setConfig({ ...config, operating_start: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{settingsT.hours.end}</Label>
                                    <Input
                                        type="time"
                                        value={config.operating_end}
                                        onChange={(e) => setConfig({ ...config, operating_end: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>{settingsT.hours.days}</Label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: 'monday', label: settingsT.hours.mon },
                                        { value: 'tuesday', label: settingsT.hours.tue },
                                        { value: 'wednesday', label: settingsT.hours.wed },
                                        { value: 'thursday', label: settingsT.hours.thu },
                                        { value: 'friday', label: settingsT.hours.fri },
                                        { value: 'saturday', label: settingsT.hours.sat },
                                        { value: 'sunday', label: settingsT.hours.sun },
                                    ].map((day) => (
                                        <Button
                                            key={day.value}
                                            variant={config.operating_days.includes(day.value) ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => {
                                                const days = config.operating_days.includes(day.value)
                                                    ? config.operating_days.filter((d: string) => d !== day.value)
                                                    : [...config.operating_days, day.value]
                                                setConfig({ ...config, operating_days: days })
                                            }}
                                        >
                                            {day.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications */}
                <TabsContent value="notificacoes">
                    <Card>
                        <CardHeader>
                            <CardTitle>{settingsT.notifications.title}</CardTitle>
                            <CardDescription>
                                {settingsT.notifications.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{settingsT.notifications.newBooking}</p>
                                    <p className="text-caption text-muted-foreground">
                                        {settingsT.notifications.newBookingDesc}
                                    </p>
                                </div>
                                <Switch
                                    checked={config.notify_new_booking}
                                    onCheckedChange={(checked) =>
                                        setConfig({ ...config, notify_new_booking: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{settingsT.notifications.cancellations}</p>
                                    <p className="text-caption text-muted-foreground">
                                        {settingsT.notifications.cancellationsDesc}
                                    </p>
                                </div>
                                <Switch
                                    checked={config.notify_cancellation}
                                    onCheckedChange={(checked) =>
                                        setConfig({ ...config, notify_cancellation: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{settingsT.notifications.reminders}</p>
                                    <p className="text-caption text-muted-foreground">
                                        {settingsT.notifications.remindersDesc}
                                    </p>
                                </div>
                                <Switch
                                    checked={config.notify_reminder}
                                    onCheckedChange={(checked) =>
                                        setConfig({ ...config, notify_reminder: checked })
                                    }
                                />
                            </div>

                            {config.notify_reminder && (
                                <div className="space-y-2 pl-4 border-l-2 border-pampas">
                                    <Label>{settingsT.notifications.hoursNotice}</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="72"
                                        value={config.reminder_hours}
                                        onChange={(e) => setConfig({ ...config, reminder_hours: parseInt(e.target.value) })}
                                        className="w-32"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Booking Settings */}
                <TabsContent value="agendamento">
                    <Card>
                        <CardHeader>
                            <CardTitle>{settingsT.booking.title}</CardTitle>
                            <CardDescription>
                                {settingsT.booking.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{settingsT.booking.minNotice}</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={config.min_booking_notice}
                                        onChange={(e) => setConfig({ ...config, min_booking_notice: parseInt(e.target.value) })}
                                    />
                                    <p className="text-caption text-muted-foreground">
                                        {settingsT.booking.minNoticeDesc}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>{settingsT.booking.maxAdvance}</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={config.max_booking_advance}
                                        onChange={(e) => setConfig({ ...config, max_booking_advance: parseInt(e.target.value) })}
                                    />
                                    <p className="text-caption text-muted-foreground">
                                        {settingsT.booking.maxAdvanceDesc}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{settingsT.booking.defaultDuration}</Label>
                                <Input
                                    type="number"
                                    min="60"
                                    step="30"
                                    value={config.default_duration}
                                    onChange={(e) => setConfig({ ...config, default_duration: parseInt(e.target.value) })}
                                    className="w-32"
                                />
                                <p className="text-caption text-muted-foreground">
                                    {settingsT.booking.defaultDurationDesc}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
