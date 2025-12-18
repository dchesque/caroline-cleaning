import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientHeader } from '@/components/cliente-ficha/client-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TabInfo } from '@/components/cliente-ficha/tab-info'
import { TabAgendamentos } from '@/components/cliente-ficha/tab-agendamentos'
import { TabFinanceiro } from '@/components/cliente-ficha/tab-financeiro'
import { TabContrato } from '@/components/cliente-ficha/tab-contrato'
import { TabNotas } from '@/components/cliente-ficha/tab-notas'

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: client, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !client) notFound()

    return (
        <div className="space-y-6">
            <ClientHeader client={client} />
            <Tabs defaultValue="info" className="space-y-6">
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0 scrollbar-hide">
                    <TabsList className="bg-white border border-[#EAE0D5] inline-flex w-auto min-w-full sm:w-full justify-start h-12 p-1">
                        <TabsTrigger value="info" className="flex-1 min-w-[100px] data-[state=active]:bg-[#FDF8F6] data-[state=active]:text-[#C48B7F]">Informações</TabsTrigger>
                        <TabsTrigger value="agendamentos" className="flex-1 min-w-[120px] data-[state=active]:bg-[#FDF8F6] data-[state=active]:text-[#C48B7F]">Agendamentos</TabsTrigger>
                        <TabsTrigger value="financeiro" className="flex-1 min-w-[100px] data-[state=active]:bg-[#FDF8F6] data-[state=active]:text-[#C48B7F]">Financeiro</TabsTrigger>
                        <TabsTrigger value="contrato" className="flex-1 min-w-[100px] data-[state=active]:bg-[#FDF8F6] data-[state=active]:text-[#C48B7F]">Contrato</TabsTrigger>
                        <TabsTrigger value="notas" className="flex-1 min-w-[80px] data-[state=active]:bg-[#FDF8F6] data-[state=active]:text-[#C48B7F]">Notas</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="info"><TabInfo client={client} /></TabsContent>
                <TabsContent value="agendamentos"><TabAgendamentos clientId={id} /></TabsContent>
                <TabsContent value="financeiro"><TabFinanceiro clientId={id} /></TabsContent>
                <TabsContent value="contrato"><TabContrato client={client} /></TabsContent>
                <TabsContent value="notas"><TabNotas client={client} /></TabsContent>
            </Tabs>
        </div>
    )
}
