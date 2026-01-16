'use client'

import { useState } from 'react'
import { WebhookConfig, WEBHOOKS_DATA } from '../data/webhooks-data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TabOverview } from './tab-overview'
import { TabOutbound } from './tab-outbound'
import { TabInbound } from './tab-inbound'
import { TabConfig } from './tab-config'
import { WebhookDetailModal } from './webhook-detail-modal'
import { Braces, Zap, Info, Settings2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { useAdminI18n } from '@/lib/admin-i18n/context'

export function WebhooksTabs() {
    const { t } = useAdminI18n()
    const webhooksT = t('settings').webhooks
    const [activeTab, setActiveTab] = useState('overview')
    const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null)
    const [modalOpen, setModalOpen] = useState(false)

    const outboundWebhooks = WEBHOOKS_DATA.filter(w => w.direction === 'outbound')
    const inboundWebhooks = WEBHOOKS_DATA.filter(w => w.direction === 'inbound')

    const handleSelectWebhook = (webhook: WebhookConfig) => {
        setSelectedWebhook(webhook)
        setModalOpen(true)
    }

    return (
        <div className="space-y-8">
            {/* Header com Navegação Hierárquica */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                        <Link href="/admin/configuracoes" className="hover:text-brandy-rose transition-colors">{t('sidebar').settings}</Link>
                        <span>/</span>
                        <span className="text-zinc-900 font-medium">{webhooksT.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brandy-rose/10 flex items-center justify-center text-brandy-rose">
                            <Braces className="h-6 w-6" />
                        </div>
                        <h1 className="font-serif text-3xl text-zinc-900">{webhooksT.title}</h1>
                    </div>
                    <p className="text-zinc-500 text-sm">{webhooksT.subtitle}</p>
                </div>
                <Button variant="outline" size="sm" asChild className="hover:bg-zinc-50 border-zinc-200">
                    <Link href="/admin/configuracoes" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        {webhooksT.back}
                    </Link>
                </Button>
            </div>

            {/* Tabs de Navegação Principal */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="h-14 w-full justify-start gap-4 bg-zinc-50/50 border border-zinc-100 p-1 mb-8 overflow-x-auto overflow-y-hidden">
                    <TabsTrigger
                        value="overview"
                        className="data-[state=active]:bg-white data-[state=active]:text-brandy-rose data-[state=active]:shadow-sm rounded-lg px-6 h-full gap-2 transition-all font-medium"
                    >
                        <Info className="h-4 w-4" />
                        {webhooksT.tabs.overview}
                    </TabsTrigger>
                    <TabsTrigger
                        value="outbound"
                        className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg px-6 h-full gap-2 transition-all font-medium"
                    >
                        <Zap className="h-4 w-4" />
                        {webhooksT.tabs.outbound}
                    </TabsTrigger>
                    <TabsTrigger
                        value="inbound"
                        className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-lg px-6 h-full gap-2 transition-all font-medium"
                    >
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                        {webhooksT.tabs.inbound}
                    </TabsTrigger>
                    <TabsTrigger
                        value="config"
                        className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-lg px-6 h-full gap-2 transition-all font-medium"
                    >
                        <Settings2 className="h-4 w-4" />
                        {webhooksT.tabs.config}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                    <TabOverview onTabChange={setActiveTab} />
                </TabsContent>

                <TabsContent value="outbound" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                    <TabOutbound webhooks={outboundWebhooks} onSelect={handleSelectWebhook} />
                </TabsContent>

                <TabsContent value="inbound" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                    <TabInbound webhooks={inboundWebhooks} onSelect={handleSelectWebhook} />
                </TabsContent>

                <TabsContent value="config" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                    <TabConfig />
                </TabsContent>
            </Tabs>

            {/* Modal de Detalhes Reutilizável */}
            <WebhookDetailModal
                webhook={selectedWebhook}
                open={modalOpen}
                onOpenChange={setModalOpen}
            />
        </div>
    )
}
