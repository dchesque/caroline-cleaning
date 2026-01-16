import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HORARIOS } from './constants'
import { AppointmentFormData } from '../types'

interface DateTimeSectionProps {
    formData: AppointmentFormData
    onChange: (updates: Partial<AppointmentFormData>) => void
}

export function DateTimeSection({ formData, onChange }: DateTimeSectionProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                    type="date"
                    value={formData.data}
                    onChange={e => onChange({ data: e.target.value })}
                    required
                    className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                />
            </div>
            <div className="space-y-2">
                <Label>Horário Início *</Label>
                <Select
                    value={formData.horario_inicio}
                    onValueChange={v => onChange({ horario_inicio: v })}
                >
                    <SelectTrigger className="bg-white border-gray-200 shadow-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {HORARIOS.map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
