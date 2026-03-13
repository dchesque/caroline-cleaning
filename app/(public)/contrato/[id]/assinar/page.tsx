'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignaturePad } from '@/components/SignaturePad'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function SignContractPage() {
    const params = useParams()
    const router = useRouter()
    const [contract, setContract] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        const fetchContract = async () => {
            if (!params?.id) return

            try {
                const { data, error } = await supabase
                    .from('contratos')
                    .select(`
                        *,
                        clientes (nome, endereco_completo, telefone, email)
                    `)
                    .eq('id', params.id)
                    .single()

                if (error) throw error
                setContract(data)
            } catch (err) {
                console.error(err)
                setError('Contract not found or unavailable.')
            } finally {
                setLoading(false)
            }
        }

        fetchContract()
    }, [params?.id, supabase])

    const handleSaveSignature = async (base64Signature: string) => {
        if (!contract || !params?.id) return
        setSaving(true)
        setError('')

        try {
            // Getting generic user IP footprint if available - but requires server action/edge route 
            // We'll leave it simple for client-side
            const { error: updateError } = await supabase
                .from('contratos')
                .update({
                    assinatura_cliente: base64Signature,
                    data_assinatura: new Date().toISOString(),
                    status: 'assinado'
                })
                .eq('id', params.id)

            if (updateError) throw updateError

            setSuccess(true)

            // Auto redirect back after 3 seconds if local iPad usage
            setTimeout(() => {
                router.push(`/admin/contratos/${contract.id}`)
            }, 3000)

        } catch (err: any) {
            console.error('Error saving signature:', err)
            setError('Failed to save the signature. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-pampas">
                <Loader2 className="w-10 h-10 animate-spin text-brandy-rose-600 mb-4" />
                <p>Loading document...</p>
            </div>
        )
    }

    if (error || !contract) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-pampas">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    if (success || contract.status === 'assinado') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-pampas">
                <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Assinatura Concluída!</h2>
                    <p className="text-muted-foreground">
                        Documento assinado com sucesso. Obrigado!
                    </p>
                    {success && <p className="text-sm text-muted-foreground animate-pulse">Redirecionando...</p>}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-8 pb-16 px-4 md:px-8">
            <div className="max-w-4xl w-full mx-auto space-y-6">
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-3xl md:text-4xl font-heading text-brandy-rose-800">Assinatura de Termo</h1>
                    <p className="text-muted-foreground">Por favor, revise o contrato e assine no quadro abaixo.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 space-y-8">
                    {/* Contract Body Render */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2">Termos e Condições Acordados</h2>
                        <div className="bg-gray-50 p-6 rounded-lg text-sm text-gray-700 font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto border">
                            {contract.documento_corpo || "Erro: Corpo do contrato vazio"}
                        </div>
                    </div>

                    {/* Signature Section */}
                    <div className="space-y-4 pt-4 border-t">
                        <div>
                            <h2 className="text-xl font-bold">Assinatura do Cliente</h2>
                            <p className="text-sm text-muted-foreground">
                                Utilize o dedo ou o mouse para assinar no espaço pontilhado abaixo.
                            </p>
                        </div>
                        
                        <div className="max-w-xl mx-auto">
                            <SignaturePad 
                                disabled={saving}
                                onSave={handleSaveSignature}
                            />
                        </div>
                        
                        <div className="flex justify-center mt-6">
                            <Button 
                                className="w-full max-w-xs h-12 text-lg bg-brandy-rose-600 hover:bg-brandy-rose-700 disabled:opacity-50"
                                onClick={() => {
                                    // Hack: The signature pad saves on internal save trigger.
                                    // To make the explicit button work, we can just alert the user to finish drawing, 
                                    // but since we made onSave trigger on mouseup, we can just use the state from it.
                                    // Alternatively, we leave the save to an explicit button in the SignaturePad. 
                                    // We already pass onSave to SignaturePad and it triggers auto-save on stopDrawing.
                                    // To improve UX we add a tiny note or change the SignaturePad to only save when clicking this button.
                                }}
                                disabled={saving}
                            >
                                {saving ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Salvando...</>
                                ) : (
                                    'Aguardando Assinatura...'
                                )}
                            </Button>
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-2">
                            A assinatura é salva automaticamente ao terminar o traço no quadro acima.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
