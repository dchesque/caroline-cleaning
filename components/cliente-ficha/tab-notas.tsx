'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function TabNotas({ client }: { client: any }) {
    const [notes, setNotes] = useState(client.notas_internas || '')
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const { error } = await supabase
                .from('clientes')
                .update({ notas_internas: notes })
                .eq('id', client.id)

            if (error) throw error
            toast.success('Notas atualizadas com sucesso!')
        } catch (error) {
            toast.error('Erro ao salvar notas')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="border-[#EAE0D5] h-full">
            <CardHeader>
                <CardTitle className="text-base">Notas Internas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="min-h-[300px]"
                    placeholder="Adicione notas sobre o cliente..."
                />
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isLoading} className="bg-[#C48B7F] hover:bg-[#A66D60]">
                        {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
