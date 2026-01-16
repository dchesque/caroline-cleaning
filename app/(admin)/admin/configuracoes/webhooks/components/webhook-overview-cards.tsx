import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownLeft, ShieldCheck, RefreshCw, Clock } from 'lucide-react'

export function WebhookOverviewCards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Outbound Card */}
            <Card className="border-brandy-rose/20 bg-white/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-serif text-brandy-rose flex items-center gap-2">
                            <div className="p-2 bg-brandy-rose/10 rounded-lg">
                                <ArrowUpRight className="h-5 w-5" />
                            </div>
                            Outbound
                        </CardTitle>
                        <CardDescription>App → n8n (Eventos do Sistema)</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-brandy-rose/5 border-brandy-rose/20 text-brandy-rose">
                        15 webhooks
                    </Badge>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3 mt-2">
                        <li className="flex items-center gap-2 text-sm text-zinc-600">
                            <ShieldCheck className="h-4 w-4 text-brandy-rose/60" />
                            <span>Auth: Header <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">x-webhook-secret</code></span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-zinc-600">
                            <RefreshCw className="h-4 w-4 text-brandy-rose/60" />
                            <span>Retry: 3 tentativas com backoff exponencial</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-zinc-600">
                            <Clock className="h-4 w-4 text-brandy-rose/60" />
                            <span>Timeout: 30s padrão (chat: 60s)</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-zinc-600">
                            <div className="w-4 h-4 rounded-full bg-brandy-rose/10 flex items-center justify-center text-[10px] font-bold text-brandy-rose">M</div>
                            <span>Método: <strong>POST</strong> (Content-Type: application/json)</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Inbound Card */}
            <Card className="border-brandy-rose/20 bg-white/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-serif text-brandy-rose flex items-center gap-2">
                            <div className="p-2 bg-brandy-rose/10 rounded-lg">
                                <ArrowDownLeft className="h-5 w-5" />
                            </div>
                            Inbound
                        </CardTitle>
                        <CardDescription>n8n → App (Ações Externas)</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-brandy-rose/5 border-brandy-rose/20 text-brandy-rose">
                        4 webhooks
                    </Badge>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3 mt-2">
                        <li className="flex items-center gap-2 text-sm text-zinc-600">
                            <ShieldCheck className="h-4 w-4 text-brandy-rose/60" />
                            <span>Auth: Header <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">x-webhook-secret</code></span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-zinc-600">
                            <ArrowDownLeft className="h-4 w-4 text-brandy-rose/60" />
                            <span>Endpoint: <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">/api/webhook/n8n</code></span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-zinc-600">
                            <Clock className="h-4 w-4 text-brandy-rose/60" />
                            <span>Timeout: 30s sugerido</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-zinc-600">
                            <div className="w-4 h-4 rounded-full bg-brandy-rose/10 flex items-center justify-center text-[10px] font-bold text-brandy-rose">M</div>
                            <span>Método: <strong>POST</strong> (Content-Type: application/json)</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}
