'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { requestContractSignature } from './actions'

export function SendContractButton({ contractId }: { contractId: string }) {
    const [loading, setLoading] = useState(false)

    const handleSend = async () => {
        setLoading(true)
        try {
            const result = await requestContractSignature(contractId)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Contrato enviado com sucesso por SMS!')
            }
        } catch (error) {
            toast.error('Ocorreu um erro ao enviar.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button className="gap-2" onClick={handleSend} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar para Cliente
        </Button>
    )
}
