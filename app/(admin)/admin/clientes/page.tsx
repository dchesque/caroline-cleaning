'use client'

import { useState, useEffect } from 'react'
import { ClientsTable } from '@/components/clientes/clients-table'
import { ClientsFilters } from '@/components/clientes/clients-filters'
import { ClientModal } from '@/components/clientes/client-modal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ClientesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [clients, setClients] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        sortBy: 'created_at',
        sortOrder: 'desc' as 'asc' | 'desc',
    })
    const supabase = createClient()

    useEffect(() => {
        const fetchClients = async () => {
            setIsLoading(true)
            let query = supabase.from('clientes').select('*')

            if (filters.search) {
                query = query.or(`nome.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`)
            }
            if (filters.status !== 'all') {
                query = query.eq('status', filters.status)
            }
            query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })

            const { data } = await query
            setClients(data || [])
            setIsLoading(false)
        }
        fetchClients()
    }, [filters])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-3xl text-foreground">Clientes</h1>
                    <p className="text-sm text-muted-foreground">Gerencie seus clientes e leads</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-[#C48B7F] hover:bg-[#A66D60]">
                    <Plus className="w-4 h-4" />
                    Novo Cliente
                </Button>
            </div>

            <ClientsFilters filters={filters} onChange={setFilters} />
            <ClientsTable clients={clients} isLoading={isLoading} />
            <ClientModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={() => setFilters(prev => ({ ...prev }))} // Trigger re-fetch
            />
        </div>
    )
}
