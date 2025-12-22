// components/analytics/conversion-funnel.tsx
'use client'

interface FunnelStep {
    label: string
    value: number
    percentage: number
    color: string
}

interface ConversionFunnelProps {
    steps: FunnelStep[]
}

export function ConversionFunnel({ steps }: ConversionFunnelProps) {
    const maxValue = steps[0]?.value || 1

    return (
        <div className="space-y-4">
            {steps.map((step, index) => {
                const width = (step.value / maxValue) * 100
                return (
                    <div key={step.label} className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium">{step.label}</span>
                            <span className="text-muted-foreground">
                                {step.value.toLocaleString()} ({step.percentage.toFixed(1)}%)
                            </span>
                        </div>
                        <div className="h-10 bg-pampas rounded-lg overflow-hidden relative">
                            <div
                                className="h-full rounded-lg transition-all duration-500"
                                style={{
                                    width: `${Math.max(width, 2)}%`,
                                    backgroundColor: step.color
                                }}
                            />
                            {index > 0 && steps[index - 1].value > 0 && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-caption text-background/80 font-medium">
                                    {((step.value / steps[index - 1].value) * 100).toFixed(1)}% ↓
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
