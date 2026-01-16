import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign } from 'lucide-react'
import { formatCurrencyInput } from '@/lib/formatters'
import { STATUS_OPTIONS } from './constants'
import { AppointmentFormData } from '../types'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface ValuesSectionProps {
    formData: AppointmentFormData
    onChange: (updates: Partial<AppointmentFormData>) => void
}

export function ValuesSection({ formData, onChange }: ValuesSectionProps) {
    const { t } = useAdminI18n()
    const agendaT = t('agenda')

    return (
        <div className="space-y-3">
            <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {agendaT.detail?.value}
            </Label>
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{agendaT.form?.baseValue}</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                            value={formData.valor}
                            onChange={e => onChange({ valor: formatCurrencyInput(e.target.value) })}
                            placeholder="0.00"
                            className="pl-7 bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{agendaT.form?.discount}</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.desconto_percentual}
                            onChange={e => onChange({ desconto_percentual: e.target.value })}
                            placeholder="0"
                            className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">{t('common').status}</Label>
                    <Select
                        value={formData.status}
                        onValueChange={v => onChange({ status: v })}
                    >
                        <SelectTrigger className="bg-white border-gray-200 shadow-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map(s => (
                                <SelectItem key={s.value} value={s.value}>
                                    {(agendaT.status as any)?.[s.value] || s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
