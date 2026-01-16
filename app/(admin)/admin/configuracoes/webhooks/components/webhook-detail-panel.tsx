'use client'

import { WebhookConfig } from "../data/webhooks-data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CopyCodeBlock } from "./copy-code-block"
import { getWebhookUrl, getWebhookSecret } from "@/lib/config/webhooks"
import { cn } from "@/lib/utils"
import {
    Terminal,
    Braces,
    FileJson,
    Settings2,
    ArrowRight,
    Clock,
    RefreshCcw,
    Zap,
    Globe
} from 'lucide-react'

interface WebhookDetailPanelProps {
    webhook: WebhookConfig | null
}

export function WebhookDetailPanel({ webhook }: WebhookDetailPanelProps) {
    if (!webhook) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <Zap className="h-8 w-8 text-zinc-300" />
                </div>
                <p className="text-zinc-500 font-serif text-lg">Selecione um webhook para ver os detalhes técnicos</p>
                <p className="text-zinc-400 text-sm mt-1">Clique em qualquer um dos botões acima para explorar a documentação</p>
            </div>
        )
    }

    const secret = getWebhookSecret() || 'SUA_CHAVE_SECRET'
    const fullUrl = webhook.direction === 'outbound'
        ? (getWebhookUrl(webhook.id as any) || 'https://seu-n8n.com/webhook' + webhook.endpoint)
        : 'https://seu-dominio.com' + webhook.endpoint

    // Gerar Interface TypeScript
    const tsInterface = `/**
 * Payload para o evento: ${webhook.id}
 * Direção: ${webhook.direction === 'outbound' ? 'App -> n8n' : 'n8n -> App'}
 */
export interface ${webhook.interfaceName} {
${webhook.fields.map(f => `  /** ${f.description} */
  ${f.name}${f.required ? '' : '?'}: ${f.type}`).join('\n')}
}`

    // Gerar comando cURL para teste
    const curlCommand = `curl -X POST "${fullUrl}" \\
     -H "Content-Type: application/json" \\
     -H "x-webhook-secret: ${secret}" \\
     -d '${JSON.stringify(webhook.example, null, 2).replace(/'/g, "'\\''")}'`

    return (
        <Card id="webhook-details" className="border-brandy-rose shadow-xl shadow-brandy-rose/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="bg-zinc-50/80 border-b border-zinc-100 pb-6 pt-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="text-4xl">{webhook.categoryIcon}</div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant={webhook.direction === 'outbound' ? 'default' : 'secondary'} className={
                                    webhook.direction === 'outbound'
                                        ? "bg-brandy-rose hover:bg-brandy-rose/90"
                                        : "bg-zinc-900 text-white"
                                }>
                                    {webhook.direction === 'outbound' ? 'Outbound' : 'Inbound'}
                                </Badge>
                                <code className="text-zinc-400 text-xs px-2 py-0.5 bg-white border border-zinc-200 rounded">{webhook.id}</code>
                            </div>
                            <CardTitle className="text-3xl font-serif text-zinc-900">
                                {webhook.id.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                            </CardTitle>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-8 space-y-10">
                {/* Bloco de Configuração Rápida */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                            <Settings2 className="h-4 w-4 text-brandy-rose" />
                            Configuração
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                            <DetailItem label="Método" value={webhook.method} />
                            <DetailItem label="Timeout" value={`${webhook.timeout / 1000}s`} icon={<Clock className="h-3 w-3" />} />
                            {webhook.retries && <DetailItem label="Retries" value={webhook.retries.toString()} icon={<RefreshCcw className="h-3 w-3" />} />}
                            <DetailItem label={webhook.direction === 'outbound' ? 'Hook Origin' : 'Handler'} value={webhook.hook || webhook.handler || '-'} secondary />
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                            <Globe className="h-4 w-4 text-brandy-rose" />
                            Endpoint
                        </h4>
                        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg font-mono text-sm break-all flex items-center justify-between group">
                            <span className="text-zinc-700">{fullUrl}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 italic">
                            * A URL completa depende da configuração de <code className="text-[10px] bg-zinc-100 px-1 rounded">NEXT_PUBLIC_N8N_WEBHOOK_URL</code>
                        </p>
                    </div>
                </section>

                <Separator className="bg-zinc-100" />

                {/* Tabela de Campos */}
                <section className="space-y-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                        <Braces className="h-4 w-4 text-brandy-rose" />
                        Estrutura do Payload
                    </h4>
                    <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-bold">
                                <tr>
                                    <th className="px-4 py-3 border-b border-zinc-200">Campo</th>
                                    <th className="px-4 py-3 border-b border-zinc-200">Tipo</th>
                                    <th className="px-4 py-3 border-b border-zinc-200">Req.</th>
                                    <th className="px-4 py-3 border-b border-zinc-200">Descrição</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                {webhook.fields.map(field => (
                                    <tr key={field.name} className="hover:bg-zinc-50/50">
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-900">{field.name}</td>
                                        <td className="px-4 py-3 font-mono text-[11px] text-brandy-rose">{field.type}</td>
                                        <td className="px-4 py-3 text-xs">
                                            {field.required ? (
                                                <span className="text-red-500">Sim</span>
                                            ) : (
                                                <span className="text-zinc-400">Não</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-600 leading-relaxed">{field.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Blocos de Código */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <section className="space-y-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                            <Braces className="h-4 w-4 text-brandy-rose" />
                            Interface TypeScript
                        </h4>
                        <CopyCodeBlock code={tsInterface} language="typescript" title={webhook.interfaceName} className="h-[400px]" />
                    </section>

                    <section className="space-y-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                            <FileJson className="h-4 w-4 text-brandy-rose" />
                            Exemplo JSON
                        </h4>
                        <CopyCodeBlock
                            code={JSON.stringify(webhook.example, null, 2)}
                            language="json"
                            title="payload_example.json"
                            className="h-[400px]"
                        />
                    </section>
                </div>

                <section className="space-y-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 uppercase tracking-wider">
                        <Terminal className="h-4 w-4 text-brandy-rose" />
                        Comando de Teste (cURL)
                    </h4>
                    <CopyCodeBlock code={curlCommand} language="bash" title="curl_test.sh" />
                </section>

                {/* Headers Necessários */}
                <section className="space-y-4">
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Headers Obrigatórios</h4>
                    <CopyCodeBlock
                        code={JSON.stringify({
                            "Content-Type": "application/json",
                            "x-webhook-secret": secret.substring(0, 4) + "***"
                        }, null, 2)}
                        language="json"
                    />
                </section>
            </CardContent>
        </Card>
    )
}

function DetailItem({ label, value, icon, secondary }: { label: string, value: string, icon?: React.ReactNode, secondary?: boolean }) {
    return (
        <div className="flex items-center justify-between text-sm py-2 px-3 bg-zinc-50 rounded border border-zinc-100">
            <span className="text-zinc-500 flex items-center gap-1">
                {icon}
                {label}
            </span>
            <span className={cn(
                "font-medium",
                secondary ? "text-brandy-rose/80 font-mono text-xs" : "text-zinc-900"
            )}>{value}</span>
        </div>
    )
}
