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
    Globe
} from 'lucide-react'
import { toast } from 'sonner'

export default function ConfiguracoesPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [config, setConfig] = useState({
        // Business Info
        business_name: 'Caroline Premium Cleaning',
        business_phone: '(305) 555-0123',
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
            toast.success('Configurações salvas!')
        } catch (error) {
            console.error('Error saving config:', error)
            toast.error('Erro ao salvar configurações')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-h2 text-foreground">Configurações</h1>
                    <p className="text-body text-muted-foreground">
                        Gerencie as configurações do sistema
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isLoading} className="gap-2">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Salvar Alterações
                </Button>
            </div>

            <Tabs defaultValue="empresa" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="empresa">Empresa</TabsTrigger>
                    <TabsTrigger value="horarios">Horários</TabsTrigger>
                    <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
                    <TabsTrigger value="agendamento">Agendamento</TabsTrigger>
                </TabsList>

                {/* Company Info */}
                <TabsContent value="empresa">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Informações da Empresa
                            </CardTitle>
                            <CardDescription>
                                Dados básicos que aparecem em contratos e comunicações
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome da Empresa</Label>
                                    <Input
                                        value={config.business_name}
                                        onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefone</Label>
                                    <Input
                                        value={config.business_phone}
                                        onChange={(e) => setConfig({ ...config, business_phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={config.business_email}
                                        onChange={(e) => setConfig({ ...config, business_email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Website</Label>
                                    <Input
                                        value={config.business_website}
                                        onChange={(e) => setConfig({ ...config, business_website: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Endereço</Label>
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
                            <Link href="/admin/configuracoes/servicos">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <Briefcase className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Serviços</p>
                                            <p className="text-caption text-muted-foreground">Gerenciar tipos de serviço</p>
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
                                            <p className="font-semibold">Áreas</p>
                                            <p className="text-caption text-muted-foreground">Regiões atendidas</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>

                        <Card className="hover:shadow-md transition-shadow">
                            <Link href="/admin/configuracoes/equipe">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-warning/10 rounded-lg">
                                            <Users className="w-5 h-5 text-warning" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Equipe</p>
                                            <p className="text-caption text-muted-foreground">Gerenciar membros</p>
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
                            <CardTitle>Horário de Funcionamento</CardTitle>
                            <CardDescription>
                                Defina os horários em que você aceita agendamentos
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Início do Expediente</Label>
                                    <Input
                                        type="time"
                                        value={config.operating_start}
                                        onChange={(e) => setConfig({ ...config, operating_start: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fim do Expediente</Label>
                                    <Input
                                        type="time"
                                        value={config.operating_end}
                                        onChange={(e) => setConfig({ ...config, operating_end: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Dias de Atendimento</Label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: 'monday', label: 'Seg' },
                                        { value: 'tuesday', label: 'Ter' },
                                        { value: 'wednesday', label: 'Qua' },
                                        { value: 'thursday', label: 'Qui' },
                                        { value: 'friday', label: 'Sex' },
                                        { value: 'saturday', label: 'Sáb' },
                                        { value: 'sunday', label: 'Dom' },
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
                            <CardTitle>Notificações</CardTitle>
                            <CardDescription>
                                Configure quando você quer ser notificada
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Novos Agendamentos</p>
                                    <p className="text-caption text-muted-foreground">
                                        Receber notificação quando um novo agendamento for criado
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
                                    <p className="font-medium">Cancelamentos</p>
                                    <p className="text-caption text-muted-foreground">
                                        Receber notificação quando um agendamento for cancelado
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
                                    <p className="font-medium">Lembretes</p>
                                    <p className="text-caption text-muted-foreground">
                                        Receber lembrete antes dos agendamentos
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
                                    <Label>Horas de antecedência</Label>
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
                            <CardTitle>Configurações de Agendamento</CardTitle>
                            <CardDescription>
                                Regras para criação de novos agendamentos
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Antecedência Mínima (horas)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={config.min_booking_notice}
                                        onChange={(e) => setConfig({ ...config, min_booking_notice: parseInt(e.target.value) })}
                                    />
                                    <p className="text-caption text-muted-foreground">
                                        Tempo mínimo antes do serviço para aceitar agendamento
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Agendamento Antecipado (dias)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={config.max_booking_advance}
                                        onChange={(e) => setConfig({ ...config, max_booking_advance: parseInt(e.target.value) })}
                                    />
                                    <p className="text-caption text-muted-foreground">
                                        Máximo de dias no futuro para agendamento
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Duração Padrão (minutos)</Label>
                                <Input
                                    type="number"
                                    min="60"
                                    step="30"
                                    value={config.default_duration}
                                    onChange={(e) => setConfig({ ...config, default_duration: parseInt(e.target.value) })}
                                    className="w-32"
                                />
                                <p className="text-caption text-muted-foreground">
                                    Duração padrão para novos serviços
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
