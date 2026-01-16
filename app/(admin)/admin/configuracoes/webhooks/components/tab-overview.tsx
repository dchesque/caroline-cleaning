'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isWebhookConfigured, getBaseUrl } from '@/lib/config/webhooks'
import {
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Zap,
    MessageSquare,
    Calendar,
    Users,
    Repeat
} from 'lucide-react'

import { useAdminI18n } from '@/lib/admin-i18n/context'

interface TabOverviewProps {
    onTabChange: (tab: string) => void
}

export function TabOverview({ onTabChange }: TabOverviewProps) {
    const { t } = useAdminI18n()
    const webhooksT = t('settings').webhooks
    const configured = isWebhookConfigured()
    const baseUrl = getBaseUrl() || 'https://seu-n8n.com/webhook'
    const maskedUrl = baseUrl.replace(/(https?:\/\/).*(.com|.net|.io)/, '$1***$2')

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Banner Slim */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${configured
                    ? 'bg-green-50/50 border-green-100 text-green-800'
                    : 'bg-amber-50/50 border-amber-100 text-amber-800'
                }`}>
                <div className="flex items-center gap-3">
                    {configured ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-amber-500" />}
                    <div>
                        <p className="text-sm font-bold">
                            {configured ? webhooksT.status.ready : webhooksT.status.pending}
                        </p>
                        <p className="text-xs opacity-80 font-mono">{maskedUrl}</p>
                    </div>
                </div>
                {!configured && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTabChange('config')}
                        className="bg-white hover:bg-amber-50 border-amber-200 text-amber-700"
                    >
                        {webhooksT.status.configureNow}
                    </Button>
                )}
            </div>

            {/* Arquitetura */}
            <section className="space-y-6">
                <div>
                    <h3 className="text-lg font-serif text-zinc-900 border-b pb-2">{webhooksT.howItWorks.title}</h3>
                    <p className="text-sm text-zinc-500 mt-2">
                        {webhooksT.howItWorks.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-zinc-200 bg-white hover:border-blue-200 transition-colors group">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold uppercase tracking-tight text-[10px]">{webhooksT.cards.outbound.direction}</Badge>
                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                    <Zap className="h-4 w-4 text-blue-500" />
                                </div>
                            </div>
                            <CardTitle className="text-lg mt-2">{webhooksT.cards.outbound.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                {webhooksT.cards.outbound.description}
                            </p>
                            <ul className="text-xs space-y-2 text-zinc-600">
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-blue-400" />
                                    {webhooksT.cards.outbound.events}
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-blue-400" />
                                    {webhooksT.cards.outbound.retry}
                                </li>
                            </ul>
                            <Button
                                variant="ghost"
                                className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50 group-hover:px-4 transition-all"
                                onClick={() => onTabChange('outbound')}
                            >
                                {webhooksT.cards.outbound.cta}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-zinc-200 bg-white hover:border-purple-200 transition-colors group">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-purple-50 text-purple-600 border-none font-bold uppercase tracking-tight text-[10px]">{webhooksT.cards.inbound.direction}</Badge>
                                <div className="h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center">
                                    <Repeat className="h-4 w-4 text-purple-500" />
                                </div>
                            </div>
                            <CardTitle className="text-lg mt-2">{webhooksT.cards.inbound.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                {webhooksT.cards.inbound.description}
                            </p>
                            <ul className="text-xs space-y-2 text-zinc-600">
                                <li className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-purple-400" />
                                    {webhooksT.cards.inbound.events}
                                </li>
                                <li className="flex items-center gap-2" title={webhooksT.cards.inbound.endpoint}>
                                    <div className="h-1 w-1 rounded-full bg-purple-400" />
                                    {webhooksT.cards.inbound.endpoint}
                                </li>
                            </ul>
                            <Button
                                variant="ghost"
                                className="w-full justify-between text-purple-600 hover:text-purple-700 hover:bg-purple-50 group-hover:px-4 transition-all"
                                onClick={() => onTabChange('inbound')}
                            >
                                {webhooksT.cards.inbound.cta}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Casos de Uso */}
            <section className="space-y-6">
                <h3 className="text-lg font-serif text-zinc-900 border-b pb-2">{webhooksT.useCases.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-zinc-50/50 rounded-xl border border-zinc-100 hover:border-brandy-rose/20 transition-colors">
                        <div className="h-9 w-9 bg-brandy-rose/10 rounded-lg flex items-center justify-center mb-3 text-brandy-rose">
                            <Users className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-bold text-zinc-900 mb-1">{webhooksT.useCases.leads.title}</h4>
                        <p className="text-[11px] text-zinc-500 mb-2">{webhooksT.useCases.leads.desc}</p>
                        <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-[9px] py-0 bg-white">lead.created</Badge>
                            <Badge variant="outline" className="text-[9px] py-0 bg-white">chat.msg</Badge>
                        </div>
                    </div>

                    <div className="p-4 bg-zinc-50/50 rounded-xl border border-zinc-100 hover:border-brandy-rose/20 transition-colors">
                        <div className="h-9 w-9 bg-brandy-rose/10 rounded-lg flex items-center justify-center mb-3 text-brandy-rose">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-bold text-zinc-900 mb-1">{webhooksT.useCases.notifications.title}</h4>
                        <p className="text-[11px] text-zinc-500 mb-2">{webhooksT.useCases.notifications.desc}</p>
                        <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-[9px] py-0 bg-white">appt.created</Badge>
                            <Badge variant="outline" className="text-[9px] py-0 bg-white">appt.confirmed</Badge>
                        </div>
                    </div>

                    <div className="p-4 bg-zinc-50/50 rounded-xl border border-zinc-100 hover:border-brandy-rose/20 transition-colors">
                        <div className="h-9 w-9 bg-brandy-rose/10 rounded-lg flex items-center justify-center mb-3 text-brandy-rose">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-bold text-zinc-900 mb-1">{webhooksT.useCases.postService.title}</h4>
                        <p className="text-[11px] text-zinc-500 mb-2">{webhooksT.useCases.postService.desc}</p>
                        <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-[9px] py-0 bg-white">appt.completed</Badge>
                            <Badge variant="outline" className="text-[9px] py-0 bg-white">feedback</Badge>
                        </div>
                    </div>

                    <div className="p-4 bg-zinc-50/50 rounded-xl border border-zinc-100 hover:border-brandy-rose/20 transition-colors">
                        <div className="h-9 w-9 bg-brandy-rose/10 rounded-lg flex items-center justify-center mb-3 text-brandy-rose">
                            <Repeat className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-bold text-zinc-900 mb-1">{webhooksT.useCases.engagement.title}</h4>
                        <p className="text-[11px] text-zinc-500 mb-2">{webhooksT.useCases.engagement.desc}</p>
                        <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-[9px] py-0 bg-white">client.inactive</Badge>
                            <Badge variant="outline" className="text-[9px] py-0 bg-white">client.birthday</Badge>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
