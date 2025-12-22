export const CATEGORIAS_RECEITA = [
    { value: 'servico', label: 'Serviço de Limpeza' },
    { value: 'addon', label: 'Serviço Adicional' },
    { value: 'taxa_cancelamento', label: 'Taxa de Cancelamento' },
    { value: 'gorjeta', label: 'Gorjeta' },
    { value: 'outro', label: 'Outro' },
]

export const CATEGORIAS_DESPESA = [
    { value: 'produto_limpeza', label: 'Produtos de Limpeza', icon: 'Sparkles' },
    { value: 'transporte', label: 'Transporte/Gasolina', icon: 'Car' },
    { value: 'equipamento', label: 'Equipamentos', icon: 'Wrench' },
    { value: 'marketing', label: 'Marketing', icon: 'Megaphone' },
    { value: 'manutencao', label: 'Manutenção', icon: 'Settings' },
    { value: 'outro', label: 'Outros', icon: 'MoreHorizontal' },
]

export const STATUS_CONFIG = {
    pendente: { label: 'Pendente', className: 'bg-warning/10 text-warning' },
    pago: { label: 'Pago', className: 'bg-success/10 text-success' },
    cancelado: { label: 'Cancelado', className: 'bg-destructive/10 text-destructive' },
    reembolsado: { label: 'Reembolsado', className: 'bg-info/10 text-info' },
}

export const FORMAS_PAGAMENTO = [
    { value: 'cash', label: 'Dinheiro' },
    { value: 'zelle', label: 'Zelle' },
    { value: 'check', label: 'Cheque' },
    { value: 'card', label: 'Cartão' },
    { value: 'other', label: 'Outro' },
]
