// app/(admin)/admin/mensagens/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Bot } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function MensagemDetalhePage({ params }: PageProps) {
    const { id: sessionId } = await params
    const supabase = await createClient()

    // Buscar todas as mensagens da sessão
    const { data: messages, error } = await supabase
        .from('mensagens_chat')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

    if (error || !messages || messages.length === 0) {
        notFound()
    }

    // Info do lead (se houver, pega da última mensagem que tiver)
    const lastMsgWithLeadInfo = messages.find(m => m.lead_info)
    const leadInfo = lastMsgWithLeadInfo?.lead_info

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/mensagens">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="font-heading text-h2 text-foreground">
                        Conversa
                    </h1>
                    <p className="text-body text-muted-foreground">
                        {leadInfo?.nome || 'Visitante'} • {messages.length} mensagens
                    </p>
                </div>
            </div>

            {/* Lead Info */}
            {leadInfo && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4">Informações do Lead</CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-3 gap-4">
                        {leadInfo.nome && (
                            <div>
                                <p className="text-caption text-muted-foreground">Nome</p>
                                <p className="font-medium">{leadInfo.nome}</p>
                            </div>
                        )}
                        {leadInfo.telefone && (
                            <div>
                                <p className="text-caption text-muted-foreground">Telefone</p>
                                <p className="font-medium">{leadInfo.telefone}</p>
                            </div>
                        )}
                        {leadInfo.email && (
                            <div>
                                <p className="text-caption text-muted-foreground">Email</p>
                                <p className="font-medium">{leadInfo.email}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Messages */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-h4">Histórico da Conversa</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    'flex gap-3',
                                    msg.role === 'user' ? 'flex-row-reverse' : ''
                                )}
                            >
                                <div className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                    msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-pot-pourri text-brandy-rose-600'
                                )}>
                                    {msg.role === 'user' ? (
                                        <User className="w-4 h-4" />
                                    ) : (
                                        <Bot className="w-4 h-4" />
                                    )}
                                </div>
                                <div className={cn(
                                    'max-w-[70%] rounded-2xl px-4 py-2.5',
                                    msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                                        : 'bg-pampas rounded-bl-sm'
                                )}>
                                    <p className="text-body whitespace-pre-wrap">{msg.content}</p>
                                    <p className={cn(
                                        'text-[10px] mt-1',
                                        msg.role === 'user'
                                            ? 'text-primary-foreground/70 text-right'
                                            : 'text-muted-foreground'
                                    )}>
                                        {format(new Date(msg.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
