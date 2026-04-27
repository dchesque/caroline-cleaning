'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UnifiedLead } from '@/types/leads'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface ConvertToClientModalProps {
  lead: UnifiedLead | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConverted?: () => void
}

const sourceLabels = {
  chat: 'Chat IA',
  form: 'Formulário de Contato'
}

export function ConvertToClientModal({ lead, open, onOpenChange, onConverted }: ConvertToClientModalProps) {
  const { t } = useAdminI18n()
  const leadsT = t('leads')
  const router = useRouter()
  const [isConverting, setIsConverting] = useState(false)
  const [existingClient, setExistingClient] = useState<{ id: string; nome: string } | null>(null)
  const [checkedDuplicate, setCheckedDuplicate] = useState(false)
  const supabase = createClient()

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setExistingClient(null)
      setCheckedDuplicate(false)
    }
  }, [open])

  // Check for duplicate when modal opens with a lead
  useEffect(() => {
    async function checkDuplicate() {
      if (!lead || !open || checkedDuplicate) return

      const normalizedPhone = lead.telefone.replace(/\D/g, '')
      const { data } = await supabase
        .from('clientes')
        .select('id, nome, status')
        .eq('telefone', normalizedPhone)
        .in('status', ['ativo', 'inativo', 'pausado', 'cancelado'])
        .maybeSingle()

      if (data) {
        setExistingClient(data)
      }
      setCheckedDuplicate(true)
    }

    checkDuplicate()
  }, [lead, open, checkedDuplicate, supabase])

  const handleConvert = async () => {
    if (!lead) return

    setIsConverting(true)

    try {
      const normalizedPhone = lead.telefone.replace(/\D/g, '')
      let clientId: string

      if (existingClient) {
        // Link to existing client
        clientId = existingClient.id

        if (lead.source === 'form') {
          await supabase
            .from('contact_leads')
            .update({
              status: 'convertido',
              cliente_id: clientId
            })
            .eq('id', lead.id)
        }
      } else {
        // Check if this is a chat lead (in clientes table)
        if (lead.source === 'chat') {
          // Just update status
          await supabase
            .from('clientes')
            .update({ status: 'ativo' })
            .eq('id', lead.id)

          clientId = lead.id
        } else {
          // Create new client from form lead
          const { data } = await supabase
            .from('clientes')
            .insert({
              nome: lead.nome,
              telefone: normalizedPhone,
              cidade: lead.cidade,
              origem: 'website',
              status: 'ativo'
            })
            .select('id')
            .single()

          if (!data) {
            throw new Error('Failed to create client')
          }

          clientId = data.id

          // Link lead to client
          await supabase
            .from('contact_leads')
            .update({
              status: 'convertido',
              cliente_id: clientId
            })
            .eq('id', lead.id)
        }
      }

      toast.success(leadsT.conversion?.success || 'Lead convertido com sucesso!')
      onConverted?.()
      onOpenChange(false)

      // Navigate to client page
      router.push(`/admin/clientes/${clientId}`)
    } catch (err) {
      toast.error(leadsT.conversion?.error || 'Erro ao converter lead')
      console.error(err)
    } finally {
      setIsConverting(false)
    }
  }

  if (!lead) return null

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{leadsT.conversion?.title || 'Transformar Lead em Cliente'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {leadsT.conversion?.migrating || 'Os seguintes dados serão migrados:'}
          </p>

          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Nome:</span>
              <span className="text-sm">{lead.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Telefone:</span>
              <span className="text-sm">{formatPhone(lead.telefone)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Cidade:</span>
              <span className="text-sm">{lead.location_display}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Origem:</span>
              <span className="text-sm">📝 {sourceLabels[lead.source]}</span>
            </div>
          </div>

          {existingClient && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">{leadsT.conversion?.existingClient}</p>
                <p className="text-yellow-700">Cliente: {existingClient.nome}</p>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {leadsT.conversion?.warning}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConverting}
          >
            {leadsT.modal?.cancel || 'Cancelar'}
          </Button>
          <Button
            onClick={handleConvert}
            disabled={isConverting}
            className="bg-brandy-rose-500 hover:bg-brandy-rose-600"
          >
            {isConverting ? 'Convertendo...' : leadsT.modal?.confirmConvert || 'Confirmar Conversão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
