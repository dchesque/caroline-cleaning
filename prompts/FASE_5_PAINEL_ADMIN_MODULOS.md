# FASE 5: PAINEL ADMIN - MÓDULOS AVANÇADOS
## Chesque Premium Cleaning - Plataforma de Atendimento e Gestão

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Duração Estimada:** 5-7 dias  
**Prioridade:** 🟡 HIGH  
**Pré-requisito:** Fases 1, 2, 3 e 4 completas

---

## 📋 RESUMO EXECUTIVO

Este documento contém instruções para implementar os **módulos avançados** do painel administrativo:

### Escopo da Fase 5:
- ✅ Módulo de Contratos (geração, assinatura, gestão)
- ✅ Módulo Financeiro (receitas, despesas, relatórios)
- ✅ Módulo de Recorrências (serviços recorrentes)
- ✅ Página de Configurações (empresa, serviços, áreas)
- ✅ Módulo de Mensagens (histórico de conversas)

### NÃO está no escopo:
- ❌ Integração real com Carol/n8n (Fase 6)
- ❌ Analytics avançado (Fase 7)

---

## ARQUITETURA DE ROTAS

```
app/(admin)/admin/
├── contratos/
│   ├── page.tsx                # Lista de contratos
│   ├── [id]/page.tsx           # Detalhe do contrato
│   └── novo/page.tsx           # Criar contrato
│
├── financeiro/
│   ├── page.tsx                # Dashboard financeiro
│   ├── receitas/page.tsx       # Lista de receitas
│   ├── despesas/page.tsx       # Lista de despesas
│   └── relatorios/page.tsx     # Relatórios
│
├── mensagens/
│   ├── page.tsx                # Lista de conversas
│   └── [sessionId]/page.tsx    # Detalhe da conversa
│
├── configuracoes/
│   ├── page.tsx                # Config geral
│   ├── servicos/page.tsx       # Tipos de serviço
│   ├── areas/page.tsx          # Áreas atendidas
│   └── equipe/page.tsx         # Membros da equipe
```

---

## 1. MÓDULO DE CONTRATOS

### 1.1 Lista de Contratos - app/(admin)/admin/contratos/page.tsx

