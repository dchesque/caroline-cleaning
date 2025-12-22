import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Home,
    Key,
    Calendar,
    MapPin,
    Phone,
    Mail,
    User,
    Clock,
    DollarSign,
    PawPrint,
    Building,
    Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const FREQUENCIA_LABELS: Record<string, string> = {
    weekly: 'Semanal',
    biweekly: 'Quinzenal',
    monthly: 'Mensal',
    one_time: 'Avulso',
}

const DIA_LABELS: Record<string, string> = {
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo',
}

const TIPO_RESIDENCIA_LABELS: Record<string, string> = {
    house: 'Casa',
    apartment: 'Apartamento',
    condo: 'Condomínio',
    townhouse: 'Townhouse',
    other: 'Outro',
}

const ACESSO_LABELS: Record<string, string> = {
    client_home: 'Cliente em casa',
    garage_code: 'Código da garagem',
    lockbox: 'Lockbox',
    key_hidden: 'Chave escondida',
    doorman: 'Porteiro',
    other: 'Outro',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    lead: { label: 'Lead', color: 'bg-blue-100 text-blue-700' },
    ativo: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
    pausado: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-700' },
    cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
    inativo: { label: 'Inativo', color: 'bg-gray-100 text-gray-700' },
}

interface TabInfoProps {
    client: any
}

