'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Cog,
    Save,
    Loader2,
    ChevronLeft,
    Clock,
    CalendarCheck,
    Bell,
    BadgeInfo,
    Smartphone,
    Mail,
    Users,
    DollarSign,
    ShieldCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { getBusinessSettingsByGrupo, saveBusinessSettings, DEFAULT_SETTINGS } from '@/lib/business-config'
import { ConfigLinkCard } from '@/components/admin/config-link-card'

export default function SistemaConfigPage() {
    const { t } = useAdminI18n()
    const settingsT = t('settings')
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [config, setConfig] = useState<any>(DEFAULT_SETTINGS)

    useEffect(() => {
        const loadConfig = async () => {
            setIsLoading(true)
            const data = await getBusinessSettingsByGrupo('sistema')
            setConfig((prev: any) => ({ ...prev, ...data }))
            setIsLoading(false)
        }
        loadConfig()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await saveBusinessSettings(config, 'sistema')
            toast.success(settingsT.saved)
        } catch (error) {
            console.error('Error saving system config:', error)
            toast.error(settingsT.error)
        } finally {
            setIsSaving(false)
        }
    }

    const toggleDay = (day: string) => {
        const currentDays = config.operating_days || []
        const newDays = currentDays.includes(day)
            ? currentDays.filter((d: string) => d !== day)
            : [...currentDays, day]
        setConfig({ ...config, operating_days: newDays })
    }

    const days = [
        { id: 'monday', label: settingsT.system.days.monday },
        { id: 'tuesday', label: settingsT.system.days.tuesday },
        { id: 'wednesday', label: settingsT.system.days.wednesday },
        { id: 'thursday', label: settingsT.system.days.thursday },
        { id: 'friday', label: settingsT.system.days.friday },
        { id: 'saturday', label: settingsT.system.days.saturday },
        { id: 'sunday', label: settingsT.system.days.sunday },
    ]

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
                        <h1 className="font-heading text-2xl text-foreground">{settingsT.system.title}</h1>
                        <p className="text-sm text-muted-foreground">{settingsT.system.subtitle}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600 shadow-sm">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {settingsT.saveChanges}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Horários de Operação */}
                <Card className="shadow-sm border-gray-100 bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                            <Clock className="w-5 h-5 text-brandy-rose-500" />
                            {settingsT.system.sections.hours}
                        </CardTitle>
                        <CardDescription className="text-gray-500">{settingsT.system.sections.hoursDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">{settingsT.system.fields.operatingStart}</Label>
                                <Input
                                    type="time"
                                    value={config.operating_start}
                                    onChange={(e) => setConfig({ ...config, operating_start: e.target.value })}
                                    className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">{settingsT.system.fields.operatingEnd}</Label>
                                <Input
                                    type="time"
                                    value={config.operating_end}
                                    onChange={(e) => setConfig({ ...config, operating_end: e.target.value })}
                                    className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-gray-700">{settingsT.system.fields.operatingDays}</Label>
                            <div className="flex flex-wrap gap-2">
                                {days.map((day) => {
                                    const active = config.operating_days?.includes(day.id)
                                    return (
                                        <Button
                                            key={day.id}
                                            variant={active ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => toggleDay(day.id)}
                                            className={cn(
                                                "h-8 px-3 text-[10px] font-semibold transition-all shadow-sm",
                                                active ? "bg-brandy-rose-500 hover:bg-brandy-rose-600 border-transparent text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                            )}
                                        >
                                            {day.label}
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Regras de Agendamento */}
                <Card className="shadow-sm border-gray-100 bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                            <CalendarCheck className="w-5 h-5 text-brandy-rose-500" />
                            {settingsT.system.sections.booking}
                        </CardTitle>
                        <CardDescription className="text-gray-500">{settingsT.system.sections.bookingDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">{settingsT.system.fields.bookingMinNotice}</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={config.booking_min_notice_hours}
                                        onChange={(e) => setConfig({ ...config, booking_min_notice_hours: parseInt(e.target.value) })}
                                        className="w-24 bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                    <span className="text-xs text-muted-foreground font-medium">hours</span>
                                </div>
                                <p className="text-[10px] text-gray-400">{settingsT.system.fields.bookingMinNoticeHelp}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">{settingsT.system.fields.bookingMaxAdvance}</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={config.booking_max_advance_days}
                                        onChange={(e) => setConfig({ ...config, booking_max_advance_days: parseInt(e.target.value) })}
                                        className="w-24 bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                    <span className="text-xs text-muted-foreground font-medium">days</span>
                                </div>
                                <p className="text-[10px] text-gray-400">{settingsT.system.fields.bookingMaxAdvanceHelp}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-gray-700">{settingsT.system.fields.bookingDefaultDuration}</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        step="15"
                                        value={config.booking_default_duration}
                                        onChange={(e) => setConfig({ ...config, booking_default_duration: parseInt(e.target.value) })}
                                        className="w-24 bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                    <span className="text-xs text-muted-foreground font-medium">min</span>
                                </div>
                                <p className="text-[10px] text-gray-400">{settingsT.system.fields.bookingDefaultDurationHelp}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-700">{settingsT.system.fields.bookingBuffer}</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        step="5"
                                        value={config.booking_buffer_minutes}
                                        onChange={(e) => setConfig({ ...config, booking_buffer_minutes: parseInt(e.target.value) })}
                                        className="w-24 bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                                    />
                                    <span className="text-xs text-muted-foreground font-medium">min</span>
                                </div>
                                <p className="text-[10px] text-gray-400">{settingsT.system.fields.bookingBufferHelp}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notificações */}
                <Card className="shadow-sm border-gray-100 bg-white lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                            <Bell className="w-5 h-5 text-brandy-rose-500" />
                            {settingsT.system.sections.notifications}
                        </CardTitle>
                        <CardDescription className="text-gray-500">{settingsT.system.sections.notificationsDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                    <BadgeInfo className="w-3 h-3" />
                                    {settingsT.system.fields.automatedAlerts}
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-gray-100 transition-all">
                                        <div className="space-y-0.5">
                                            <Label className="text-gray-700 cursor-pointer">{settingsT.system.fields.notificationNewBooking}</Label>
                                            <p className="text-[10px] text-muted-foreground">{settingsT.system.fields.notificationNewBookingDesc}</p>
                                        </div>
                                        <Switch
                                            checked={config.notification_new_booking}
                                            onCheckedChange={(val) => setConfig({ ...config, notification_new_booking: val })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-gray-100 transition-all">
                                        <div className="space-y-0.5">
                                            <Label className="text-gray-700 cursor-pointer">{settingsT.system.fields.notificationCancellation}</Label>
                                            <p className="text-[10px] text-muted-foreground">{settingsT.system.fields.notificationCancellationDesc}</p>
                                        </div>
                                        <Switch
                                            checked={config.notification_cancellation}
                                            onCheckedChange={(val) => setConfig({ ...config, notification_cancellation: val })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-gray-100 transition-all">
                                        <div className="space-y-0.5">
                                            <Label className="text-gray-700 cursor-pointer">{settingsT.system.fields.notificationReminder24h}</Label>
                                            <p className="text-[10px] text-muted-foreground">{settingsT.system.fields.notificationReminder24hDesc}</p>
                                        </div>
                                        <Switch
                                            checked={config.notification_reminder_24h}
                                            onCheckedChange={(val) => setConfig({ ...config, notification_reminder_24h: val })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-50 bg-gray-50/30 hover:bg-white hover:border-gray-100 transition-all">
                                        <div className="space-y-0.5">
                                            <Label className="text-gray-700 cursor-pointer">{settingsT.system.fields.notificationReminder2h}</Label>
                                            <p className="text-[10px] text-muted-foreground">{settingsT.system.fields.notificationReminder2hDesc}</p>
                                        </div>
                                        <Switch
                                            checked={config.notification_reminder_2h}
                                            onCheckedChange={(val) => setConfig({ ...config, notification_reminder_2h: val })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                    <Smartphone className="w-3 h-3" />
                                    {settingsT.system.fields.communicationChannels}
                                </h4>
                                <div className="space-y-4 p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
                                    <div className="flex items-start space-x-3 group">
                                        <div className="pt-0.5">
                                            <Checkbox
                                                id="sms-channel"
                                                checked={config.notification_channel_sms}
                                                onCheckedChange={(val) => setConfig({ ...config, notification_channel_sms: !!val })}
                                                className="border-gray-300 data-[state=checked]:bg-brandy-rose-500 data-[state=checked]:border-brandy-rose-500"
                                            />
                                        </div>
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="sms-channel" className="text-sm font-semibold text-gray-800 leading-none cursor-pointer group-hover:text-brandy-rose-600 transition-colors">
                                                {settingsT.system.fields.notificationChannelSms}
                                            </Label>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {settingsT.system.fields.notificationChannelSmsDesc}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-gray-100"></div>
                                    <div className="flex items-start space-x-3 group">
                                        <div className="pt-0.5">
                                            <Checkbox
                                                id="email-channel"
                                                checked={config.notification_channel_email}
                                                onCheckedChange={(val) => setConfig({ ...config, notification_channel_email: !!val })}
                                                className="border-gray-300 data-[state=checked]:bg-brandy-rose-500 data-[state=checked]:border-brandy-rose-500"
                                            />
                                        </div>
                                        <div className="grid gap-1.5 leading-none">
                                            <Label htmlFor="email-channel" className="text-sm font-semibold text-gray-800 leading-none cursor-pointer group-hover:text-brandy-rose-600 transition-colors">
                                                {settingsT.system.fields.notificationChannelEmail}
                                            </Label>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {settingsT.system.fields.notificationChannelEmailDesc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-brandy-rose-50/50 border border-brandy-rose-100 flex gap-3">
                                    <BadgeInfo className="w-5 h-5 text-brandy-rose-500 shrink-0" />
                                    <p className="text-[11px] text-brandy-rose-800 leading-relaxed">
                                        {settingsT.tracking.tips.tip2}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Links Relacionados */}
            <div className="pt-10 border-t border-gray-100">
                <h2 className="text-xl font-heading font-semibold mb-6 text-gray-900">{settingsT.system.relatedLinks.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ConfigLinkCard
                        href="/admin/equipe"
                        icon={Users}
                        title={settingsT.system.relatedLinks.team}
                        description={settingsT.system.relatedLinks.teamDesc}
                        className="py-6 bg-white border-gray-200"
                    />
                    <ConfigLinkCard
                        href="/admin/financeiro"
                        icon={DollarSign}
                        title={settingsT.system.relatedLinks.pricing}
                        description={settingsT.system.relatedLinks.pricingDesc}
                        className="py-6 bg-white border-gray-200"
                    />
                    <ConfigLinkCard
                        href="/admin/agenda"
                        icon={ShieldCheck}
                        title={settingsT.system.relatedLinks.policies}
                        description={settingsT.system.relatedLinks.policiesDesc}
                        className="py-6 bg-white border-gray-200"
                    />
                </div>
            </div>
        </div>
    )
}


