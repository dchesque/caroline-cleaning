'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface CategoryQuickFormProps {
    tipo: 'receita' | 'custo'
    onSuccess?: (newCategory: any) => void
}

export function CategoryQuickForm({ tipo, onSuccess }: CategoryQuickFormProps) {
    const { t } = useAdminI18n()
    const txT = t('finance_transaction')
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [nome, setNome] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nome.trim()) return

        setLoading(true)
        try {
            const response = await fetch('/api/financeiro/categorias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: nome.trim(),
                    tipo: tipo,
                    icone: tipo === 'receita' ? 'TrendingUp' : 'TrendingDown',
                    cor: tipo === 'receita' ? '#6B8E6B' : '#C48B7F'
                }),
            })

            if (!response.ok) throw new Error('Error')

            const newCategory = await response.json()
            toast.success(txT.categoryCreated)
            setNome('')
            setOpen(false)
            if (onSuccess) onSuccess(newCategory)
        } catch (error) {
            console.error(error)
            toast.error(txT.categoryError)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" title={txT.createCategory}>
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{txT.newCategoryTitle(tipo)}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="nome">{txT.categoryName}</Label>
                        <Input
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder={txT.categoryPlaceholder}
                            required
                            autoFocus
                            className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            {txT.cancel}
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {txT.createCategory}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
