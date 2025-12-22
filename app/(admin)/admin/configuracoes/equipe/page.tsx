'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Users,
    ShieldCheck,
    Mail,
    CalendarDays,
    Briefcase
} from 'lucide-react'

export default function EquipePage() {
    const [user, setUser] = useState<any>(null)

    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()
    }, [])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/configuracoes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="font-heading text-2xl font-bold text-foreground">
                        Gerenciamento de Equipe
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Controle de acesso e membros do time
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Current Operator Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            Operador Atual
                        </CardTitle>
                        <CardDescription>
                            Você está logado como administrador principal
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="w-16 h-16 border-2 border-primary/10">
                                <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                                    {user?.email?.substring(0, 2).toUpperCase() || 'AD'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">Administrador</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="w-4 h-4" />
                                    {user?.email || 'carregando...'}
                                </div>
                                <Badge variant="secondary" className="mt-1">
                                    Acesso Total
                                </Badge>
                            </div>
                        </div>

                        <div className="border-t pt-4 space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground">Privilégios Ativos</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                                    Gerenciamento de Agendamentos
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                                    Configurações do Sistema
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                                    Controle Financeiro
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Coming Soon Placeholder */}
                <Card className="bg-muted/30 border-dashed relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
                    <CardContent className="flex flex-col items-center justify-center text-center h-full py-12 space-y-4 relative">
                        <div className="w-16 h-16 rounded-full bg-background shadow-sm flex items-center justify-center mb-2">
                            <Users className="w-8 h-8 text-muted-foreground/50" />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-foreground">Em Breve</h3>
                            <p className="text-muted-foreground max-w-[280px] mx-auto mt-2">
                                O módulo completo de gestão de equipe estará disponível nas próximas atualizações.
                            </p>
                        </div>

                        <div className="bg-background/80 backdrop-blur-sm p-4 rounded-lg text-left text-sm text-muted-foreground max-w-xs border shadow-sm">
                            <p className="font-medium text-foreground mb-2">Futuras Funcionalidades:</p>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2">
                                    <Briefcase className="w-3 h-3" />
                                    Cadastro de funcionários
                                </li>
                                <li className="flex items-center gap-2">
                                    <CalendarDays className="w-3 h-3" />
                                    Calendário individual por membro
                                </li>
                                <li className="flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3" />
                                    Níveis de permissão customizados
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
