'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from './copy-button'
import { isWebhookConfigured, getBaseUrl, getWebhookSecret } from '@/lib/config/webhooks'
import { ShieldCheck, Info, Terminal, Settings } from 'lucide-react'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'

import { useAdminI18n } from '@/lib/admin-i18n/context'

export function TabConfig() {
    const { t } = useAdminI18n()
    const webhooksT = t('settings').webhooks
    const isConfigured = isWebhookConfigured()
    const baseUrl = getBaseUrl() || ''
    const secret = getWebhookSecret() || ''

    const envContent = `# Webhooks n8n
NEXT_PUBLIC_N8N_WEBHOOK_URL=${baseUrl || 'https://seu-n8n.com/webhook'}
N8N_WEBHOOK_SECRET=${secret || 'seu-secret-seguro-aqui'}`

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
            {/* Header */}
            <div>
                <h3 className="text-xl font-serif text-zinc-900">{webhooksT.configTab.title}</h3>
                <p className="text-sm text-zinc-500 mt-1">{webhooksT.configTab.subtitle}</p>
            </div>

            {/* Status Atual */}
            <section className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{webhooksT.configTab.status}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-zinc-200 bg-zinc-50/30">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-mono font-bold text-zinc-500">NEXT_PUBLIC_N8N_WEBHOOK_URL</p>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${baseUrl ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-xs font-medium">{baseUrl ? webhooksT.status.ready.split(' ')[0] : webhooksT.status.pending.split(' ')[0]}</span>
                                </div>
                            </div>
                            {baseUrl && <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100 uppercase text-[9px]">{webhooksT.status.active}</Badge>}
                        </CardContent>
                    </Card>
                    <Card className="border-zinc-200 bg-zinc-50/30">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-mono font-bold text-zinc-500">N8N_WEBHOOK_SECRET</p>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${secret ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-xs font-medium">{secret ? webhooksT.status.ready.split(' ')[0] : webhooksT.status.pending.split(' ')[0]}</span>
                                </div>
                            </div>
                            {secret && <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100 uppercase text-[9px]">{webhooksT.status.active}</Badge>}
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Variáveis */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{webhooksT.configTab.envFile}</h4>
                    <CopyButton text={envContent} label={webhooksT.configTab.copyEnv} />
                </div>
                <div className="relative group">
                    <pre className="bg-zinc-900 text-zinc-400 p-6 rounded-2xl font-mono text-xs leading-relaxed border border-zinc-800 shadow-xl">
                        <div className="mb-4 text-zinc-600"># {webhooksT.configTab.envHelp}</div>
                        <div><span className="text-brandy-rose">NEXT_PUBLIC_N8N_WEBHOOK_URL</span>={baseUrl || 'https://seu-n8n.com/webhook'}</div>
                        <div><span className="text-brandy-rose">N8N_WEBHOOK_SECRET</span>={secret || 'seu-secret-seguro-aqui'}</div>
                    </pre>
                </div>
            </section>

            {/* Segurança e Técnicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-900">
                        <ShieldCheck className="h-4 w-4 text-brandy-rose" />
                        <h4 className="text-sm font-bold">{webhooksT.configTab.security.title}</h4>
                    </div>
                    <ul className="space-y-3 text-xs text-zinc-500">
                        <li className="flex gap-2">
                            <div className="h-1 w-1 rounded-full bg-zinc-300 mt-1.5 shrink-0" />
                            {webhooksT.configTab.security.item1}
                        </li>
                        <li className="flex gap-2">
                            <div className="h-1 w-1 rounded-full bg-zinc-300 mt-1.5 shrink-0" />
                            {webhooksT.configTab.security.item2}
                        </li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-900">
                        <Settings className="h-4 w-4 text-brandy-rose" />
                        <h4 className="text-sm font-bold">{webhooksT.configTab.technical.title}</h4>
                    </div>
                    <div className="border border-zinc-100 rounded-xl overflow-hidden">
                        <Table>
                            <TableBody>
                                <TableRow className="hover:bg-transparent">
                                    <TableCell className="text-[10px] font-bold text-zinc-400 uppercase py-2">{webhooksT.configTab.technical.timeout}</TableCell>
                                    <TableCell className="text-right text-xs py-2 font-mono">30 {webhooksT.seconds}</TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-transparent">
                                    <TableCell className="text-[10px] font-bold text-zinc-400 uppercase py-2">{webhooksT.configTab.technical.timeoutChat}</TableCell>
                                    <TableCell className="text-right text-xs py-2 font-mono">60 {webhooksT.seconds}</TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-transparent">
                                    <TableCell className="text-[10px] font-bold text-zinc-400 uppercase py-2">{webhooksT.configTab.technical.retries}</TableCell>
                                    <TableCell className="text-right text-xs py-2 font-mono">3x</TableCell>
                                </TableRow>
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableCell className="text-[10px] font-bold text-zinc-400 uppercase py-2">{webhooksT.configTab.technical.retryDelay}</TableCell>
                                    <TableCell className="text-right text-xs py-2 font-mono">1.0s</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </section>
            </div>
        </div>
    )
}
