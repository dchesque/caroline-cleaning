'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Construction, Users, Shield, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function EquipeConfigPage() {
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
                    <h1 className="font-heading text-h2 text-foreground">Configurações de Equipe</h1>
                    <p className="text-body text-muted-foreground">
                        Em breve: Gerencie permissões e horários da sua equipe
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 text-center py-12">
                <div className="p-6 bg-warning/10 rounded-full animate-pulse">
                    <Construction className="w-12 h-12 text-warning" />
                </div>

                <div className="max-w-md space-y-4">
                    <h2 className="font-heading text-h3 text-foreground">Módulo em Desenvolvimento</h2>
                    <p className="text-body text-muted-foreground">
                        Estamos preparando uma interface completa para você gerenciar sua equipe com máxima eficiência.
                    </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-6 w-full max-w-4xl pt-8">
                    <Card className="bg-white/50 border-dashed">
                        <CardHeader className="pb-2">
                            <Shield className="w-8 h-8 text-brandy-rose-400 mx-auto mb-2" />
                            <CardTitle className="text-sm">Permissões</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">Controle de acesso granular por cargo.</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/50 border-dashed">
                        <CardHeader className="pb-2">
                            <Clock className="w-8 h-8 text-brandy-rose-400 mx-auto mb-2" />
                            <CardTitle className="text-sm">Escalas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">Definição de horários individuais e folgas.</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/50 border-dashed">
                        <CardHeader className="pb-2">
                            <Users className="w-8 h-8 text-brandy-rose-400 mx-auto mb-2" />
                            <CardTitle className="text-sm">Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">Métricas de produtividade e avaliações.</p>
                        </CardContent>
                    </Card>
                </div>

                <Button asChild className="mt-8">
                    <Link href="/admin/configuracoes" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Configurações
                    </Link>
                </Button>
            </div>
        </div>
    )
}
