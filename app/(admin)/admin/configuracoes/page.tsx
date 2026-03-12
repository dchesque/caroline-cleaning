'use client'

import { useAdminI18n } from '@/lib/admin-i18n/context'
import { ConfigLinkCard } from '@/components/admin/config-link-card'
import { Building2, Layout, Cog, BarChart3 } from 'lucide-react'

export default function ConfiguracoesPage() {
    const { t } = useAdminI18n()
    const settings = t('settings')

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="font-heading text-3xl text-foreground mb-2">{settings.overview.title}</h1>
                <p className="text-muted-foreground">{settings.overview.subtitle}</p>
            </div>

            {/* Grid de Configurações */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ConfigLinkCard
                    href="/admin/configuracoes/empresa"
                    icon={Building2}
                    title={settings.overview.companyCard.title}
                    description={settings.overview.companyCard.description}
                />

                <ConfigLinkCard
                    href="/admin/configuracoes/pagina-inicial"
                    icon={Layout}
                    title={settings.overview.landingCard.title}
                    description={settings.overview.landingCard.description}
                />

                <ConfigLinkCard
                    href="/admin/configuracoes/sistema"
                    icon={Cog}
                    title={settings.overview.systemCard.title}
                    description={settings.overview.systemCard.description}
                />

                <ConfigLinkCard
                    href="/admin/configuracoes/trackeamento"
                    icon={BarChart3}
                    title={settings.overview.trackingCard.title}
                    description={settings.overview.trackingCard.description}
                />
            </div>

            {/* Seção de Atalhos Rápidos (Opcional, mas melhora UX) */}
            <div className="pt-8 border-t border-gray-100">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                    {settings.company.relatedLinks.title}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ConfigLinkCard
                        href="/admin/servicos"
                        icon={Cog}
                        title={settings.company.relatedLinks.services}
                        description={settings.company.relatedLinks.servicesDesc}
                        className="p-4"
                    />
                    <ConfigLinkCard
                        href="/admin/equipe"
                        icon={Cog}
                        title={settings.company.relatedLinks.team}
                        description={settings.company.relatedLinks.teamDesc}
                        className="p-4"
                    />
                </div>
            </div>
        </div>
    )
}
