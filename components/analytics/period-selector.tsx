// components/analytics/period-selector.tsx
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Calendar } from 'lucide-react'

interface PeriodSelectorProps {
    value: string
    onChange: (value: string) => void
}

const PERIODS = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: 'month', label: 'Este mês' },
    { value: 'lastMonth', label: 'Mês passado' },
    { value: 'year', label: 'Este ano' },
]

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                </div>
            </SelectTrigger>
            <SelectContent>
                {PERIODS.map(period => (
                    <SelectItem key={period.value} value={period.value}>
                        {period.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
