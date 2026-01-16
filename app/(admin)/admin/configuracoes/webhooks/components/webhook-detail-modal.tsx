'use client'

import { WebhookConfig } from '../data/webhooks-data'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { CopyButton } from './copy-button'
import { getWebhookUrl, getWebhookSecret } from '@/lib/config/webhooks'
import { Terminal, Braces, FileJson, Settings2, Info } from 'lucide-react'

interface WebhookDetailModalProps {
    webhook: WebhookConfig | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

import { useAdminI18n } from '@/lib/admin-i18n/context'

export function WebhookDetailModal({ webhook, open, onOpenChange }: WebhookDetailModalProps) {
    const { t } = useAdminI18n()
    const webhooksT = t('settings').webhooks

    if (!webhook) return null

    const secret = getWebhookSecret() || webhooksT.modal.secretPlaceholder
    const fullUrl = webhook.direction === 'outbound'
        ? (getWebhookUrl(webhook.id as any) || 'https://seu-n8n.com/webhook' + webhook.endpoint)
        : 'https://seu-dominio.com' + webhook.endpoint

    const getCategoryName = (cat: string) => {
        const key = cat.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(' ', '_') as keyof typeof webhooksT.categories
        return webhooksT.categories[key] || cat
    }

    const tsInterface = `/**
 * ${webhooksT.modal.payloadTitle}: ${webhook.id}
 */
export interface ${webhook.interfaceName} {
${webhook.fields.map(f => `  /** ${f.description} */
  ${f.name}${f.required ? '' : '?'} : ${f.type}`).join('\n')}}`

    const curlCommand = `curl -X POST "${fullUrl}" \\
     -H "Content-Type: application/json" \\
     -H "x-webhook-secret: ${secret}" \\
     -d '${JSON.stringify(webhook.example, null, 2).replace(/\'/g, "'\\''")}'`

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-2 border-b bg-zinc-50/50">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">{webhook.categoryIcon}</span>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight">
                            {webhook.direction}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight text-zinc-400">
                            {getCategoryName(webhook.category)}
                        </Badge>
                    </div>
                    <DialogTitle className="font-mono text-xl">{webhook.id}</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        {webhook.description}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="config" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b bg-white">
                        <TabsList className="h-12 w-full justify-start gap-6 bg-transparent p-0 rounded-none border-b-0">
                            <TabsTrigger
                                value="config"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brandy-rose rounded-none border-b-2 border-transparent px-1 h-12"
                            >
                                <Settings2 className="h-4 w-4 mr-2" />
                                {webhooksT.modal.config}
                            </TabsTrigger>
                            <TabsTrigger
                                value="payload"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brandy-rose rounded-none border-b-2 border-transparent px-1 h-12"
                            >
                                <Braces className="h-4 w-4 mr-2" />
                                {webhooksT.modal.payload}
                            </TabsTrigger>
                            <TabsTrigger
                                value="example"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brandy-rose rounded-none border-b-2 border-transparent px-1 h-12"
                            >
                                <FileJson className="h-4 w-4 mr-2" />
                                {webhooksT.modal.example}
                            </TabsTrigger>
                            <TabsTrigger
                                value="curl"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-brandy-rose rounded-none border-b-2 border-transparent px-1 h-12"
                            >
                                <Terminal className="h-4 w-4 mr-2" />
                                {webhooksT.modal.curl}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-6">
                            <TabsContent value="config" className="m-0 space-y-6 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase">{webhooksT.modal.endpoint}</p>
                                        <p className="font-mono text-sm bg-zinc-50 p-2 rounded border border-zinc-100">{webhook.endpoint}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase">{webhooksT.modal.method}</p>
                                        <p className="font-mono text-sm bg-zinc-50 p-2 rounded border border-zinc-100">{webhook.method}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase">{webhooksT.modal.timeout}</p>
                                        <p className="font-mono text-sm bg-zinc-50 p-2 rounded border border-zinc-100">{webhook.timeout}ms</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase">{webhook.direction === 'outbound' ? webhooksT.modal.retries : webhooksT.modal.interface}</p>
                                        <p className="font-mono text-sm bg-zinc-50 p-2 rounded border border-zinc-100">{webhook.direction === 'outbound' ? webhook.retries : webhook.interfaceName}</p>
                                    </div>
                                    <div className="col-span-full space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase">{webhooksT.modal.url}</p>
                                            <CopyButton text={fullUrl} variant="icon" className="h-4 w-4" />
                                        </div>
                                        <p className="font-mono text-xs bg-zinc-50 p-3 rounded border border-zinc-100 break-all text-zinc-600 line-clamp-2">{fullUrl}</p>
                                    </div>
                                    <div className="col-span-full space-y-1">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase">{webhook.direction === 'outbound' ? webhooksT.modal.hook : webhooksT.modal.handler}</p>
                                        <p className="font-mono text-sm bg-zinc-900 text-brandy-rose p-3 rounded">{webhook.direction === 'outbound' ? webhook.hook : webhook.handler}</p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="payload" className="m-0 space-y-6 animate-in fade-in duration-300">
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-zinc-900">{webhooksT.modal.tsInterface}</h4>
                                        <CopyButton text={tsInterface} label={webhooksT.modal.copyInterface} />
                                    </div>
                                    <pre className="bg-zinc-900 text-zinc-300 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-zinc-800 leading-relaxed">
                                        {tsInterface}
                                    </pre>
                                </section>

                                <section className="space-y-4 pt-4">
                                    <h4 className="text-sm font-bold text-zinc-900">{webhooksT.modal.objectFields}</h4>
                                    <div className="border border-zinc-100 rounded-xl overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-zinc-50/50">
                                                <TableRow>
                                                    <TableHead className="w-[150px] text-[10px] font-bold uppercase">{webhooksT.modal.table.field}</TableHead>
                                                    <TableHead className="w-[100px] text-[10px] font-bold uppercase">{webhooksT.modal.table.type}</TableHead>
                                                    <TableHead className="w-[50px] text-[10px] font-bold uppercase">{webhooksT.modal.table.required}</TableHead>
                                                    <TableHead className="text-[10px] font-bold uppercase">{webhooksT.modal.table.desc}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {webhook.fields.map((field) => (
                                                    <TableRow key={field.name} className="hover:bg-zinc-50/50 transition-colors">
                                                        <TableCell className="font-mono text-xs font-bold text-zinc-900">{field.name}</TableCell>
                                                        <TableCell className="font-mono text-[10px] text-brandy-rose">{field.type}</TableCell>
                                                        <TableCell>
                                                            {field.required ?
                                                                <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-none text-[9px] px-1">{t('common').yes}</Badge> :
                                                                <Badge className="bg-zinc-50 text-zinc-400 hover:bg-zinc-50 border-none text-[9px] px-1">{t('common').no}</Badge>
                                                            }
                                                        </TableCell>
                                                        <TableCell className="text-xs text-zinc-500">{field.description}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </section>
                            </TabsContent>

                            <TabsContent value="example" className="m-0 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-zinc-900">{webhooksT.modal.jsonBody}</h4>
                                    <CopyButton text={JSON.stringify(webhook.example, null, 2)} label={webhooksT.modal.copyJson} />
                                </div>
                                <pre className="bg-zinc-900 text-zinc-300 p-6 rounded-xl text-xs font-mono overflow-x-auto border border-zinc-800 leading-relaxed shadow-inner">
                                    {JSON.stringify(webhook.example, null, 2)}
                                </pre>
                            </TabsContent>

                            <TabsContent value="curl" className="m-0 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-zinc-900">{webhooksT.modal.curlTitle}</h4>
                                    <CopyButton text={curlCommand} label={webhooksT.modal.copyCurl} />
                                </div>
                                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-inner">
                                    <pre className="text-zinc-300 text-xs font-mono whitespace-pre-wrap break-all leading-relaxed">
                                        {curlCommand}
                                    </pre>
                                </div>
                                <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3 items-start">
                                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">{webhooksT.modal.howToTest}</p>
                                        <p className="text-xs text-blue-600 leading-relaxed">
                                            {webhooksT.modal.howToTestDesc}
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
