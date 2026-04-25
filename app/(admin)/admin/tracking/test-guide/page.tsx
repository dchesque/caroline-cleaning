// app/(admin)/admin/tracking/test-guide/page.tsx
//
// Step-by-step roadmap for validating the Meta CAPI integration end-to-end.
// Server-rendered (no interactivity), inherits the admin layout.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
    title: 'Meta CAPI · Test Guide',
}

export default function MetaCapiTestGuidePage() {
    return (
        <div className="container max-w-4xl py-8 space-y-6">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Meta CAPI — Test Guide</h1>
                <p className="text-muted-foreground">
                    Roteiro para validar a integração Pixel + Conversions API ponta a ponta.
                    Execute na ordem; cada passo confirma uma camada.
                </p>
            </header>

            <Step
                n={1}
                title="Setup do Test Events"
                duration="10 min"
            >
                <ol className="list-decimal pl-6 space-y-2">
                    <li>
                        Meta Events Manager → seu pixel → <strong>Test Events</strong> →
                        copiar o <code className="px-1.5 py-0.5 rounded bg-muted">TEST&lt;código&gt;</code>
                    </li>
                    <li>
                        Vai em{' '}
                        <Link href="/admin/configuracoes/trackeamento" className="text-blue-600 underline">
                            /admin/configuracoes/trackeamento
                        </Link>
                        {' '}→ campo <strong>Test Event Code</strong> → cola → <strong>Salvar</strong>
                    </li>
                    <li>
                        Confere que o cache invalida: F12 → Network → o save deve disparar{' '}
                        <code className="px-1.5 py-0.5 rounded bg-muted">POST /api/tracking/cache-invalidate</code>
                        {' '}com 200
                    </li>
                    <li>Mantém a aba do <strong>Test Events</strong> aberta no Meta — eventos chegam em tempo real ali</li>
                </ol>
            </Step>

            <Step n={2} title="Sanidade do Pixel Helper" duration="5 min">
                <ol className="list-decimal pl-6 space-y-2">
                    <li>Abre o site em aba anônima com a extensão <strong>Meta Pixel Helper</strong> ativa</li>
                    <li><code>PageView</code> deve aparecer <strong>1× só</strong> (não duplicado)</li>
                    <li>
                        No Test Events do Meta: <code>PageView</code> com{' '}
                        <Badge variant="outline">EMQ ≥ 7</Badge>
                        {' '}e badge "Browser and Server" combinados (= dedup OK)
                    </li>
                </ol>
            </Step>

            <Step n={3} title="Lead chat — caminho novo" duration="15 min">
                <h4 className="font-semibold mt-4">Cenário A — lead novo do zero</h4>
                <ol className="list-decimal pl-6 space-y-2 mt-2">
                    <li>Abre o chat, preenche nome / telefone / ZIP / endereço completo até salvar</li>
                    <li>
                        No Test Events deve aparecer <strong>1 evento <code>Lead</code></strong>:
                        <ul className="list-none pl-4 space-y-1 mt-2">
                            <li><Check /> um único evento (não dois)</li>
                            <li><Check /> badge "Browser and Server" (dedup funcionando)</li>
                            <li><Check /> <code>event_source_url</code> com a URL real</li>
                            <li><Check /> EMQ ≥ 7 (phone + name + zip + country + ip + ua + fbp)</li>
                        </ul>
                    </li>
                    <li>
                        DB:{' '}
                        <code className="px-1.5 py-0.5 rounded bg-muted text-sm">
                            select status, origem from clientes where telefone='...'
                        </code>
                        {' '}→ status <code>lead</code>, origem <code>lead_chat</code>
                    </li>
                    <li>Admin recebe notificação Evolution</li>
                </ol>

                <h4 className="font-semibold mt-6">
                    Cenário B — upgrade <code>lead_incomplete → lead</code>
                    <span className="text-xs ml-2 text-muted-foreground font-normal">(o gap que consertamos)</span>
                </h4>
                <ol className="list-decimal pl-6 space-y-2 mt-2">
                    <li>Inicia chat, dá <strong>só telefone</strong>, fecha o widget</li>
                    <li>DB: confirma <code>status='lead_incomplete'</code></li>
                    <li>Volta, completa nome / ZIP / endereço</li>
                    <li>
                        Test Events: <strong>deve aparecer 1 evento <code>Lead</code></strong>
                        {' '}(antes do fix não vinha)
                    </li>
                    <li>DB: status virou <code>lead</code>, mesma row (id não mudou)</li>
                    <li>Admin recebe notificação Evolution (também novo)</li>
                </ol>

                <h4 className="font-semibold mt-6">Cenário C — duplicado real</h4>
                <ol className="list-decimal pl-6 space-y-2 mt-2">
                    <li>Usa um telefone que já está como <code>status='lead'</code></li>
                    <li>Test Events: <strong>NÃO</strong> deve aparecer evento <code>Lead</code> extra</li>
                    <li>Mensagem "Welcome back, ..." aparece no chat</li>
                </ol>
            </Step>

            <Step n={4} title="Eventos quebrados antes do fix (mapping)" duration="10 min">
                <p className="text-sm text-muted-foreground mb-3">
                    Esses estavam duplicando porque o nome ia diferente Browser ↔ Server. Agora o CAPI aplica o mesmo mapping.
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2">Disparo no site</th>
                                <th className="text-left p-2">Browser manda</th>
                                <th className="text-left p-2">CAPI manda agora</th>
                                <th className="text-left p-2">Esperado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="p-2">Botão WhatsApp footer</td>
                                <td className="p-2"><code>Contact</code></td>
                                <td className="p-2"><code>Contact</code></td>
                                <td className="p-2">1 evento, dedup ✓</td>
                            </tr>
                            <tr className="border-b">
                                <td className="p-2">Botão "Call now"</td>
                                <td className="p-2"><code>Contact</code></td>
                                <td className="p-2"><code>Contact</code></td>
                                <td className="p-2">1 evento, dedup ✓</td>
                            </tr>
                            <tr className="border-b">
                                <td className="p-2">Abrir Carol / lead-chat</td>
                                <td className="p-2"><code>InitiateCheckout</code></td>
                                <td className="p-2"><code>InitiateCheckout</code></td>
                                <td className="p-2">1 evento, dedup ✓</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                    Antes o servidor mandava <code>ClickToWhatsApp</code> / <code>ClickToCall</code> / <code>InitiateChat</code> cru → Meta contava 2×.
                </p>
            </Step>

            <Step n={5} title="EMQ e cobertura (24h depois)" duration="—">
                <ol className="list-decimal pl-6 space-y-2">
                    <li>Events Manager → <strong>Diagnostics</strong> → procura warnings</li>
                    <li>
                        Events Manager → cada evento → <strong>Match Quality</strong> deve subir
                        (PageView estava em <Badge variant="outline">6.1</Badge>, deve passar de 7+)
                    </li>
                    <li><strong>Coverage:</strong> % de eventos do Pixel cobertos pelo CAPI deve ser ≥ 90%</li>
                    <li><strong>Deduplication rate:</strong> deve ser ≥ 90% para Lead / PageView</li>
                </ol>
            </Step>

            <Step n={6} title="Cleanup" duration="2 min">
                <ol className="list-decimal pl-6 space-y-2">
                    <li>
                        Após validar tudo, <strong>remove</strong> o Test Event Code no admin
                        (senão eventos prod continuam indo pro Test Events tab e não pra produção)
                    </li>
                    <li>Confere mais uma vez que o save invalidou o cache</li>
                </ol>
            </Step>

            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Sinais de problema
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Sintoma</th>
                                    <th className="text-left p-2">Provavelmente é</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="p-2">Evento aparece só no Browser, nunca no Server</td>
                                    <td className="p-2"><code>meta_capi_enabled=false</code> ou <code>access_token</code> inválido</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="p-2">Evento aparece só no Server</td>
                                    <td className="p-2">Pixel não disparando (script bloqueado, adblock, ou erro JS)</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="p-2">Aparece 2× (não dedupado)</td>
                                    <td className="p-2"><code>event_id</code> diferente OU <code>event_name</code> ainda diferente OU server chegou antes do browser</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="p-2">EMQ baixo (&lt; 6)</td>
                                    <td className="p-2">Faltando email / phone / zip OU sem normalização (lowercase / E.164)</td>
                                </tr>
                                <tr>
                                    <td className="p-2"><code>event_source_url</code> vazio no Test Events</td>
                                    <td className="p-2">
                                        <code>eventSourceUrl</code> não está chegando do client → checa logs{' '}
                                        <code>[meta-capi] missing event_source_url</code>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Info className="w-4 h-4 text-blue-600" />
                        Atalhos úteis
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div>
                        <Link href="/admin/configuracoes/trackeamento" className="text-blue-600 underline">
                            Configurações de tracking
                        </Link>
                        {' '}— pixel ID, access token, test event code
                    </div>
                    <div>
                        <Link href="/admin/tracking/events" className="text-blue-600 underline">
                            Events log
                        </Link>
                        {' '}— histórico de eventos enviados ao Meta com status HTTP e fbtrace_id
                    </div>
                    <div>
                        <a
                            href="https://business.facebook.com/events_manager2"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                        >
                            Meta Events Manager ↗
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function Step({ n, title, duration, children }: { n: number; title: string; duration: string; children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {n}
                    </span>
                    <span>{title}</span>
                    <Badge variant="outline" className="ml-auto text-xs font-normal">
                        {duration}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">{children}</CardContent>
        </Card>
    )
}

function Check() {
    return <CheckCircle2 className="inline w-3.5 h-3.5 text-green-600 mr-1 -mt-0.5" />
}
