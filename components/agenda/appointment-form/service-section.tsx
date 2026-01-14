import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Clock } from 'lucide-react'
import { DURACOES } from './constants'
import { ServicoTipo, AppointmentFormData } from '../types'

interface ServiceSectionProps {
    formData: AppointmentFormData
    onChange: (updates: Partial<AppointmentFormData>) => void
    onServiceChange: (codigo: string) => void
    serviceTypes: ServicoTipo[]
}

export function ServiceSection({
    formData,
    onChange,
    onServiceChange,
    serviceTypes
}: ServiceSectionProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Tipo de Serviço *
                </Label>
                <Select
                    value={formData.tipo}
                    onValueChange={onServiceChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                        {serviceTypes.map(t => (
                            <SelectItem key={t.codigo} value={t.codigo}>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: t.cor || '#BE9982' }}
                                    />
                                    {t.nome}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duração Base
                </Label>
                <Select
                    value={formData.duracao_minutos}
                    onValueChange={v => onChange({ duracao_minutos: v })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {DURACOES.map(d => (
                            <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
