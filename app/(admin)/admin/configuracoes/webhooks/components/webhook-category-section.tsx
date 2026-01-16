import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WebhookConfig, WebhookDirection } from "../data/webhooks-data"
import { cn } from "@/lib/utils"

interface WebhookCategorySectionProps {
    title: string
    direction: WebhookDirection
    webhooks: WebhookConfig[]
    selectedId: string | null
    onSelect: (id: string) => void
}

export function WebhookCategorySection({
    title,
    direction,
    webhooks,
    selectedId,
    onSelect
}: WebhookCategorySectionProps) {
    // Agrupar por categoria
    const categories = Array.from(new Set(webhooks.map(w => w.category)))

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <h3 className="text-xl font-serif text-zinc-900">{title}</h3>
                <Badge variant="outline" className="bg-zinc-50 text-zinc-500 font-normal">
                    {webhooks.length} endpoints
                </Badge>
            </div>

            <div className="space-y-8">
                {categories.map(category => {
                    const categoryWebhooks = webhooks.filter(w => w.category === category)
                    const icon = categoryWebhooks[0]?.categoryIcon

                    return (
                        <div key={category} className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 uppercase tracking-wider">
                                <span>{icon}</span>
                                <span>{category}</span>
                                <span className="ml-1 text-zinc-300">({categoryWebhooks.length})</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {categoryWebhooks.map(webhook => (
                                    <Button
                                        key={webhook.id}
                                        variant="outline"
                                        className={cn(
                                            "h-auto py-3 px-4 flex flex-col items-start gap-1 transition-all duration-200 border-zinc-200 hover:border-brandy-rose/50 hover:bg-brandy-rose/5",
                                            selectedId === webhook.id && "border-brandy-rose bg-brandy-rose/[0.03] ring-1 ring-brandy-rose shadow-sm"
                                        )}
                                        onClick={() => onSelect(webhook.id)}
                                    >
                                        <span className={cn(
                                            "text-sm font-semibold text-zinc-800",
                                            selectedId === webhook.id && "text-brandy-rose"
                                        )}>
                                            {webhook.id.split('.').pop()?.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-mono truncate w-full text-left">
                                            {webhook.id}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
