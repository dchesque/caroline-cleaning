import { WebhookConfig } from '../data/webhooks-data'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight } from 'lucide-react'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface WebhookCardProps {
    webhook: WebhookConfig
    onClick: () => void
}

export function WebhookCard({ webhook, onClick }: WebhookCardProps) {
    const { t } = useAdminI18n()

    const webhooksT = t('settings').webhooks

    return (
        <Card
            className="group hover:border-brandy-rose/30 transition-all cursor-pointer hover:shadow-md bg-white border-zinc-200"
            onClick={onClick}
        >
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-110">
                        {webhook.categoryIcon}
                    </span>
                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 border-none font-mono text-[9px] px-1.5 uppercase group-hover:bg-brandy-rose/10 group-hover:text-brandy-rose">
                        {webhook.method}
                    </Badge>
                </div>
                <CardTitle className="text-sm font-mono text-zinc-900 group-hover:text-brandy-rose transition-colors truncate" title={webhook.id}>
                    {webhook.id}
                </CardTitle>
                <CardDescription className="text-[11px] line-clamp-2 min-h-[32px] leading-relaxed">
                    {webhook.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {webhook.fields.slice(0, 3).map(field => (
                        <Badge key={field.name} variant="outline" className="text-[9px] px-1.5 py-0 bg-zinc-50 border-zinc-100 text-zinc-400 font-normal">
                            {field.name}
                        </Badge>
                    ))}
                    {webhook.fields.length > 3 && (
                        <span className="text-[9px] text-zinc-300 font-medium ml-0.5">+{webhook.fields.length - 3}</span>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-2 border-t border-zinc-50 flex items-center justify-between text-zinc-400 group-hover:bg-zinc-50/50 transition-colors">
                <span className="text-[10px] uppercase tracking-wider font-bold">{t('common').type}: {webhook.direction === 'outbound' ? webhooksT.tabs.outbound : webhooksT.tabs.inbound}</span>
                <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </CardFooter>
        </Card>
    )
}
