// app/(admin)/admin/analytics/clientes/page.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Construction } from 'lucide-react'

export default function ClientesAnalyticsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
            <div className="p-6 bg-warning/10 rounded-full">
                <Construction className="w-12 h-12 text-warning" />
            </div>

            <div className="max-w-md space-y-2">
                <h1 className="font-heading text-h2 text-foreground">Em Construção</h1>
                <p className="text-body text-muted-foreground">
                    O relatório detalhado de clientes e retenção estará disponível na próxima atualização do sistema.
                </p>
            </div>

            <Button asChild>
                <Link href="/admin/analytics" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para Analytics
                </Link>
            </Button>
        </div>
    )
}
