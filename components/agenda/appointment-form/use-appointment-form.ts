import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { parseCurrency } from '@/lib/formatters'
import { ServicoTipo, Addon, AddonSelecionado, AppointmentFormData } from '../types'

interface UseAppointmentFormProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedDate?: Date
    appointmentId?: string
    preSelectedClientId?: string
    onSuccess?: () => void
}

export function useAppointmentForm({
    open,
    onOpenChange,
    selectedDate,
    appointmentId,
    preSelectedClientId,
    onSuccess
}: UseAppointmentFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [clients, setClients] = useState<any[]>([])
    const [serviceTypes, setServiceTypes] = useState<ServicoTipo[]>([])
    const [addonsDisponiveis, setAddonsDisponiveis] = useState<Addon[]>([])
    const [clientSearch, setClientSearch] = useState('')
    const [selectedClient, setSelectedClient] = useState<any>(null)
    const [addonsSelecionados, setAddonsSelecionados] = useState<AddonSelecionado[]>([])
    const [dataLoaded, setDataLoaded] = useState(false)

    const [formData, setFormData] = useState<AppointmentFormData>({
        data: '',
        horario_inicio: '09:00',
        duracao_minutos: '180',
        tipo: '',
        status: 'agendado',
        valor: '',
        desconto_percentual: '0',
        notas: ''
    })

    const supabase = useMemo(() => createClient(), [])

    // Carregar dados estáticos apenas uma vez
    useEffect(() => {
        let mounted = true
        const fetchData = async () => {
            const [servicosRes, addonsRes] = await Promise.all([
                supabase.from('servicos_tipos').select('*').eq('ativo', true).order('ordem'),
                supabase.from('addons').select('*').eq('ativo', true).order('ordem')
            ])

            if (!mounted) return

            if (servicosRes.data) setServiceTypes(servicosRes.data)
            if (addonsRes.data) setAddonsDisponiveis(addonsRes.data)
            setDataLoaded(true)
        }
        fetchData()
        return () => { mounted = false }
    }, [supabase])

    // Controlar reset e inicialização quando o modal abre
    useEffect(() => {
        if (!open) return

        const init = async () => {
            if (appointmentId) {
                setIsLoading(true)
                const { data: app, error } = await supabase
                    .from('agendamentos')
                    .select('*, cliente:clientes(*)')
                    .eq('id', appointmentId)
                    .single()

                if (app && !error) {
                    setFormData({
                        data: app.data,
                        horario_inicio: app.horario_inicio.substring(0, 5),
                        duracao_minutos: app.duracao_minutos.toString(),
                        tipo: app.tipo,
                        status: app.status,
                        valor: app.valor?.toString() || '',
                        desconto_percentual: app.desconto_percentual?.toString() || '0',
                        notas: app.notas || ''
                    })
                    setSelectedClient(app.cliente)
                    setAddonsSelecionados(app.addons || [])
                }
                setIsLoading(false)
            } else {
                setFormData({
                    data: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
                    horario_inicio: '09:00',
                    duracao_minutos: '180',
                    tipo: serviceTypes.length > 0 ? serviceTypes[0].codigo : '',
                    status: 'agendado',
                    valor: '',
                    desconto_percentual: '0',
                    notas: ''
                })

                setAddonsSelecionados([])
                setClientSearch('')
                setClients([])

                if (preSelectedClientId) {
                    const { data } = await supabase
                        .from('clientes')
                        .select('id, nome, telefone, endereco_completo')
                        .eq('id', preSelectedClientId)
                        .single()

                    if (data) setSelectedClient(data)
                } else {
                    setSelectedClient(null)
                }
            }
        }

        init()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, selectedDate, preSelectedClientId, appointmentId])

    // Efeito colateral seguro para preencher tipo default quando serviços carregarem
    useEffect(() => {
        if (open && dataLoaded && serviceTypes.length > 0) {
            setFormData(prev => {
                if (!prev.tipo) {
                    return { ...prev, tipo: serviceTypes[0].codigo }
                }
                return prev
            })
        }
    }, [dataLoaded, open, serviceTypes])

    // Buscar clientes com debounce
    useEffect(() => {
        if (clientSearch.length < 2) {
            setClients([])
            return
        }

        const searchClients = async () => {
            setIsLoading(true)
            const { data } = await supabase
                .from('clientes')
                .select('id, nome, telefone, endereco_completo')
                .or(`nome.ilike.%${clientSearch}%,telefone.ilike.%${clientSearch}%`)
                .limit(5)

            setClients(data || [])
            setIsLoading(false)
        }

        const debounce = setTimeout(searchClients, 300)
        return () => clearTimeout(debounce)
    }, [clientSearch, supabase])

    // Calcular valores
    const calculatedValues = useMemo(() => {
        const valorBase = parseCurrency(formData.valor) || 0
        const valorAddons = addonsSelecionados.reduce((acc, a) => acc + (a.preco * a.quantidade), 0)
        const subtotal = valorBase + valorAddons
        const desconto = parseCurrency(formData.desconto_percentual) || 0
        const valorDesconto = subtotal * (desconto / 100)
        const valorFinal = subtotal - valorDesconto

        return { valorBase, valorAddons, subtotal, desconto, valorDesconto, valorFinal }
    }, [formData.valor, formData.desconto_percentual, addonsSelecionados])

    // Calcular duração total
    const duracaoTotal = useMemo(() => {
        const duracaoBase = parseInt(formData.duracao_minutos) || 180
        const duracaoAddons = addonsSelecionados.reduce((acc, a) => {
            const addon = addonsDisponiveis.find(ad => ad.codigo === a.codigo)
            return acc + ((addon?.minutos_adicionais || 0) * a.quantidade)
        }, 0)
        return duracaoBase + duracaoAddons
    }, [formData.duracao_minutos, addonsSelecionados, addonsDisponiveis])

    // Calcular horário de término
    const calculateEndTime = (startTime: string, durationMinutes: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes + durationMinutes
        const endHours = Math.floor(totalMinutes / 60) % 24
        const endMinutes = totalMinutes % 60
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
    }

    // Toggle addon
    const toggleAddon = useCallback((addon: Addon) => {
        setAddonsSelecionados(prev => {
            const exists = prev.find(a => a.codigo === addon.codigo)
            if (exists) {
                return prev.filter(a => a.codigo !== addon.codigo)
            }
            return [...prev, {
                codigo: addon.codigo,
                nome: addon.nome,
                preco: addon.preco,
                quantidade: 1
            }]
        })
    }, [])

    // Atualizar quantidade do addon
    const updateAddonQuantidade = useCallback((codigo: string, quantidade: number) => {
        if (quantidade < 1) return
        setAddonsSelecionados(prev => prev.map(a =>
            a.codigo === codigo ? { ...a, quantidade } : a
        ))
    }, [])

    // Atualizar duração quando muda o serviço
    const handleServiceChange = (codigo: string) => {
        const servico = serviceTypes.find(s => s.codigo === codigo)
        if (servico) {
            setFormData(prev => ({
                ...prev,
                tipo: codigo,
                duracao_minutos: servico.duracao_base_minutos.toString()
            }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedClient) {
            toast.error('Selecione um cliente')
            return
        }

        if (!formData.data) {
            toast.error('Selecione uma data')
            return
        }

        if (!formData.tipo) {
            toast.error('Selecione um tipo de serviço')
            return
        }

        setIsSaving(true)

        try {
            const horarioFim = calculateEndTime(formData.horario_inicio, duracaoTotal)

            const payload = {
                cliente_id: selectedClient.id,
                data: formData.data,
                horario_inicio: formData.horario_inicio,
                horario_fim_estimado: horarioFim,
                duracao_minutos: duracaoTotal,
                tipo: formData.tipo,
                status: formData.status,
                valor: calculatedValues.valorBase || null,
                valor_addons: calculatedValues.valorAddons || null,
                desconto_percentual: calculatedValues.desconto || null,
                addons: addonsSelecionados.length > 0 ? addonsSelecionados : null,
                notas: formData.notas.trim() || null
            }

            if (appointmentId) {
                const { error } = await supabase
                    .from('agendamentos')
                    .update(payload)
                    .eq('id', appointmentId)

                if (error) throw error
                toast.success('Agendamento atualizado com sucesso!')
            } else {
                const { error } = await supabase
                    .from('agendamentos')
                    .insert([payload])

                if (error) throw error
                toast.success('Agendamento criado com sucesso!')
            }

            onOpenChange(false)
            onSuccess?.()

        } catch (error) {
            console.error('Error saving appointment:', error)
            toast.error(appointmentId ? 'Erro ao atualizar agendamento' : 'Erro ao criar agendamento')
        } finally {
            setIsSaving(false)
        }
    }

    return {
        formData,
        setFormData,
        clients,
        setClients,
        clientSearch,
        setClientSearch,
        selectedClient,
        setSelectedClient,
        serviceTypes,
        addonsDisponiveis,
        addonsSelecionados,
        toggleAddon,
        updateAddonQuantidade,
        handleServiceChange,
        handleSubmit,
        calculatedValues,
        duracaoTotal,
        calculateEndTime,
        isLoading,
        isSaving
    }
}
