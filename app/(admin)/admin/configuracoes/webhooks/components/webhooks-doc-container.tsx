'use client'

import { useState, useRef, useEffect } from 'react'
import { WEBHOOKS_DATA, WebhookConfig } from '../data/webhooks-data'
import { WebhookCategorySection } from './webhook-category-section'
import { WebhookDetailPanel } from './webhook-detail-panel'
import { Input } from '@/components/ui/input'
import { Search, X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WebhooksDocContainer() {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const detailPanelRef = useRef<HTMLDivElement>(null)

    const outboundWebhooks = WEBHOOKS_DATA.filter(w => w.direction === 'outbound')
    const inboundWebhooks = WEBHOOKS_DATA.filter(w => w.direction === 'inbound')

    const filteredOutbound = outboundWebhooks.filter(w =>
        w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredInbound = inboundWebhooks.filter(w =>
        w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const selectedWebhook = WEBHOOKS_DATA.find(w => w.id === selectedId) || null

    const handleSelect = (id: string) => {
        setSelectedId(id)
        // Scroll suave para os detalhes apenas se estiver no mobile ou se o painel não estiver visível
        const detailsContainer = document.getElementById('webhook-details-section')
        if (detailsContainer && window.innerWidth < 1024) {
            detailsContainer.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar/List Section */}
            <div className="lg:col-span-12 space-y-12">

                {/* Filtro e Busca */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                    <div className="relative w-full md:max-w-md group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-brandy-rose transition-colors" />
                        <Input
                            placeholder="Buscar por nome ou categoria..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 bg-white border-zinc-200 focus-visible:ring-brandy-rose"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 hover:text-zinc-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-zinc-500" onClick={() => { setSearchTerm(''); setSelectedId(null); }}>
                            Limpar Filtros
                        </Button>
                    </div>
                </div>

                {/* Listas */}
                <div className="space-y-16">
                    <WebhookCategorySection
                        title="Webhooks Outbound (App → n8n)"
                        direction="outbound"
                        webhooks={filteredOutbound}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                    />

                    <WebhookCategorySection
                        title="Webhooks Inbound (n8n → App)"
                        direction="inbound"
                        webhooks={filteredInbound}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                    />
                </div>
            </div>

            {/* Detail Section */}
            <div id="webhook-details-section" className="lg:col-span-12 mt-8 lg:mt-0">
                <WebhookDetailPanel webhook={selectedWebhook} />
            </div>
        </div>
    )
}