```tsx
// app/(admin)/admin/contratos/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Download,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_CONTRACT = {
  rascunho: { label: 'Rascunho', variant: 'secondary', icon: FileText },
  enviado: { label: 'Enviado', variant: 'warning', icon: Clock },
  assinado: { label: 'Assinado', variant: 'success', icon: CheckCircle },
  cancelado: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
  expirado: { label: 'Expirado', variant: 'outline', icon: XCircle },
}

export default function ContratosPage() {
  const [contracts, setContracts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    const fetchContracts = async () => {
      setIsLoading(true)
      
      let query = supabase
        .from('contratos')
        .select(`
          *,
          clientes (
            id,
            nome,
            telefone,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (search) {
        query = query.or(`numero.ilike.%${search}%,clientes.nome.ilike.%${search}%`)
      }

      const { data } = await query
      setContracts(data || [])
      setIsLoading(false)
    }

    fetchContracts()
  }, [search, statusFilter])

  // Stats
  const stats = {
    total: contracts.length,
    assinados: contracts.filter(c => c.status === 'assinado').length,
    pendentes: contracts.filter(c => c.status === 'enviado').length,
    valorTotal: contracts
      .filter(c => c.status === 'assinado')
      .reduce((acc, c) => acc + (c.valor_acordado || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-h2 text-foreground">Contratos</h1>
          <p className="text-body text-muted-foreground">
            Gerencie os contratos dos seus clientes
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/contratos/novo">
            <Plus className="w-4 h-4" />
            Novo Contrato
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Total</p>
                <p className="text-h3 font-semibold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Assinados</p>
                <p className="text-h3 font-semibold">{stats.assinados}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Pendentes</p>
                <p className="text-h3 font-semibold">{stats.pendentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brandy-rose-100 rounded-lg">
                <FileText className="w-5 h-5 text-brandy-rose-600" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Valor Total</p>
                <p className="text-h3 font-semibold">{formatCurrency(stats.valorTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(STATUS_CONTRACT).map(([key, value]) => (
              <SelectItem key={key} value={key}>{value.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum contrato encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => {
                  const statusConfig = STATUS_CONTRACT[contract.status as keyof typeof STATUS_CONTRACT]
                  return (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">#{contract.numero}</p>
                          <p className="text-caption text-muted-foreground">
                            {formatDate(contract.created_at)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`/admin/clientes/${contract.cliente_id}`}
                          className="hover:text-brandy-rose-600"
                        >
                          {contract.clientes?.nome}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{formatCurrency(contract.valor_acordado)}</p>
                        <p className="text-caption text-muted-foreground">
                          {contract.frequencia}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-body-sm">
                          {formatDate(contract.data_inicio, 'short')}
                        </p>
                        {contract.data_fim && (
                          <p className="text-caption text-muted-foreground">
                            até {formatDate(contract.data_fim, 'short')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig?.variant as any || 'secondary'}>
                          {statusConfig?.label || contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/contratos/${contract.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            {contract.documento_url && (
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Baixar PDF
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

### 1.2 Criar Contrato - app/(admin)/admin/contratos/novo/page.tsx

```tsx
// app/(admin)/admin/contratos/novo/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft, 
  CalendarIcon, 
  Loader2, 
  Search,
  FileText,
  Send,
  Save
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { SERVICE_TYPES, FREQUENCIES, WEEKDAYS } from '@/lib/constants'

export default function NovoContratoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteIdParam = searchParams.get('cliente')
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)

  const [formData, setFormData] = useState({
    tipo_servico: 'regular',
    frequencia: 'weekly',
    dia_preferido: 'monday',
    horario_preferido: '09:00',
    valor_acordado: '',
    data_inicio: new Date(),
    data_fim: null as Date | null,
    duracao_estimada: '180',
    observacoes: '',
    termos_aceitos: false,
  })

  // Load client if passed in URL
  useEffect(() => {
    if (clienteIdParam) {
      const loadClient = async () => {
        const { data } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', clienteIdParam)
          .single()
        
        if (data) {
          setSelectedClient(data)
          // Pre-fill with client preferences
          if (data.tipo_servico_padrao) {
            setFormData(prev => ({ ...prev, tipo_servico: data.tipo_servico_padrao }))
          }
          if (data.frequencia) {
            setFormData(prev => ({ ...prev, frequencia: data.frequencia }))
          }
          if (data.dia_preferido) {
            setFormData(prev => ({ ...prev, dia_preferido: data.dia_preferido }))
          }
        }
      }
      loadClient()
    }
  }, [clienteIdParam])

  // Search clients
  useEffect(() => {
    const searchClients = async () => {
      if (clientSearch.length < 2) {
        setClients([])
        return
      }

      const { data } = await supabase
        .from('clientes')
        .select('id, nome, telefone, email, endereco_completo')
        .or(`nome.ilike.%${clientSearch}%,telefone.ilike.%${clientSearch}%`)
        .limit(5)

      setClients(data || [])
    }

    const debounce = setTimeout(searchClients, 300)
    return () => clearTimeout(debounce)
  }, [clientSearch])

  // Generate contract number
  const generateContractNumber = () => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `CC-${year}-${random}`
  }

  const handleSave = async (sendToClient: boolean = false) => {
    if (!selectedClient) {
      toast.error('Selecione um cliente')
      return
    }

    if (!formData.valor_acordado) {
      toast.error('Informe o valor acordado')
      return
    }

    if (!formData.termos_aceitos && sendToClient) {
      toast.error('Confirme os termos do contrato')
      return
    }

    setIsSaving(true)

    try {
      const contractData = {
        numero: generateContractNumber(),
        cliente_id: selectedClient.id,
        tipo_servico: formData.tipo_servico,
        frequencia: formData.frequencia,
        dia_preferido: formData.dia_preferido,
        horario_preferido: formData.horario_preferido,
        valor_acordado: parseFloat(formData.valor_acordado),
        data_inicio: format(formData.data_inicio, 'yyyy-MM-dd'),
        data_fim: formData.data_fim ? format(formData.data_fim, 'yyyy-MM-dd') : null,
        duracao_estimada_minutos: parseInt(formData.duracao_estimada),
        observacoes: formData.observacoes || null,
        status: sendToClient ? 'enviado' : 'rascunho',
      }

      const { data, error } = await supabase
        .from('contratos')
        .insert(contractData)
        .select()
        .single()

      if (error) throw error

      // If sending to client, also create recurrence
      if (sendToClient && data) {
        await supabase.from('recorrencias').insert({
          cliente_id: selectedClient.id,
          contrato_id: data.id,
          frequencia: formData.frequencia,
          dia_preferido: formData.dia_preferido,
          horario: formData.horario_preferido,
          valor: parseFloat(formData.valor_acordado),
          ativo: true,
        })
      }

      toast.success(sendToClient ? 'Contrato enviado para o cliente!' : 'Rascunho salvo!')
      router.push(`/admin/contratos/${data.id}`)
    } catch (error) {
      console.error('Error saving contract:', error)
      toast.error('Erro ao salvar contrato')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-heading text-h2 text-foreground">Novo Contrato</h1>
          <p className="text-body text-muted-foreground">
            Crie um contrato de serviço recorrente
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-h4">Cliente</CardTitle>
              <CardDescription>Selecione o cliente para este contrato</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedClient ? (
                <div className="flex items-center justify-between p-4 bg-desert-storm rounded-lg">
                  <div>
                    <p className="font-semibold">{selectedClient.nome}</p>
                    <p className="text-body-sm text-muted-foreground">{selectedClient.telefone}</p>
                    <p className="text-caption text-muted-foreground">{selectedClient.endereco_completo}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedClient(null)}>
                    Alterar
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente por nome ou telefone..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-9"
                  />
                  {clients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-pampas rounded-lg shadow-lg z-10 max-h-60 overflow-auto">
                      {clients.map((client) => (
                        <button
                          key={client.id}
                          className="w-full px-4 py-3 text-left hover:bg-desert-storm transition-colors"
                          onClick={() => {
                            setSelectedClient(client)
                            setClientSearch('')
                            setClients([])
                          }}
                        >
                          <p className="font-medium">{client.nome}</p>
                          <p className="text-caption text-muted-foreground">{client.telefone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-h4">Detalhes do Serviço</CardTitle>
              <CardDescription>Configure o serviço contratado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Serviço</Label>
                  <Select
                    value={formData.tipo_servico}
                    onValueChange={(value) => setFormData({ ...formData, tipo_servico: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.filter(s => s.value !== 'visit').map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select
                    value={formData.frequencia}
                    onValueChange={(value) => setFormData({ ...formData, frequencia: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dia Preferido</Label>
                  <Select
                    value={formData.dia_preferido}
                    onValueChange={(value) => setFormData({ ...formData, dia_preferido: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Select
                    value={formData.horario_preferido}
                    onValueChange={(value) => setFormData({ ...formData, horario_preferido: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 8).map((hour) => (
                        <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                          {format(new Date().setHours(hour, 0), 'h:mm a')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duração Estimada</Label>
                  <Select
                    value={formData.duracao_estimada}
                    onValueChange={(value) => setFormData({ ...formData, duracao_estimada: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="120">2 horas</SelectItem>
                      <SelectItem value="180">3 horas</SelectItem>
                      <SelectItem value="240">4 horas</SelectItem>
                      <SelectItem value="300">5 horas</SelectItem>
                      <SelectItem value="360">6 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor por Serviço ($)</Label>
                  <Input
                    type="number"
                    placeholder="150.00"
                    value={formData.valor_acordado}
                    onChange={(e) => setFormData({ ...formData, valor_acordado: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Period */}
          <Card>
            <CardHeader>
              <CardTitle className="text-h4">Período do Contrato</CardTitle>
              <CardDescription>Defina o período de vigência</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.data_inicio && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_inicio ? format(formData.data_inicio, 'PPP') : 'Selecionar'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.data_inicio}
                        onSelect={(date) => date && setFormData({ ...formData, data_inicio: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data de Término (opcional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.data_fim && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_fim ? format(formData.data_fim, 'PPP') : 'Indeterminado'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.data_fim || undefined}
                        onSelect={(date) => setFormData({ ...formData, data_fim: date || null })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Instruções especiais, condições, etc."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-h4">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-body-sm">
                  <span className="text-muted-foreground">Valor por serviço</span>
                  <span className="font-medium">
                    {formData.valor_acordado ? `$${formData.valor_acordado}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-muted-foreground">Frequência</span>
                  <span className="font-medium">
                    {FREQUENCIES.find(f => f.value === formData.frequencia)?.label}
                  </span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-muted-foreground">Est. mensal</span>
                  <span className="font-semibold text-brandy-rose-600">
                    {formData.valor_acordado ? 
                      `$${(parseFloat(formData.valor_acordado) * 
                        (formData.frequencia === 'weekly' ? 4 : 
                         formData.frequencia === 'biweekly' ? 2 : 1)).toFixed(2)}` 
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-pampas">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="termos"
                    checked={formData.termos_aceitos}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, termos_aceitos: checked as boolean })
                    }
                  />
                  <Label htmlFor="termos" className="text-caption leading-tight">
                    Confirmo que os termos e valores estão corretos e o cliente foi informado.
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              className="w-full gap-2" 
              onClick={() => handleSave(true)}
              disabled={isSaving || !selectedClient || !formData.valor_acordado}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Criar e Enviar
            </Button>
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => handleSave(false)}
              disabled={isSaving || !selectedClient}
            >
              <Save className="w-4 h-4" />
              Salvar Rascunho
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 1.3 Detalhe do Contrato - app/(admin)/admin/contratos/[id]/page.tsx

```tsx
// app/(admin)/admin/contratos/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Download, 
  Send, 
  Edit, 
  CheckCircle,
  Clock,
  User,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { SERVICE_TYPES, FREQUENCIES, WEEKDAYS } from '@/lib/constants'

const STATUS_CONTRACT = {
  rascunho: { label: 'Rascunho', variant: 'secondary' },
  enviado: { label: 'Aguardando Assinatura', variant: 'warning' },
  assinado: { label: 'Assinado', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ContratoDetalhePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contract, error } = await supabase
    .from('contratos')
    .select(`
      *,
      clientes (
        id,
        nome,
        telefone,
        email,
        endereco_completo,
        cidade,
        estado,
        zip_code
      ),
      recorrencias (*)
    `)
    .eq('id', id)
    .single()

  if (error || !contract) notFound()

  const statusConfig = STATUS_CONTRACT[contract.status as keyof typeof STATUS_CONTRACT]
  const getLabel = (array: any[], value: string) => array.find(i => i.value === value)?.label || value

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/contratos">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-h2 text-foreground">
                Contrato #{contract.numero}
              </h1>
              <Badge variant={statusConfig?.variant as any || 'secondary'}>
                {statusConfig?.label || contract.status}
              </Badge>
            </div>
            <p className="text-body text-muted-foreground">
              Criado em {formatDate(contract.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {contract.status === 'rascunho' && (
            <>
              <Button variant="outline" className="gap-2">
                <Edit className="w-4 h-4" />
                Editar
              </Button>
              <Button className="gap-2">
                <Send className="w-4 h-4" />
                Enviar para Cliente
              </Button>
            </>
          )}
          {contract.status === 'enviado' && (
            <Button className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Marcar como Assinado
            </Button>
          )}
          {contract.documento_url && (
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Baixar PDF
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-h4">
                <User className="w-5 h-5 text-muted-foreground" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Link 
                    href={`/admin/clientes/${contract.cliente_id}`}
                    className="text-body font-semibold hover:text-brandy-rose-600"
                  >
                    {contract.clientes?.nome}
                  </Link>
                  <p className="text-body-sm text-muted-foreground">{contract.clientes?.telefone}</p>
                  <p className="text-body-sm text-muted-foreground">{contract.clientes?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-body-sm">{contract.clientes?.endereco_completo}</p>
                  <p className="text-caption text-muted-foreground">
                    {contract.clientes?.cidade}, {contract.clientes?.estado} {contract.clientes?.zip_code}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-h4">
                <FileText className="w-5 h-5 text-muted-foreground" />
                Detalhes do Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-caption text-muted-foreground">Tipo de Serviço</p>
                  <p className="text-body font-medium">{getLabel(SERVICE_TYPES, contract.tipo_servico)}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Frequência</p>
                  <p className="text-body font-medium">{getLabel(FREQUENCIES, contract.frequencia)}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Dia Preferido</p>
                  <p className="text-body font-medium">{getLabel(WEEKDAYS, contract.dia_preferido)}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Horário</p>
                  <p className="text-body font-medium">{contract.horario_preferido}</p>
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">Duração Estimada</p>
                  <p className="text-body font-medium">{contract.duracao_estimada_minutos} minutos</p>
                </div>
              </div>
              {contract.observacoes && (
                <div className="mt-6 pt-6 border-t border-pampas">
                  <p className="text-caption text-muted-foreground mb-2">Observações</p>
                  <p className="text-body">{contract.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-h4">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-body-sm font-medium">Contrato criado</p>
                    <p className="text-caption text-muted-foreground">
                      {formatDate(contract.created_at)} às {new Date(contract.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {contract.enviado_em && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                      <Send className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-body-sm font-medium">Enviado para o cliente</p>
                      <p className="text-caption text-muted-foreground">
                        {formatDate(contract.enviado_em)}
                      </p>
                    </div>
                  </div>
                )}
                {contract.assinado_em && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <p className="text-body-sm font-medium">Assinado pelo cliente</p>
                      <p className="text-caption text-muted-foreground">
                        {formatDate(contract.assinado_em)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-h4">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                Valores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-caption text-muted-foreground">Valor por Serviço</p>
                <p className="text-h3 font-semibold text-brandy-rose-600">
                  {formatCurrency(contract.valor_acordado)}
                </p>
              </div>
              <div className="pt-4 border-t border-pampas">
                <p className="text-caption text-muted-foreground">Estimativa Mensal</p>
                <p className="text-h4 font-semibold">
                  {formatCurrency(
                    contract.valor_acordado * 
                    (contract.frequencia === 'weekly' ? 4 : 
                     contract.frequencia === 'biweekly' ? 2 : 1)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contract Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-h4">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                Vigência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-caption text-muted-foreground">Início</p>
                <p className="text-body font-medium">{formatDate(contract.data_inicio)}</p>
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Término</p>
                <p className="text-body font-medium">
                  {contract.data_fim ? formatDate(contract.data_fim) : 'Indeterminado'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recurrence Status */}
          {contract.recorrencias?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-h4">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Recorrência
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contract.recorrencias.map((rec: any) => (
                  <div key={rec.id} className="flex items-center justify-between">
                    <span className="text-body-sm">
                      {getLabel(FREQUENCIES, rec.frequencia)} - {getLabel(WEEKDAYS, rec.dia_preferido)}
                    </span>
                    <Badge variant={rec.ativo ? 'success' : 'secondary'}>
                      {rec.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## 2. MÓDULO FINANCEIRO

### 2.1 Dashboard Financeiro - app/(admin)/admin/financeiro/page.tsx

```tsx
// app/(admin)/admin/financeiro/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { RevenueChart } from '@/components/financeiro/revenue-chart'
import { RecentTransactions } from '@/components/financeiro/recent-transactions'

export default async function FinanceiroPage() {
  const supabase = await createClient()

  // Get financial summary
  const currentMonth = new Date().toISOString().slice(0, 7)
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)

  // Current month revenue
  const { data: currentRevenue } = await supabase
    .from('financeiro')
    .select('valor')
    .eq('tipo', 'receita')
    .eq('status', 'pago')
    .gte('data', `${currentMonth}-01`)
    .lte('data', `${currentMonth}-31`)

  // Last month revenue
  const { data: lastRevenue } = await supabase
    .from('financeiro')
    .select('valor')
    .eq('tipo', 'receita')
    .eq('status', 'pago')
    .gte('data', `${lastMonth}-01`)
    .lte('data', `${lastMonth}-31`)

  // Current month expenses
  const { data: currentExpenses } = await supabase
    .from('financeiro')
    .select('valor')
    .eq('tipo', 'despesa')
    .eq('status', 'pago')
    .gte('data', `${currentMonth}-01`)
    .lte('data', `${currentMonth}-31`)

  // Pending payments
  const { data: pending } = await supabase
    .from('financeiro')
    .select('valor')
    .eq('tipo', 'receita')
    .eq('status', 'pendente')

  const totalCurrentRevenue = currentRevenue?.reduce((acc, r) => acc + r.valor, 0) || 0
  const totalLastRevenue = lastRevenue?.reduce((acc, r) => acc + r.valor, 0) || 0
  const totalExpenses = currentExpenses?.reduce((acc, r) => acc + r.valor, 0) || 0
  const totalPending = pending?.reduce((acc, r) => acc + r.valor, 0) || 0
  const profit = totalCurrentRevenue - totalExpenses

  const revenueChange = totalLastRevenue > 0 
    ? ((totalCurrentRevenue - totalLastRevenue) / totalLastRevenue * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-h2 text-foreground">Financeiro</h1>
          <p className="text-body text-muted-foreground">
            Visão geral das finanças do seu negócio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/financeiro/despesas">
              <TrendingDown className="w-4 h-4 mr-2" />
              Nova Despesa
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/financeiro/receitas">
              <Plus className="w-4 h-4 mr-2" />
              Nova Receita
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Receita do Mês</p>
                <p className="text-h3 font-semibold">{formatCurrency(totalCurrentRevenue)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {Number(revenueChange) >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-success" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-destructive" />
                  )}
                  <span className={`text-caption ${Number(revenueChange) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {revenueChange}% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Despesas do Mês</p>
                <p className="text-h3 font-semibold">{formatCurrency(totalExpenses)}</p>
                <p className="text-caption text-muted-foreground mt-1">
                  Custos operacionais
                </p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Lucro Líquido</p>
                <p className={`text-h3 font-semibold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(profit)}
                </p>
                <p className="text-caption text-muted-foreground mt-1">
                  Este mês
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">A Receber</p>
                <p className="text-h3 font-semibold text-warning">{formatCurrency(totalPending)}</p>
                <p className="text-caption text-muted-foreground mt-1">
                  Pagamentos pendentes
                </p>
              </div>
              <div className="p-3 bg-warning/10 rounded-lg">
                <CreditCard className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Transactions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-h4">Receita Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-[300px]" />}>
                <RevenueChart />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-h4">Transações Recentes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/financeiro/receitas">Ver todas</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-[300px]" />}>
                <RecentTransactions />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/admin/financeiro/receitas">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-semibold">Receitas</p>
                  <p className="text-caption text-muted-foreground">Gerenciar entradas</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/admin/financeiro/despesas">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold">Despesas</p>
                  <p className="text-caption text-muted-foreground">Gerenciar saídas</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/admin/financeiro/relatorios">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-info/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="font-semibold">Relatórios</p>
                  <p className="text-caption text-muted-foreground">Análises detalhadas</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}
```

### 2.2 Revenue Chart Component

```tsx
// components/financeiro/revenue-chart.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

export function RevenueChart() {
  const [data, setData] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const months = []
      
      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i)
        const start = format(startOfMonth(date), 'yyyy-MM-dd')
        const end = format(endOfMonth(date), 'yyyy-MM-dd')

        const { data: revenue } = await supabase
          .from('financeiro')
          .select('valor')
          .eq('tipo', 'receita')
          .eq('status', 'pago')
          .gte('data', start)
          .lte('data', end)

        const { data: expenses } = await supabase
          .from('financeiro')
          .select('valor')
          .eq('tipo', 'despesa')
          .eq('status', 'pago')
          .gte('data', start)
          .lte('data', end)

        months.push({
          month: format(date, 'MMM'),
          receita: revenue?.reduce((acc, r) => acc + r.valor, 0) || 0,
          despesa: expenses?.reduce((acc, r) => acc + r.valor, 0) || 0,
        })
      }

      setData(months)
    }

    fetchData()
  }, [])

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" />
        <XAxis dataKey="month" stroke="#9A8478" fontSize={12} />
        <YAxis stroke="#9A8478" fontSize={12} tickFormatter={(value) => `$${value}`} />
        <Tooltip 
          formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #E8E4E1',
            borderRadius: '8px'
          }}
        />
        <Area 
          type="monotone" 
          dataKey="receita" 
          stroke="#22c55e" 
          fillOpacity={1} 
          fill="url(#colorReceita)" 
          name="Receita"
        />
        <Area 
          type="monotone" 
          dataKey="despesa" 
          stroke="#ef4444" 
          fillOpacity={1} 
          fill="url(#colorDespesa)" 
          name="Despesa"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

### 2.3 Recent Transactions Component

```tsx
// components/financeiro/recent-transactions.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data } = await supabase
        .from('financeiro')
        .select(`
          *,
          clientes (nome)
        `)
        .order('data', { ascending: false })
        .limit(5)

      setTransactions(data || [])
    }

    fetchTransactions()
  }, [])

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma transação registrada
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              transaction.tipo === 'receita' ? 'bg-success/10' : 'bg-destructive/10'
            }`}>
              {transaction.tipo === 'receita' ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
            </div>
            <div>
              <p className="text-body-sm font-medium">
                {transaction.descricao || transaction.categoria}
              </p>
              <p className="text-caption text-muted-foreground">
                {transaction.clientes?.nome || formatDate(transaction.data, 'short')}
              </p>
            </div>
          </div>
          <p className={`font-semibold ${
            transaction.tipo === 'receita' ? 'text-success' : 'text-destructive'
          }`}>
            {transaction.tipo === 'receita' ? '+' : '-'}
            {formatCurrency(transaction.valor)}
          </p>
        </div>
      ))}
    </div>
  )
}
```

### 2.4 Lista de Receitas - app/(admin)/admin/financeiro/receitas/page.tsx

```tsx
// app/(admin)/admin/financeiro/receitas/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  CalendarIcon,
  Loader2,
  CheckCircle,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_PAGAMENTO = {
  pendente: { label: 'Pendente', variant: 'warning' },
  pago: { label: 'Pago', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
}

const CATEGORIAS_RECEITA = [
  { value: 'servico', label: 'Serviço de Limpeza' },
  { value: 'extra', label: 'Serviço Extra' },
  { value: 'gorjeta', label: 'Gorjeta' },
  { value: 'outro', label: 'Outro' },
]

export default function ReceitasPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Form state
  const [formData, setFormData] = useState({
    cliente_id: '',
    agendamento_id: '',
    categoria: 'servico',
    descricao: '',
    valor: '',
    data: new Date(),
    status: 'pago',
    forma_pagamento: 'pix',
  })

  // Client search
  const [clientSearch, setClientSearch] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)

  const supabase = createClient()

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true)
      
      let query = supabase
        .from('financeiro')
        .select(`
          *,
          clientes (id, nome, telefone)
        `)
        .eq('tipo', 'receita')
        .order('data', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data } = await query
      setTransactions(data || [])
      setIsLoading(false)
    }

    fetchTransactions()
  }, [statusFilter])

  // Search clients
  useEffect(() => {
    const searchClients = async () => {
      if (clientSearch.length < 2) {
        setClients([])
        return
      }

      const { data } = await supabase
        .from('clientes')
        .select('id, nome, telefone')
        .or(`nome.ilike.%${clientSearch}%,telefone.ilike.%${clientSearch}%`)
        .limit(5)

      setClients(data || [])
    }

    const debounce = setTimeout(searchClients, 300)
    return () => clearTimeout(debounce)
  }, [clientSearch])

  const handleSave = async () => {
    if (!formData.valor) {
      toast.error('Informe o valor')
      return
    }

    setIsSaving(true)

    try {
      const transactionData = {
        tipo: 'receita',
        cliente_id: selectedClient?.id || null,
        agendamento_id: formData.agendamento_id || null,
        categoria: formData.categoria,
        descricao: formData.descricao || null,
        valor: parseFloat(formData.valor),
        data: format(formData.data, 'yyyy-MM-dd'),
        status: formData.status,
        forma_pagamento: formData.forma_pagamento,
      }

      const { error } = await supabase.from('financeiro').insert(transactionData)

      if (error) throw error

      toast.success('Receita registrada!')
      setIsModalOpen(false)
      
      // Reset form
      setFormData({
        cliente_id: '',
        agendamento_id: '',
        categoria: 'servico',
        descricao: '',
        valor: '',
        data: new Date(),
        status: 'pago',
        forma_pagamento: 'pix',
      })
      setSelectedClient(null)

      // Refresh list
      const { data } = await supabase
        .from('financeiro')
        .select(`*, clientes (id, nome, telefone)`)
        .eq('tipo', 'receita')
        .order('data', { ascending: false })
      setTransactions(data || [])

    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Erro ao salvar receita')
    } finally {
      setIsSaving(false)
    }
  }

  // Filter by search
  const filteredTransactions = transactions.filter(t => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      t.clientes?.nome?.toLowerCase().includes(searchLower) ||
      t.descricao?.toLowerCase().includes(searchLower) ||
      t.categoria?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/financeiro">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-h2 text-foreground">Receitas</h1>
            <p className="text-body text-muted-foreground">
              Gerencie as entradas financeiras
            </p>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Receita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Receita</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label>Cliente (opcional)</Label>
                {selectedClient ? (
                  <div className="flex items-center justify-between p-3 bg-desert-storm rounded-lg">
                    <div>
                      <p className="font-medium">{selectedClient.nome}</p>
                      <p className="text-caption text-muted-foreground">{selectedClient.telefone}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-9"
                    />
                    {clients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-pampas rounded-lg shadow-lg z-10">
                        {clients.map((client) => (
                          <button
                            key={client.id}
                            className="w-full px-3 py-2 text-left hover:bg-desert-storm"
                            onClick={() => {
                              setSelectedClient(client)
                              setClientSearch('')
                              setClients([])
                            }}
                          >
                            <p className="font-medium">{client.nome}</p>
                            <p className="text-caption text-muted-foreground">{client.telefone}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_RECEITA.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value and Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor ($)</Label>
                  <Input
                    type="number"
                    placeholder="150.00"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.data, 'dd/MM/yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.data}
                        onSelect={(date) => date && setFormData({ ...formData, data: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Status and Payment Method */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select
                    value={formData.forma_pagamento}
                    onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="zelle">Zelle</SelectItem>
                      <SelectItem value="venmo">Venmo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Input
                  placeholder="Descrição do pagamento"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.data, 'short')}</TableCell>
                  <TableCell>
                    {transaction.clientes?.nome || '-'}
                  </TableCell>
                  <TableCell>
                    {CATEGORIAS_RECEITA.find(c => c.value === transaction.categoria)?.label || transaction.categoria}
                  </TableCell>
                  <TableCell className="font-semibold text-success">
                    +{formatCurrency(transaction.valor)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_PAGAMENTO[transaction.status as keyof typeof STATUS_PAGAMENTO]?.variant as any}>
                      {STATUS_PAGAMENTO[transaction.status as keyof typeof STATUS_PAGAMENTO]?.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 3. MÓDULO DE MENSAGENS

### 3.1 Lista de Conversas - app/(admin)/admin/mensagens/page.tsx

```tsx
// app/(admin)/admin/mensagens/page.tsx
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
```

### 3.2 Detalhe da Conversa - app/(admin)/admin/mensagens/[sessionId]/page.tsx

```tsx
// app/(admin)/admin/mensagens/[sessionId]/page.tsx
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
          <Card className="h-[600px] flex flex-col">
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
```

---

## 4. PÁGINA DE CONFIGURAÇÕES

### 4.1 Configurações Gerais - app/(admin)/admin/configuracoes/page.tsx

```tsx
// app/(admin)/admin/configuracoes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  Building2, 
  MapPin, 
  Briefcase, 
  Users, 
  Save,
  Loader2,
  Phone,
  Mail,
  Globe
} from 'lucide-react'
import { toast } from 'sonner'

export default function ConfiguracoesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState({
    // Business Info
    business_name: 'Chesque Premium Cleaning',
    business_phone: '(305) 555-0123',
    business_email: 'hello@Chesquecleaning.com',
    business_address: '123 Ocean Drive, Miami, FL 33139',
    business_website: 'www.Chesquecleaning.com',
    
    // Operating Hours
    operating_start: '08:00',
    operating_end: '18:00',
    operating_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    
    // Notifications
    notify_new_booking: true,
    notify_cancellation: true,
    notify_reminder: true,
    reminder_hours: 24,
    
    // Booking Settings
    min_booking_notice: 24,
    max_booking_advance: 30,
    default_duration: 180,
  })

  const supabase = createClient()

  useEffect(() => {
    // Load config from database
    const loadConfig = async () => {
      const { data } = await supabase
        .from('configuracoes')
        .select('*')
        .single()
      
      if (data) {
        setConfig(prev => ({ ...prev, ...data.settings }))
      }
    }
    loadConfig()
  }, [])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert({
          id: 1,
          settings: config,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      toast.success('Configurações salvas!')
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-h2 text-foreground">Configurações</h1>
          <p className="text-body text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="gap-2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="horarios">Horários</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="agendamento">Agendamento</TabsTrigger>
        </TabsList>

        {/* Company Info */}
        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Informações da Empresa
              </CardTitle>
              <CardDescription>
                Dados básicos que aparecem em contratos e comunicações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={config.business_name}
                    onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={config.business_phone}
                    onChange={(e) => setConfig({ ...config, business_phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={config.business_email}
                    onChange={(e) => setConfig({ ...config, business_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={config.business_website}
                    onChange={(e) => setConfig({ ...config, business_website: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={config.business_address}
                  onChange={(e) => setConfig({ ...config, business_address: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            <Card className="hover:shadow-md transition-shadow">
              <Link href="/admin/configuracoes/servicos">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Serviços</p>
                      <p className="text-caption text-muted-foreground">Gerenciar tipos de serviço</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <Link href="/admin/configuracoes/areas">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-success/10 rounded-lg">
                      <MapPin className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold">Áreas</p>
                      <p className="text-caption text-muted-foreground">Regiões atendidas</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <Link href="/admin/configuracoes/equipe">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-warning/10 rounded-lg">
                      <Users className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-semibold">Equipe</p>
                      <p className="text-caption text-muted-foreground">Gerenciar membros</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>
        </TabsContent>

        {/* Operating Hours */}
        <TabsContent value="horarios">
          <Card>
            <CardHeader>
              <CardTitle>Horário de Funcionamento</CardTitle>
              <CardDescription>
                Defina os horários em que você aceita agendamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início do Expediente</Label>
                  <Input
                    type="time"
                    value={config.operating_start}
                    onChange={(e) => setConfig({ ...config, operating_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fim do Expediente</Label>
                  <Input
                    type="time"
                    value={config.operating_end}
                    onChange={(e) => setConfig({ ...config, operating_end: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Dias de Atendimento</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'monday', label: 'Seg' },
                    { value: 'tuesday', label: 'Ter' },
                    { value: 'wednesday', label: 'Qua' },
                    { value: 'thursday', label: 'Qui' },
                    { value: 'friday', label: 'Sex' },
                    { value: 'saturday', label: 'Sáb' },
                    { value: 'sunday', label: 'Dom' },
                  ].map((day) => (
                    <Button
                      key={day.value}
                      variant={config.operating_days.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const days = config.operating_days.includes(day.value)
                          ? config.operating_days.filter(d => d !== day.value)
                          : [...config.operating_days, day.value]
                        setConfig({ ...config, operating_days: days })
                      }}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure quando você quer ser notificada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Novos Agendamentos</p>
                  <p className="text-caption text-muted-foreground">
                    Receber notificação quando um novo agendamento for criado
                  </p>
                </div>
                <Switch
                  checked={config.notify_new_booking}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, notify_new_booking: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Cancelamentos</p>
                  <p className="text-caption text-muted-foreground">
                    Receber notificação quando um agendamento for cancelado
                  </p>
                </div>
                <Switch
                  checked={config.notify_cancellation}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, notify_cancellation: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembretes</p>
                  <p className="text-caption text-muted-foreground">
                    Receber lembrete antes dos agendamentos
                  </p>
                </div>
                <Switch
                  checked={config.notify_reminder}
                  onCheckedChange={(checked) => 
                    setConfig({ ...config, notify_reminder: checked })
                  }
                />
              </div>

              {config.notify_reminder && (
                <div className="space-y-2 pl-4 border-l-2 border-pampas">
                  <Label>Horas de antecedência</Label>
                  <Input
                    type="number"
                    min="1"
                    max="72"
                    value={config.reminder_hours}
                    onChange={(e) => setConfig({ ...config, reminder_hours: parseInt(e.target.value) })}
                    className="w-32"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Settings */}
        <TabsContent value="agendamento">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Agendamento</CardTitle>
              <CardDescription>
                Regras para criação de novos agendamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Antecedência Mínima (horas)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={config.min_booking_notice}
                    onChange={(e) => setConfig({ ...config, min_booking_notice: parseInt(e.target.value) })}
                  />
                  <p className="text-caption text-muted-foreground">
                    Tempo mínimo antes do serviço para aceitar agendamento
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Agendamento Antecipado (dias)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={config.max_booking_advance}
                    onChange={(e) => setConfig({ ...config, max_booking_advance: parseInt(e.target.value) })}
                  />
                  <p className="text-caption text-muted-foreground">
                    Máximo de dias no futuro para agendamento
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Duração Padrão (minutos)</Label>
                <Input
                  type="number"
                  min="60"
                  step="30"
                  value={config.default_duration}
                  onChange={(e) => setConfig({ ...config, default_duration: parseInt(e.target.value) })}
                  className="w-32"
                />
                <p className="text-caption text-muted-foreground">
                  Duração padrão para novos serviços
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 4.2 Gerenciar Serviços - app/(admin)/admin/configuracoes/servicos/page.tsx

```tsx
// app/(admin)/admin/configuracoes/servicos/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash, 
  Loader2,
  GripVertical
} from 'lucide-react'
import { toast } from 'sonner'

interface ServiceType {
  id: string
  nome: string
  descricao: string
  duracao_padrao: number
  preco_base: number
  cor: string
  ativo: boolean
  ordem: number
}

export default function ServicosConfigPage() {
  const [services, setServices] = useState<ServiceType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingService, setEditingService] = useState<ServiceType | null>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    duracao_padrao: '180',
    preco_base: '',
    cor: '#BE9982',
    ativo: true,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('tipos_servico')
      .select('*')
      .order('ordem')
    
    setServices(data || [])
    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!formData.nome) {
      toast.error('Nome é obrigatório')
      return
    }

    setIsSaving(true)
    try {
      const serviceData = {
        nome: formData.nome,
        descricao: formData.descricao,
        duracao_padrao: parseInt(formData.duracao_padrao),
        preco_base: formData.preco_base ? parseFloat(formData.preco_base) : null,
        cor: formData.cor,
        ativo: formData.ativo,
      }

      if (editingService) {
        const { error } = await supabase
          .from('tipos_servico')
          .update(serviceData)
          .eq('id', editingService.id)
        if (error) throw error
        toast.success('Serviço atualizado!')
      } else {
        const { error } = await supabase
          .from('tipos_servico')
          .insert({ ...serviceData, ordem: services.length })
        if (error) throw error
        toast.success('Serviço criado!')
      }

      setIsModalOpen(false)
      resetForm()
      fetchServices()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro ao salvar serviço')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
      const { error } = await supabase
        .from('tipos_servico')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      toast.success('Serviço excluído!')
      fetchServices()
    } catch (error) {
      toast.error('Erro ao excluir serviço')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      duracao_padrao: '180',
      preco_base: '',
      cor: '#BE9982',
      ativo: true,
    })
    setEditingService(null)
  }

  const openEditModal = (service: ServiceType) => {
    setEditingService(service)
    setFormData({
      nome: service.nome,
      descricao: service.descricao || '',
      duracao_padrao: service.duracao_padrao.toString(),
      preco_base: service.preco_base?.toString() || '',
      cor: service.cor || '#BE9982',
      ativo: service.ativo,
    })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/configuracoes">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-h2 text-foreground">Tipos de Serviço</h1>
            <p className="text-body text-muted-foreground">
              Configure os serviços oferecidos
            </p>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Limpeza Regular"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do serviço..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duração Padrão (min)</Label>
                  <Input
                    type="number"
                    value={formData.duracao_padrao}
                    onChange={(e) => setFormData({ ...formData, duracao_padrao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Base ($)</Label>
                  <Input
                    type="number"
                    value={formData.preco_base}
                    onChange={(e) => setFormData({ ...formData, preco_base: e.target.value })}
                    placeholder="150.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                    />
                    <span className="text-body-sm">
                      {formData.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsModalOpen(false)
                  resetForm()
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingService ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">Carregando...</div>
          ) : services.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              Nenhum serviço cadastrado
            </div>
          ) : (
            <div className="divide-y divide-pampas">
              {services.map((service) => (
                <div key={service.id} className="flex items-center gap-4 p-4">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: service.cor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{service.nome}</p>
                      <Badge variant={service.ativo ? 'success' : 'secondary'}>
                        {service.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-caption text-muted-foreground">
                      {service.duracao_padrao} min
                      {service.preco_base && ` • $${service.preco_base}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEditModal(service)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 5. TABELAS ADICIONAIS NO SUPABASE

Execute no SQL Editor do Supabase:

```sql
-- Tabela de Tipos de Serviço
CREATE TABLE IF NOT EXISTS tipos_servico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  duracao_padrao INTEGER DEFAULT 180,
  preco_base DECIMAL(10,2),
  cor VARCHAR(7) DEFAULT '#BE9982',
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir tipos padrão
INSERT INTO tipos_servico (nome, descricao, duracao_padrao, preco_base, cor, ordem) VALUES
('Limpeza Regular', 'Limpeza de manutenção semanal/quinzenal', 180, 150, '#BE9982', 0),
('Limpeza Profunda', 'Limpeza detalhada e completa', 300, 280, '#8B7355', 1),
('Move-in/Move-out', 'Limpeza para mudança', 360, 350, '#6B5B4F', 2),
('Escritório', 'Limpeza comercial', 120, 100, '#9A8478', 3);

-- Tabela de Áreas Atendidas
CREATE TABLE IF NOT EXISTS areas_atendidas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) DEFAULT 'city', -- city, zip, neighborhood
  zip_codes TEXT[], -- array de ZIP codes
  ativo BOOLEAN DEFAULT true,
  taxa_adicional DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir áreas padrão
INSERT INTO areas_atendidas (nome, tipo, ativo) VALUES
('Miami Beach', 'city', true),
('Coral Gables', 'city', true),
('Brickell', 'neighborhood', true),
('Downtown Miami', 'neighborhood', true),
('Coconut Grove', 'neighborhood', true);

-- Tabela de Configurações
CREATE TABLE IF NOT EXISTS configuracoes (
  id INTEGER PRIMARY KEY DEFAULT 1,
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir config padrão
INSERT INTO configuracoes (id, settings) VALUES (1, '{
  "business_name": "Chesque Premium Cleaning",
  "business_phone": "(305) 555-0123",
  "business_email": "hello@Chesquecleaning.com",
  "operating_start": "08:00",
  "operating_end": "18:00",
  "operating_days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
}');
```

---

## 6. ATUALIZAR SIDEBAR

Atualizar a sidebar para habilitar os novos módulos:

```tsx
// components/admin/sidebar.tsx - Atualizar navigation

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Agenda', href: '/admin/agenda', icon: Calendar },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Contratos', href: '/admin/contratos', icon: FileText }, // Removido disabled
  { name: 'Financeiro', href: '/admin/financeiro', icon: DollarSign }, // Removido disabled
  { name: 'Mensagens', href: '/admin/mensagens', icon: MessageSquare },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings }, // Removido disabled
]
```

---

## 7. DEPENDÊNCIAS ADICIONAIS

```bash
# Gráficos
npm install recharts

# Se ainda não instalado
npm install date-fns
npm install sonner
```

---

## 8. CHECKLIST DE VALIDAÇÃO

### Módulo Contratos
- [ ] Lista de contratos carrega
- [ ] Filtro por status funciona
- [ ] Criar novo contrato funciona
- [ ] Busca de cliente funciona
- [ ] Visualizar contrato funciona
- [ ] Stats cards mostram dados corretos

### Módulo Financeiro
- [ ] Dashboard carrega com stats
- [ ] Gráfico de receita renderiza
- [ ] Transações recentes aparecem
- [ ] Criar nova receita funciona
- [ ] Filtros funcionam

### Módulo Mensagens
- [ ] Lista de sessões carrega
- [ ] Busca funciona
- [ ] Visualizar conversa funciona
- [ ] Scroll automático funciona
- [ ] Info do lead aparece

### Configurações
- [ ] Tabs funcionam
- [ ] Salvar configurações funciona
- [ ] Editar serviços funciona
- [ ] Criar/editar/excluir serviços

---

## ✅ DEFINIÇÃO DE PRONTO

A Fase 5 está COMPLETA quando:

1. ✅ Módulo Contratos completo (lista, criar, visualizar)
2. ✅ Módulo Financeiro completo (dashboard, receitas, despesas)
3. ✅ Módulo Mensagens completo (lista, detalhe)
4. ✅ Configurações completas (empresa, horários, notificações)
5. ✅ CRUD de tipos de serviço
6. ✅ Tabelas adicionais no Supabase
7. ✅ Sidebar atualizada
8. ✅ Build passa sem erros

---

## 🔗 PRÓXIMA FASE

**FASE 6: Integração Carol (IA)**
- Webhook n8n
- Processamento de mensagens
- Geração de agendamentos automáticos
- Notificações WhatsApp

---

**— FIM DA FASE 5 —**
