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
import { ptBR } from 'date-fns/locale'

export default function MensagensPage() {
    const [sessions, setSessions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const supabase = createClient()

    useEffect(() => {
        const fetchSessions = async () => {
            setIsLoading(true)

            // Get unique sessions with latest message
            const { data } = await supabase
                .from('mensagens_chat')
                .select('session_id, content, role, created_at, lead_info')
                .order('created_at', { ascending: false })

            // Group by session
            const sessionMap = new Map()
            data?.forEach((msg) => {
                if (!sessionMap.has(msg.session_id)) {
                    sessionMap.set(msg.session_id, {
                        session_id: msg.session_id,
                        last_message: msg.content,
                        last_message_role: msg.role,
                        last_activity: msg.created_at,
                        lead_info: msg.lead_info,
                        messages_count: 1,
                    })
                } else {
                    sessionMap.get(msg.session_id).messages_count++
                }
            })

            setSessions(Array.from(sessionMap.values()))
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
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="font-heading text-h2 text-foreground">Mensagens</h1>
                <p className="text-body text-muted-foreground">
                    Histórico de conversas com a Carol (IA)
                </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome ou telefone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Sessions List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
                </div>
            ) : filteredSessions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhuma conversa encontrada</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredSessions.map((session) => (
                        <Link key={session.session_id} href={`/admin/mensagens/${session.session_id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-pot-pourri flex items-center justify-center">
                                                {session.lead_info?.nome ? (
                                                    <span className="text-body font-semibold text-brandy-rose-700">
                                                        {session.lead_info.nome.charAt(0).toUpperCase()}
                                                    </span>
                                                ) : (
                                                    <User className="w-5 h-5 text-brandy-rose-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">
                                                        {session.lead_info?.nome || 'Visitante'}
                                                    </p>
                                                    {session.lead_info?.telefone && (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {session.lead_info.telefone}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-body-sm text-muted-foreground truncate mt-1">
                                                    {session.last_message_role === 'assistant' && '🤖 '}
                                                    {session.last_message?.slice(0, 100)}
                                                    {session.last_message?.length > 100 && '...'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-caption text-muted-foreground">
                                                {formatDistanceToNow(new Date(session.last_activity), {
                                                    addSuffix: true,
                                                    locale: ptBR
                                                })}
                                            </p>
                                            <Badge variant="outline" className="text-[10px] mt-1">
                                                {session.messages_count} msgs
                                            </Badge>
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
