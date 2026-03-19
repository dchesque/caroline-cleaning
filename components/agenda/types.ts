export interface ServicoTipo {
    id: string
    codigo: string
    nome: string
    multiplicador_preco: number
    duracao_base_minutos: number
    cor: string | null
    ativo: boolean
}

export interface Addon {
    id: string
    codigo: string
    nome: string
    preco: number
    tipo_cobranca: string
    minutos_adicionais: number
    ativo: boolean
}

export interface AddonSelecionado {
    codigo: string
    nome: string
    preco: number
    quantidade: number
}

export interface AppointmentFormData {
    data: string
    horario_inicio: string
    duracao_minutos: string
    tipo: string
    status: string
    valor: string
    desconto_percentual: string
    notas: string
    frequencia?: string
}