export async function TabInfo({ client }: TabInfoProps) {
    const supabase = await createClient()

    // Buscar recorrência do cliente
    const { data: recorrencia } = await supabase
        .from('recorrencias')
        .select('*')
        .eq('cliente_id', client.id)
        .eq('ativo', true)
        .single()

    // Buscar tipos de serviço para labels
    const { data: servicosTipos } = await supabase
        .from('servicos_tipos')
        .select('codigo, nome')

    const servicosMap = servicosTipos?.reduce((acc: Record<string, string>, s) => ({ ...acc, [s.codigo]: s.nome }), {}) || {}

    // Parse servicos_por_dia da recorrência
    const servicosPorDia = recorrencia?.servicos_por_dia || []

    const status = STATUS_LABELS[client.status] || STATUS_LABELS.lead

    return (
        <div className="space-y-6">
            {/* Row 1: Dados Pessoais + Endereço */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Dados Pessoais */}
                <Card className="border-[#EAE0D5]">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="w-4 h-4 text-[#C48B7F]" />
                            Dados Pessoais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge className={status.color}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Telefone</span>
                            <span className="text-sm font-medium flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {client.telefone}
                            </span>
                        </div>
                        {client.email && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Email</span>
                                <span className="text-sm font-medium flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {client.email}
                                </span>
                            </div>
                        )}
                        {client.data_aniversario && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Aniversário</span>
                                <span className="text-sm font-medium">
                                    {format(new Date(client.data_aniversario), "dd 'de' MMMM", { locale: ptBR })}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Cliente desde</span>
                            <span className="text-sm font-medium">
                                {format(new Date(client.created_at), "dd/MM/yyyy")}
                            </span>
                        </div>
                        {client.origem && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Origem</span>
                                <Badge variant="outline" className="capitalize">{client.origem}</Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Endereço */}
                <Card className="border-[#EAE0D5]">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MapPin className="w-4 h-4 text-[#C48B7F]" />
                            Endereço
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <span className="text-sm text-muted-foreground">Endereço completo</span>
                            <p className="text-sm font-medium mt-1">{client.endereco_completo}</p>
                        </div>
                        {client.endereco_linha2 && (
                            <div>
                                <span className="text-sm text-muted-foreground">Complemento</span>
                                <p className="text-sm font-medium mt-1">{client.endereco_linha2}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <span className="text-xs text-muted-foreground">Cidade</span>
                                <p className="text-sm font-medium">{client.cidade || '-'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Estado</span>
                                <p className="text-sm font-medium">{client.estado || '-'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">ZIP</span>
                                <p className="text-sm font-medium">{client.zip_code || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Detalhes da Residência + Acesso */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Detalhes da Residência */}
                <Card className="border-[#EAE0D5]">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Home className="w-4 h-4 text-[#C48B7F]" />
                            Detalhes da Residência
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <Building className="w-5 h-5 mx-auto text-[#C48B7F] mb-1" />
                                <p className="text-xs text-muted-foreground">Tipo</p>
                                <p className="font-semibold text-sm">
                                    {TIPO_RESIDENCIA_LABELS[client.tipo_residencia] || '-'}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <Home className="w-5 h-5 mx-auto text-[#C48B7F] mb-1" />
                                <p className="text-xs text-muted-foreground">Área</p>
                                <p className="font-semibold text-sm">
                                    {client.square_feet ? `${client.square_feet} sqft` : '-'}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-lg">🛏️</span>
                                <p className="text-xs text-muted-foreground">Quartos</p>
                                <p className="font-semibold text-sm">{client.bedrooms || '-'}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-lg">🚿</span>
                                <p className="text-xs text-muted-foreground">Banheiros</p>
                                <p className="font-semibold text-sm">{client.bathrooms || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Acesso & Pets */}
                <Card className="border-[#EAE0D5]">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Key className="w-4 h-4 text-[#C48B7F]" />
                            Acesso & Pets
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Tipo de Acesso</span>
                                <Badge variant="outline">
                                    {ACESSO_LABELS[client.acesso_tipo] || 'Não informado'}
                                </Badge>
                            </div>
                            {client.acesso_codigo && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Código</span>
                                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                        {client.acesso_codigo}
                                    </span>
                                </div>
                            )}
                            {client.acesso_instrucoes && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Instruções</span>
                                    <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                                        {client.acesso_instrucoes}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-3">
                            <div className="flex items-center gap-2">
                                <PawPrint className={`w-4 h-4 ${client.tem_pets ? 'text-orange-500' : 'text-gray-400'}`} />
                                <span className="text-sm font-medium">
                                    {client.tem_pets ? 'Tem pets' : 'Sem pets'}
                                </span>
                            </div>
                            {client.tem_pets && client.pets_detalhes && (
                                <p className="text-sm text-muted-foreground mt-2 ml-6">
                                    {client.pets_detalhes}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Serviços Configurados */}
            <Card className="border-[#EAE0D5]">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="w-4 h-4 text-[#C48B7F]" />
                        Serviços Configurados
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!recorrencia && servicosPorDia.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhuma recorrência configurada</p>
                            <p className="text-xs mt-1">
                                Serviço padrão: {servicosMap[client.tipo_servico_padrao] || client.tipo_servico_padrao || '-'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Frequência */}
                            <div className="flex items-center gap-4 p-3 bg-[#FDF8F6] rounded-lg">
                                <Clock className="w-5 h-5 text-[#C48B7F]" />
                                <div>
                                    <p className="text-sm font-medium">
                                        {FREQUENCIA_LABELS[recorrencia?.frequencia || client.frequencia] || 'Não definida'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Frequência de atendimento</p>
                                </div>
                                {recorrencia?.valor && (
                                    <div className="ml-auto text-right">
                                        <p className="text-sm font-bold text-[#C48B7F]">
                                            ${Number(recorrencia.valor).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">por visita</p>
                                    </div>
                                )}
                            </div>

                            {/* Dias e Serviços */}
                            <div>
                                <p className="text-sm font-medium mb-2">Dias de atendimento:</p>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {servicosPorDia.length > 0 ? (
                                        servicosPorDia.map((item: any, index: number) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-3 border rounded-lg"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-[#C48B7F]" />
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {DIA_LABELS[item.dia] || item.dia}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {servicosMap[item.servico] || item.servico}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                                            <div className="w-2 h-2 rounded-full bg-[#C48B7F]" />
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {DIA_LABELS[client.dia_preferido] || client.dia_preferido || 'Não definido'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {servicosMap[client.tipo_servico_padrao] || client.tipo_servico_padrao}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
