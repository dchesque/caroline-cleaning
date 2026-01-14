'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
    MapPin,
    Briefcase,
    Users,
    Save,
    Loader2,
    Phone,
    Mail,
    Globe,
    DollarSign,
    Package
} from 'lucide-react'
import { toast } from 'sonner'
import { useAdminI18n } from '@/lib/admin-i18n/context'

export default function ConfiguracoesPage() {
    const { t } = useAdminI18n()
    const settingsT = t('settings')
    const common = t('common')
    const [isLoading, setIsLoading] = useState(false)
    const [config, setConfig] = useState({
        // Business Info
        business_name: 'Caroline Premium Cleaning',
        business_phone: '(551) 389-7394',
        business_email: 'hello@carolinecleaning.com',
        business_address: '123 Ocean Drive, Miami, FL 33139',
        business_website: 'www.carolinecleaning.com',

        // Operating Hours
        operating_start: '08:00',
        operating_end: '18:00',
        operating_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],

        // Notifications
        notify_new_booking: true,
        notify_cancellation: true,
        notify_reminder: true,
        reminder_hours: 24,

        // Booking Settings
        min_booking_notice: 24,
        max_booking_advance: 30,
        default_duration: 180,
    })

    const supabase = createClient()

    useEffect(() => {
        // Load config from database
        const loadConfig = async () => {
            const { data } = await supabase
                .from('configuracoes')
                .select('*')
                .single()

            if (data) {
                setConfig(prev => ({ ...prev, ...data.settings }))
            }
        }
        loadConfig()
    }, [])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('configuracoes')
                .upsert({
                    id: 1,
                    settings: config,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error
            toast.success(common.save)
        } catch (error) {
            console.error('Error saving config:', error)
            toast.error(common.error)
        } finally {
            setIsLoading(false)
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
                    <TabsTrigger value="notificacoes">{settingsT.tabs.notifications}</TabsTrigger>
                    <TabsTrigger value="agendamento">{settingsT.tabs.booking}</TabsTrigger>
                </TabsList>

                {/* Company Info */}
                <TabsContent value="empresa">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                {settingsT.company.title}
                            </CardTitle>
                            <CardDescription>
                                {settingsT.company.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{settingsT.company.name}</Label>
                                    <Input
                                        value={config.business_name}
                                        onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{settingsT.company.phone}</Label>
                                    <Input
                                        value={config.business_phone}
                                        onChange={(e) => setConfig({ ...config, business_phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{settingsT.company.email}</Label>
                                    <Input
                                        type="email"
                                        value={config.business_email}
                                        onChange={(e) => setConfig({ ...config, business_email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{settingsT.company.website}</Label>
                                    <Input
                                        value={config.business_website}
                                        onChange={(e) => setConfig({ ...config, business_website: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{settingsT.company.address}</Label>
                                <Input
                                    value={config.business_address}
                                    onChange={(e) => setConfig({ ...config, business_address: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Links */}
                    <div className="grid sm:grid-cols-3 gap-4 mt-6">


                        <Card className="hover:shadow-md transition-shadow">
                            <Link href="/admin/configuracoes/addons">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-brandy-rose-100 rounded-lg">
                                            <Package className="w-5 h-5 text-brandy-rose-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{settingsT.company.addons}</p>
                                            <p className="text-caption text-muted-foreground">{settingsT.company.addonsDesc}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>

                        <Card className="hover:shadow-md transition-shadow">
                            <Link href="/admin/configuracoes/areas">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-success/10 rounded-lg">
                                            <MapPin className="w-5 h-5 text-success" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{settingsT.company.areas}</p>
                                            <p className="text-caption text-muted-foreground">{settingsT.company.areasDesc}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>

                        <Card className="hover:shadow-md transition-shadow">
                            <Link href="/admin/equipe">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-warning/10 rounded-lg">
                                            <Users className="w-5 h-5 text-warning" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{settingsT.company.team}</p>
                                            <p className="text-caption text-muted-foreground">{settingsT.company.teamDesc}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>

                        <Card className="hover:shadow-md transition-shadow">
                            <Link href="/admin/configuracoes/pricing">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-brandy-rose-100 rounded-lg">
                                            <DollarSign className="w-5 h-5 text-brandy-rose-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{settingsT.company.pricing}</p>
                                            <p className="text-caption text-muted-foreground">{settingsT.company.pricingDesc}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    </div>
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
                                                    ? config.operating_days.filter(d => d !== day.value)
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
