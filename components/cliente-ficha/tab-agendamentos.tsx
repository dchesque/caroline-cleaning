import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export async function TabAgendamentos({ clientId }: { clientId: string }) {
    const supabase = await createClient()
    const { data: appointments } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('cliente_id', clientId)
        .order('data', { ascending: false })

    return (
        <Card className="border-[#EAE0D5]">
            <CardContent className="p-0">
                {!appointments?.length ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Nenhum agendamento encontrado.
                    </div>
                ) : (
                    <div className="divide-y divide-[#EAE0D5]">
                        {appointments.map((app) => (
                            <div key={app.id} className="p-4 flex items-center justify-between hover:bg-[#FDF8F6]">
                                <div>
                                    <p className="font-medium text-sm">
                                        {format(new Date(app.data), 'dd/MM/yyyy')} às {format(new Date(app.data), 'HH:mm')}
                                    </p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {app.tipo_servico} • {app.duracao_estimada}h
                                    </p>
                                </div>
                                <Badge variant="outline" className="capitalize">
                                    {app.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
