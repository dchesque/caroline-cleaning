'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import { BeforeAfterTable } from '@/components/before-after/before-after-table'
import { BeforeAfterModal } from '@/components/before-after/before-after-modal'
import type { BeforeAfterItem } from '@/types/before-after'

export default function BeforeAfterPage() {
    const { t } = useAdminI18n()
    const ba = t('beforeAfter')

    const supabase = createClient()
    const [items, setItems] = useState<BeforeAfterItem[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editing, setEditing] = useState<BeforeAfterItem | null>(null)

    async function load() {
        setLoading(true)
        const { data } = await supabase
            .from('before_after')
            .select('*')
            .order('ordem', { ascending: true })
            .order('created_at', { ascending: false })
        setItems((data ?? []) as BeforeAfterItem[])
        setLoading(false)
    }

    useEffect(() => {
        void load()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-heading text-3xl text-foreground">{ba.title}</h1>
                    <p className="text-sm text-muted-foreground">{ba.subtitle}</p>
                </div>
                <Button
                    onClick={() => {
                        setEditing(null)
                        setModalOpen(true)
                    }}
                    className="gap-2 bg-[#C48B7F] hover:bg-[#A66D60]"
                >
                    <Plus className="w-4 h-4" />
                    {ba.newItem}
                </Button>
            </div>

            <BeforeAfterTable
                items={items}
                loading={loading}
                onEdit={(item) => {
                    setEditing(item)
                    setModalOpen(true)
                }}
                onRefresh={load}
            />

            <BeforeAfterModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                item={editing}
                onSaved={load}
            />
        </div>
    )
}
