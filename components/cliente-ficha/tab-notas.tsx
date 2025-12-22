'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    StickyNote,
    Lock,
    Globe,
    Edit3,
    Save,
    X,
    Clock
} from 'lucide-react'
import { format } from 'date-fns'

interface TabNotasProps {
    client: any
}

export function TabNotas({ client }: TabNotasProps) {
    const [notasInternas, setNotasInternas] = useState(client.notas_internas || '')
    const [notasPublicas, setNotasPublicas] = useState(client.notas || '')
    const [editingInternas, setEditingInternas] = useState(false)
    const [editingPublicas, setEditingPublicas] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleSaveInternas = async () => {
        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('clientes')
                .update({ notas_internas: notasInternas })
                .eq('id', client.id)

            if (error) throw error
            toast.success('Notas internas salvas!')
            setEditingInternas(false)
        } catch (error) {
            toast.error('Erro ao salvar')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSavePublicas = async () => {
        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('clientes')
                .update({ notas: notasPublicas })
                .eq('id', client.id)

            if (error) throw error
            toast.success('Notas públicas salvas!')
            setEditingPublicas(false)
        } catch (error) {
            toast.error('Erro ao salvar')
        } finally {
            setIsLoading(false)
        }
    }

    const cancelEditInternas = () => {
        setNotasInternas(client.notas_internas || '')
        setEditingInternas(false)
    }

    const cancelEditPublicas = () => {
        setNotasPublicas(client.notas || '')
        setEditingPublicas(false)
    }

    return (
        <div className="space-y-6">
            {/* Notas Internas */}
            <Card className="border-[#EAE0D5]">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Lock className="w-4 h-4 text-orange-500" />
                            Notas Internas
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                Visível apenas para equipe
                            </Badge>
                        </CardDescription>
                    </div>
                    {!editingInternas ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingInternas(true)}
                        >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Editar
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditInternas}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveInternas}
                                disabled={isLoading}
                                className="bg-[#C48B7F] hover:bg-[#A66D60]"
                            >
                                <Save className="w-4 h-4 mr-1" />
                                Salvar
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {editingInternas ? (
                        <Textarea
                            value={notasInternas}
                            onChange={e => setNotasInternas(e.target.value)}
                            className="min-h-[150px] bg-orange-50/50"
                            placeholder="Adicione notas internas sobre o cliente..."
                        />
                    ) : (
                        <div className="min-h-[100px]">
                            {notasInternas ? (
                                <p className="text-sm whitespace-pre-wrap">{notasInternas}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">
                                    Nenhuma nota interna. Clique em "Editar" para adicionar.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Notas Públicas */}
            <Card className="border-[#EAE0D5]">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-500" />
                            Notas Gerais
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                Informações gerais
                            </Badge>
                        </CardDescription>
                    </div>
                    {!editingPublicas ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPublicas(true)}
                        >
                            <Edit3 className="w-4 h-4 mr-1" />
                            Editar
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditPublicas}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSavePublicas}
                                disabled={isLoading}
                                className="bg-[#C48B7F] hover:bg-[#A66D60]"
                            >
                                <Save className="w-4 h-4 mr-1" />
                                Salvar
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {editingPublicas ? (
                        <Textarea
                            value={notasPublicas}
                            onChange={e => setNotasPublicas(e.target.value)}
                            className="min-h-[150px] bg-blue-50/50"
                            placeholder="Adicione notas gerais sobre o cliente..."
                        />
                    ) : (
                        <div className="min-h-[100px]">
                            {notasPublicas ? (
                                <p className="text-sm whitespace-pre-wrap">{notasPublicas}</p>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">
                                    Nenhuma nota geral. Clique em "Editar" para adicionar.
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info de última atualização */}
            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Última atualização: {format(new Date(client.updated_at), "dd/MM/yyyy 'às' HH:mm")}
            </div>
        </div>
    )
}
