// components/analytics/kpi-card.tsx
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface KPICardProps {
    title: string
    value: string | number
    subtitle?: string
    change?: number // percentual de mudança
    icon: LucideIcon
    iconColor?: string
    iconBgColor?: string
}

export function KPICard({
    title,
    value,
    subtitle,
    change,
    icon: Icon,
    iconColor = 'text-primary',
    iconBgColor = 'bg-primary/10'
}: KPICardProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-caption text-muted-foreground">{title}</p>
                        <p className="text-h3 font-semibold">{value}</p>
                        {subtitle && (
                            <p className="text-caption text-muted-foreground mt-1">{subtitle}</p>
                        )}
                        {change !== undefined && (
                            <div className="flex items-center gap-1 mt-1">
                                {change >= 0 ? (
                                    <ArrowUpRight className="w-4 h-4 text-success" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4 text-destructive" />
                                )}
                                <span className={`text-caption ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
                                    {Math.abs(change).toFixed(1)}% vs período anterior
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={`p-3 ${iconBgColor} rounded-lg`}>
                        <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
