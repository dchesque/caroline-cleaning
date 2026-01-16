'use client'

import { useState } from 'react'
import { WebhookConfig } from '../data/webhooks-data'
import { WebhookCard } from './webhook-card'
import { Input } from '@/components/ui/input'
import { Search, X, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface TabInboundProps {
    webhooks: WebhookConfig[]
    onSelect: (webhook: WebhookConfig) => void
}

export function TabInbound({ webhooks, onSelect }: TabInboundProps) {
    const { t } = useAdminI18n()
    const webhooksT = t('settings').webhooks
    const [search, setSearch] = useState('')

    const filtered = webhooks.filter(w =>
        w.id.toLowerCase().includes(search.toLowerCase()) ||
        w.category.toLowerCase().includes(search.toLowerCase()) ||
        w.description.toLowerCase().includes(search.toLowerCase())
    )

    const categories = Array.from(new Set(filtered.map(w => w.category)))

    const getCategoryName = (cat: string) => {
        const key = cat.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(' ', '_') as keyof typeof webhooksT.categories
        return webhooksT.categories[key] || cat
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header com Info e Busca */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start border-b pb-8">
                <div className="space-y-4 flex-1">
                    <div>
                        <h3 className="text-xl font-serif text-zinc-900">{webhooksT.list.inboundTitle}</h3>
                        <p className="text-sm text-zinc-500 mt-1">{webhooksT.list.inboundSubtitle}</p>
                    </div>
                    <Alert className="bg-blue-50/50 border-blue-100 max-w-2xl">
                        <Info className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="text-xs text-blue-700 leading-relaxed">
                            {webhooksT.list.inboundAlert}
                        </AlertDescription>
                    </Alert>
                </div>
                <div className="relative w-full md:max-w-xs group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-brandy-rose transition-colors" />
                    <Input
                        placeholder={webhooksT.list.search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 bg-white border-zinc-200 focus-visible:ring-brandy-rose"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 hover:text-zinc-600"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Listagem categorizada */}
            {categories.length > 0 ? (
                <div className="space-y-12 pb-10">
                    {categories.map(category => (
                        <section key={category} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{filtered.find(w => w.category === category)?.categoryIcon}</span>
                                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-[0.2em]">
                                    {getCategoryName(category)}
                                </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filtered.filter(w => w.category === category).map(webhook => (
                                    <WebhookCard
                                        key={webhook.id}
                                        webhook={webhook}
                                        onClick={() => onSelect(webhook)}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center border-2 border-dashed border-zinc-100 rounded-3xl">
                    <p className="text-zinc-500 font-medium">{webhooksT.list.empty}</p>
                </div>
            )}
        </div>
    )
}
