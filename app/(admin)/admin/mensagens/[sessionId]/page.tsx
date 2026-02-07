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
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'
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

            // 1. Buscar mensagens
            const { data: messagesData } = await supabase
                .from('mensagens_chat')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true })

            if (messagesData) {
                setMessages(messagesData)
            }

            // 2. Buscar info da sessão e cliente vinculado
            const { data: sessionData } = await supabase
                .from('chat_sessions')
                .select(`
                    id,
                    contexto,
                    clientes (
                        id,
                        nome,
                        telefone,
                        email,
                        status
                    )
                `)
                .eq('id', sessionId)
                .single()

            if (sessionData) {
                const context = sessionData.contexto || {}
                const cliente = sessionData.clientes as any

                // Lógica de Identificação similar à lista
                const isClient = cliente && cliente.status !== 'lead'
                const isIdentifiedLead = cliente && cliente.status === 'lead'
                const isNewLead = !cliente && (context.cliente_nome || context.name || context.cliente_telefone || context.phone)

                setLeadInfo({
                    nome: cliente?.nome || context.cliente_nome || context.name,
                    telefone: cliente?.telefone || context.cliente_telefone || context.phone,
                    email: cliente?.email || context.email,
                    zip_code: context.zip_code || context.postal_code,
                    servico_interesse: context.servico_selecionado || context.service_interest,
                    contact_type: isClient ? 'cliente' : (isIdentifiedLead || isNewLead ? 'lead' : 'visitante')
                })
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
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-white shadow-sm border border-gray-100">
                    <Link href="/admin/mensagens">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="font-heading text-h2 text-foreground">
                            {leadInfo?.nome || 'Visitante'}
                        </h1>
                        {leadInfo?.contact_type === 'cliente' ? (
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 px-2 py-0.5">
                                Cliente Registrado
                            </Badge>
                        ) : leadInfo?.contact_type === 'lead' ? (
                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 px-2 py-0.5">
                                Lead da Carol IA
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-muted-foreground font-normal px-2 py-0.5">
                                Visitante
                            </Badge>
                        )}
                    </div>
                    <p className="text-caption text-muted-foreground mt-0.5">
                        ID da Sessão: <code className="bg-pampas px-1.5 py-0.5 rounded text-[10px]">{sessionId}</code>
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Chat Area */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <Card className="flex-1 flex flex-col bg-white overflow-hidden shadow-sm border-gray-100">
                        <CardHeader className="py-3 px-6 border-b border-pampas flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-body font-semibold">Conversa</CardTitle>
                                <Badge variant="secondary" className="bg-desert-storm text-muted-foreground font-normal border-pampas">
                                    {messages.length} mensagens
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[500px] max-h-[700px] scroll-smooth bg-pampas/20">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={clsx(
                                        "flex flex-col max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto items-end" : "items-start"
                                    )}
                                >
                                    <div
                                        className={clsx(
                                            "rounded-2xl px-4 py-2.5 shadow-sm text-body-sm transition-all duration-200",
                                            msg.role === 'user'
                                                ? "bg-brandy-rose-200 text-brandy-rose-900 rounded-tr-none hover:bg-brandy-rose-300"
                                                : "bg-white border border-gray-100 text-foreground rounded-tl-none hover:border-brandy-rose-200"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/60 mt-1 px-1">
                                        {format(new Date(msg.created_at), 'HH:mm')}
                                    </span>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="py-3 px-6 border-b border-pampas">
                            <CardTitle className="text-body font-semibold flex items-center gap-2">
                                <User className="w-4 h-4 text-brandy-rose-600" />
                                {leadInfo.contact_type === 'cliente' ? 'Informações do Cliente' : 'Informações do Lead'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {leadInfo ? (
                                <>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <p className="text-caption text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Nome</p>
                                            <p className="text-body font-medium">{leadInfo.nome || '-'}</p>
                                        </div>
                                        {leadInfo.telefone && (
                                            <div>
                                                <p className="text-caption text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Telefone</p>
                                                <p className="text-body font-medium">{leadInfo.telefone}</p>
                                            </div>
                                        )}
                                        {leadInfo.email && (
                                            <div>
                                                <p className="text-caption text-muted-foreground mb-1 uppercase tracking-wider font-semibold">E-mail</p>
                                                <p className="text-body font-medium">{leadInfo.email}</p>
                                            </div>
                                        )}
                                        {leadInfo.zip_code && (
                                            <div>
                                                <p className="text-caption text-muted-foreground mb-1 uppercase tracking-wider font-semibold">ZIP Code</p>
                                                <p className="text-body font-medium">{leadInfo.zip_code}</p>
                                            </div>
                                        )}
                                        {leadInfo.servico_interesse && (
                                            <div>
                                                <p className="text-caption text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Serviço de Interesse</p>
                                                <Badge className="mt-1 bg-pot-pourri text-brandy-rose-700 border-brandy-rose-100 hover:bg-brandy-rose-50">
                                                    {leadInfo.servico_interesse}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-pampas">
                                        {leadInfo.contact_type === 'cliente' ? (
                                            <Button variant="outline" className="w-full gap-2 border-gray-200 hover:bg-desert-storm hover:text-foreground" asChild>
                                                <Link href={`/admin/clientes`}>
                                                    <User className="w-4 h-4" />
                                                    Ver Perfil do Cliente
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button className="w-full gap-2 bg-brandy-rose-500 hover:bg-brandy-rose-600 text-white shadow-sm transition-all duration-200">
                                                <UserPlus className="w-4 h-4" />
                                                Converter em Cliente
                                            </Button>
                                        )}
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
