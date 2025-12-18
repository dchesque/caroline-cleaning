'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    UserPlus
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function ConversaDetalhePage() {
    const params = useParams()
    const sessionId = params.sessionId as string
    const [messages, setMessages] = useState<any[]>([])
    const [leadInfo, setLeadInfo] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchMessages = async () => {
            setIsLoading(true)

            const { data } = await supabase
                .from('mensagens_chat')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })

            if (data && data.length > 0) {
                setMessages(data)
                // Get lead info from last message with lead_info
                const withLeadInfo = data.find(m => m.lead_info)
                if (withLeadInfo) {
                    setLeadInfo(withLeadInfo.lead_info)
                }
            }

            setIsLoading(false)
        }

        fetchMessages()
    }, [sessionId])

    // Scroll to bottom when messages load
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-48" />
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Skeleton className="h-[600px]" />
                    </div>
                    <Skeleton className="h-[300px]" />
                </div>
            </div>
        )
    }

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
                        {leadInfo?.nome || 'Visitante'}
                    </h1>
                    <p className="text-body text-muted-foreground">
                        Sessão: {sessionId.slice(0, 8)}...
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Messages */}
                <div className="lg:col-span-2">
                    <Card className="h-[calc(100vh-250px)] min-h-[500px] lg:h-[600px] flex flex-col">
                        <CardHeader className="border-b border-pampas">
                            <CardTitle className="text-h4 flex items-center gap-2">
                                Conversa
                                <Badge variant="secondary">
                                    {messages.length} mensagens
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        'flex',
                                        message.role === 'user' ? 'justify-end' : 'justify-start'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'max-w-[80%] rounded-lg px-4 py-2',
                                            message.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-desert-storm'
                                        )}
                                    >
                                        <p className="text-body-sm whitespace-pre-wrap">{message.content}</p>
                                        <p className={cn(
                                            'text-[10px] mt-1',
                                            message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                        )}>
                                            {format(new Date(message.created_at), 'HH:mm')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </CardContent>
                    </Card>
                </div>

                {/* Lead Info Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-h4 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Informações do Lead
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {leadInfo ? (
                                <>
                                    <div>
                                        <p className="text-caption text-muted-foreground">Nome</p>
                                        <p className="text-body font-medium">{leadInfo.nome || '-'}</p>
                                    </div>
                                    {leadInfo.telefone && (
                                        <div>
                                            <p className="text-caption text-muted-foreground">Telefone</p>
                                            <a
                                                href={`tel:${leadInfo.telefone}`}
                                                className="text-body font-medium flex items-center gap-2 hover:text-brandy-rose-600"
                                            >
                                                <Phone className="w-4 h-4" />
                                                {leadInfo.telefone}
                                            </a>
                                        </div>
                                    )}
                                    {leadInfo.email && (
                                        <div>
                                            <p className="text-caption text-muted-foreground">Email</p>
                                            <a
                                                href={`mailto:${leadInfo.email}`}
                                                className="text-body font-medium flex items-center gap-2 hover:text-brandy-rose-600"
                                            >
                                                <Mail className="w-4 h-4" />
                                                {leadInfo.email}
                                            </a>
                                        </div>
                                    )}
                                    {leadInfo.zip_code && (
                                        <div>
                                            <p className="text-caption text-muted-foreground">ZIP Code</p>
                                            <p className="text-body font-medium flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                {leadInfo.zip_code}
                                            </p>
                                        </div>
                                    )}
                                    {leadInfo.servico_interesse && (
                                        <div>
                                            <p className="text-caption text-muted-foreground">Interesse</p>
                                            <Badge>{leadInfo.servico_interesse}</Badge>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-pampas">
                                        <Button className="w-full gap-2">
                                            <UserPlus className="w-4 h-4" />
                                            Converter em Cliente
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground text-center py-4">
                                    Nenhuma informação coletada
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Session Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-h4">Detalhes da Sessão</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-caption text-muted-foreground">Iniciada em</p>
                                <p className="text-body-sm">
                                    {messages[0] && format(new Date(messages[0].created_at), 'dd/MM/yyyy HH:mm')}
                                </p>
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">Última mensagem</p>
                                <p className="text-body-sm">
                                    {messages[messages.length - 1] &&
                                        format(new Date(messages[messages.length - 1].created_at), 'dd/MM/yyyy HH:mm')}
                                </p>
                            </div>
                            <div>
                                <p className="text-caption text-muted-foreground">Duração</p>
                                <p className="text-body-sm">
                                    {messages.length >= 2 && (() => {
                                        const start = new Date(messages[0].created_at)
                                        const end = new Date(messages[messages.length - 1].created_at)
                                        const diff = Math.round((end.getTime() - start.getTime()) / 60000)
                                        return `${diff} minutos`
                                    })()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
