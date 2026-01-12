// app/(admin)/admin/analytics/clientes/page.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Construction, Users, TrendingUp, UserCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ClientesAnalyticsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/analytics">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="font-heading text-h2 text-foreground">Analytics de Clientes</h1>
                    <p className="text-body text-muted-foreground">
                        Em breve: Insights profundos sobre sua base de clientes
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 text-center py-12">
                <div className="relative">
                    <div className="p-6 bg-brandy-rose-100 rounded-full">
                        <Users className="w-12 h-12 text-brandy-rose-600" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-sm">
                        <Construction className="w-5 h-5 text-warning" />
                    </div>
                </div>

                <div className="max-w-md space-y-4">
                    <h2 className="font-heading text-h3 text-foreground">Painel de Retenção & Performance</h2>
                    <p className="text-body text-muted-foreground">
                        Estamos processando os dados históricos para gerar relatórios de LTV, Churn e Segmentação.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 w-full max-w-2xl pt-8">
                    <Card className="bg-white/50 border-dashed">
                        <CardHeader className="pb-2">
                            <TrendingUp className="w-8 h-8 text-brandy-rose-400 mx-auto mb-2" />
                            <CardTitle className="text-sm">Ciclo de Vida (LTV)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">Acompanhe quanto cada cliente gera de valor ao longo do tempo.</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/50 border-dashed">
                        <CardHeader className="pb-2">
                            <UserCheck className="w-8 h-8 text-brandy-rose-400 mx-auto mb-2" />
                            <CardTitle className="text-sm">Segmentação Inteligente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">Identifique automaticamente clientes VIP e em risco.</p>
                        </CardContent>
                    </Card>
                </div>

                <Button asChild variant="outline" className="mt-8 border-brandy-rose-200 text-brandy-rose-700 hover:bg-brandy-rose-50">
                    <Link href="/admin/analytics" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Analytics
                    </Link>
                </Button>
            </div>
        </div>
    )
}
