import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock } from 'lucide-react'
import { formatCurrencyUSD } from '@/lib/formatters'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface SummaryCardProps {
    calculations: {
        valorBase: number
        valorAddons: number
        subtotal: number
        desconto: number
        valorDesconto: number
        valorFinal: number
    }
    duracaoTotal: number
    horarioInicio: string
    horarioFim: string
    addonsCount: number
}

export function SummaryCard({
    calculations,
    duracaoTotal,
    horarioInicio,
    horarioFim,
    addonsCount
}: SummaryCardProps) {
    const { t } = useAdminI18n()
    const agendaT = t('agenda')

    return (
        <Card className="bg-[#FDF8F6] border-[#C48B7F]/20">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{agendaT.summary?.title}</span>
                    <Badge variant="outline" className="gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(duracaoTotal / 60)}h {duracaoTotal % 60 > 0 ? `${duracaoTotal % 60}min` : ''}
                    </Badge>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{agendaT.summary?.baseValue}:</span>
                        <span>{formatCurrencyUSD(calculations.valorBase)}</span>
                    </div>
                    {calculations.valorAddons > 0 && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                {agendaT.summary?.addonsValue} ({addonsCount}):
                            </span>
                            <span>+{formatCurrencyUSD(calculations.valorAddons)}</span>
                        </div>
                    )}
                    {calculations.desconto > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>{agendaT.summary?.discount} ({calculations.desconto}%):</span>
                            <span>-{formatCurrencyUSD(calculations.valorDesconto)}</span>
                        </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>{agendaT.summary?.total}:</span>
                        <span className="text-[#C48B7F]">{formatCurrencyUSD(calculations.valorFinal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{agendaT.detail?.time}:</span>
                        <span>
                            {horarioInicio} - {horarioFim}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
