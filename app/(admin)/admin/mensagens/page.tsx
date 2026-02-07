'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, Search, Clock, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { useAdminI18n } from '@/lib/admin-i18n/context'

export default function MensagensPage() {
    const [sessions, setSessions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const { t, locale } = useAdminI18n()
    const messagesT = t('messages')
    const supabase = createClient()

    const dateLocale = locale === 'pt-BR' ? ptBR : enUS

    useEffect(() => {
        const fetchSessions = async () => {
            setIsLoading(true)

            // Buscar da view que já agrupa e traz contexto
            const { data, error } = await supabase
                .from('v_conversas_recentes')
                .select('*')

            if (error) {
                console.error('Error fetching sessions:', error)
                setIsLoading(false)
                return
            }

            const sessionsData = data?.map(session => {
                // Extrair info do lead do contexto caso não seja cliente vinculado
                const context = session.contexto || {}
                const nome = session.cliente_nome || context.cliente_nome || context.name
                const telefone = session.cliente_telefone || context.cliente_telefone || context.phone

                // Lógica de Identificação
                // 1. Cliente: Já vinculado e status != 'lead'
                // 2. Lead: Já vinculado mas status == 'lead'
                // 3. Novo Lead: Não vinculado mas já temos dados no contexto
                const isClient = session.cliente_id && session.cliente_status !== 'lead'
                const isIdentifiedLead = session.cliente_id && session.cliente_status === 'lead'
                const isNewLead = !session.cliente_id && (context.cliente_nome || context.name || context.cliente_telefone || context.phone)

                return {
                    session_id: session.session_id,
                    last_message: session.ultima_mensagem,
                    last_message_role: session.ultima_mensagem_role,
                    last_activity: session.last_activity,
                    messages_count: session.total_mensagens,
                    contact_type: isClient ? 'cliente' : (isIdentifiedLead || isNewLead ? 'lead' : 'visitante'),
                    lead_info: {
                        nome,
                        telefone
                    }
                }
            })

            setSessions(sessionsData || [])
            setIsLoading(false)
        }

        fetchSessions()
    }, [])

    // Filter sessions
    const filteredSessions = sessions.filter((session) => {
        if (!search) return true
        const searchLower = search.toLowerCase()
        return (
            session.session_id.toLowerCase().includes(searchLower) ||
            session.lead_info?.nome?.toLowerCase().includes(searchLower) ||
            session.lead_info?.telefone?.includes(search)
        )
    })

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="font-heading text-h2 text-foreground">{messagesT.title}</h1>
                    <p className="text-body text-muted-foreground">
                        {messagesT.subtitle}
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={messagesT.searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400 h-10"
                    />
                </div>
            </div>

            {/* Sessions List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
            ) : filteredSessions.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">{messagesT.noConversations}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredSessions.map((session) => (
                        <Link key={session.session_id} href={`/admin/mensagens/${session.session_id}`} className="block group">
                            <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-brandy-rose-400/50 group-hover:border-l-brandy-rose-400 bg-white/50 group-hover:bg-white">
                                <CardContent className="p-4 sm:p-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-pot-pourri flex-shrink-0 flex items-center justify-center border border-brandy-rose-100">
                                                {session.lead_info?.nome ? (
                                                    <span className="text-body font-semibold text-brandy-rose-700">
                                                        {session.lead_info.nome.charAt(0).toUpperCase()}
                                                    </span>
                                                ) : (
                                                    <User className="w-5 h-5 text-brandy-rose-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="font-semibold text-foreground group-hover:text-brandy-rose-700 transition-colors">
                                                        {session.lead_info?.nome || messagesT.visitor}
                                                    </p>
                                                    {session.contact_type === 'cliente' ? (
                                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 h-5 px-1.5 text-[10px]">
                                                            Cliente Registrado
                                                        </Badge>
                                                    ) : session.contact_type === 'lead' ? (
                                                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 h-5 px-1.5 text-[10px]">
                                                            Lead da Carol IA
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground font-normal h-5 px-1.5 text-[10px]">
                                                            Visitante
                                                        </Badge>
                                                    )}
                                                    {session.lead_info?.telefone && (
                                                        <span className="text-caption text-muted-foreground/70 hidden sm:inline">
                                                            • {session.lead_info.telefone}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-body-sm text-muted-foreground line-clamp-1">
                                                    {session.last_message_role === 'assistant' ? (
                                                        <span className="bg-desert-storm text-muted-foreground text-[10px] px-1 rounded border border-pampas">IA</span>
                                                    ) : (
                                                        <span className="bg-blue-50 text-blue-600 text-[10px] px-1 rounded border border-blue-100">U</span>
                                                    )}
                                                    <span className="truncate">
                                                        {session.last_message}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                                            <span className="text-caption text-muted-foreground whitespace-nowrap bg-pampas px-2 py-0.5 rounded-full">
                                                {formatDistanceToNow(new Date(session.last_activity), {
                                                    addSuffix: true,
                                                    locale: dateLocale
                                                })}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] font-normal border-gray-200">
                                                    {session.messages_count} {messagesT.msgs}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
