'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, UserPlus, Calendar } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
    return (
        <Card className="border-none shadow-sm">
            <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Button asChild className="w-full justify-start bg-[#C48B7F] hover:bg-[#A66D60]">
                    <Link href="/admin/agenda?new=true">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Agendamento
                    </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start border-[#C48B7F] text-[#C48B7F] hover:bg-[#F9F1F0]">
                    <Link href="/admin/clientes?new=true">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Novo Cliente
                    </Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start">
                    <Link href="/admin/agenda">
                        <Calendar className="mr-2 h-4 w-4" />
                        Ver Agenda Completa
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
