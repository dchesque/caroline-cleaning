import { CATEGORIAS_DESPESA } from './constants'
import { Sparkles, Car, Wrench, Megaphone, Settings, MoreHorizontal } from 'lucide-react'

const iconMap: any = {
    Sparkles,
    Car,
    Wrench,
    Megaphone,
    Settings,
    MoreHorizontal
}

interface ExpenseCategoryProps {
    category: string
    className?: string
}

export function ExpenseCategory({ category, className = "" }: ExpenseCategoryProps) {
    const cat = CATEGORIAS_DESPESA.find(c => c.value === category)

    if (!cat) {
        return <span className={className}>{category}</span>
    }

    const Icon = iconMap[cat.icon as any] || MoreHorizontal

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Icon className="w-4 h-4 text-muted-foreground" />
            <span>{cat.label}</span>
        </div>
    )
}
