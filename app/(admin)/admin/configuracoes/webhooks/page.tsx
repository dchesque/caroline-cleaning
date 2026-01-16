import { Suspense } from 'react'
import { Metadata } from 'next'
import { WebhooksDocContainer } from './components/webhooks-doc-container'
import { WebhookStatusBanner } from './components/webhook-status-banner'
import { WebhookOverviewCards } from './components/webhook-overview-cards'
import { EnvConfigBlock } from './components/env-config-block'
import { ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
    title: 'Documentação de Webhooks | Admin Caroline',
    description: 'Detalhamento técnica dos webhooks de integração com n8n e sistemas externos.',
}

export default function WebhooksPage() {
    return (
        <div className="container mx-auto py-8 max-w-7xl animate-in fade-in duration-700">
            {/* Breadcrumb & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                        <Link href="/admin/configuracoes" className="hover:text-brandy-rose transition-colors">Configurações</Link>
                        <span className="text-zinc-300">/</span>
                        <span className="text-zinc-900 font-medium">Webhooks</span>
                    </div>
                    <h1 className="text-4xl font-serif text-zinc-950 flex items-center gap-3">
                        Webhooks & Integrações
                        <div className="p-1.5 bg-brandy-rose/10 rounded-lg">
                            <BookOpen className="h-6 w-6 text-brandy-rose" />
                        </div>
                    </h1>
                    <p className="text-zinc-500 max-w-2xl">
                        Documentação técnica completa para desenvolvedores integrando a Caroline com n8n e sistemas externos.
                        Utilize os payloads abaixo para configurar seus workflows.
                    </p>
                </div>

                <Link href="/admin/configuracoes">
                    <Button variant="outline" className="gap-2 border-zinc-200">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar para Configurações
                    </Button>
                </Link>
            </div>

            <div className="space-y-10">
                {/* Banner de Status */}
                <WebhookStatusBanner />

                {/* Visão Geral */}
                <section className="space-y-4">
                    <h2 className="text-xl font-serif text-zinc-900 flex items-center gap-2">
                        Visão Geral da Arquitetura
                    </h2>
                    <WebhookOverviewCards />
                </section>

                {/* Configuração .env */}
                <section className="space-y-4">
                    <h2 className="text-xl font-serif text-zinc-900 flex items-center gap-2">
                        Configuração
                    </h2>
                    <EnvConfigBlock />
                </section>

                <Separator />

                {/* Container Interativo de Webhooks (Client component) */}
                <Suspense fallback={<div className="h-[600px] w-full bg-zinc-50 animate-pulse rounded-xl" />}>
                    <WebhooksDocContainer />
                </Suspense>
            </div>

            {/* Footer Docs */}
            <div className="mt-20 pt-8 border-t border-zinc-100 text-center">
                <p className="text-sm text-zinc-400">
                    Caroline Premium Cleaning Documentation - v1.0.0
                </p>
            </div>
        </div>
    )
}
