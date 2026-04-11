'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import { useAdminI18n } from '@/lib/admin-i18n/context'

export function CategoryManager() {
    const { t } = useAdminI18n()
    const categoriesT = t('finance_categories')

    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<any>(null)
    const [formLoading, setFormLoading] = useState(false)
    const [formData, setFormData] = useState({
        nome: '',
        tipo: 'receita',
        cor: '#8E8E8E',
        icone: 'Tag'
    })

    const supabase = createClient()

    const fetchCategories = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('financeiro_categorias')
                .select('*')
                .eq('ativo', true)
                .order('tipo', { ascending: false })
                .order('nome')

            if (error) throw error
            setCategories(data || [])
        } catch (error) {
            console.error(error)
            toast.error(categoriesT.toast.loadError)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleOpenDialog = (category: any = null) => {
        if (category) {
            setEditingCategory(category)
            setFormData({
                nome: category.nome,
                tipo: category.tipo,
                cor: category.cor || '#8E8E8E',
                icone: category.icone || 'Tag'
            })
        } else {
            setEditingCategory(null)
            setFormData({
                nome: '',
                tipo: 'receita',
                cor: '#8E8E8E',
                icone: 'Tag'
            })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormLoading(true)

        try {
            if (editingCategory) {
                const { error } = await supabase
                    .from('financeiro_categorias')
                    .update(formData)
                    .eq('id', editingCategory.id)
                if (error) throw error
                toast.success(categoriesT.toast.updated)
            } else {
                const { error } = await supabase
                    .from('financeiro_categorias')
                    .insert([formData])
                if (error) throw error
                toast.success(categoriesT.toast.created)
            }
            setIsDialogOpen(false)
            fetchCategories()
        } catch (error) {
            console.error(error)
            toast.error(categoriesT.toast.saveError)
        } finally {
            setFormLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm(categoriesT.toast.confirmDelete)) return

        try {
            const { error } = await supabase
                .from('financeiro_categorias')
                .update({ ativo: false })
                .eq('id', id)
            if (error) throw error
            toast.success(categoriesT.toast.deleted)
            fetchCategories()
        } catch (error) {
            console.error(error)
            toast.error(categoriesT.toast.deleteError)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-h4 font-semibold">{categoriesT.title}</h2>
                <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    {categoriesT.newCategory}
                </Button>
            </div>

            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>{categoriesT.table.name}</TableHead>
                            <TableHead>{categoriesT.table.type}</TableHead>
                            <TableHead className="text-right">{categoriesT.table.actions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                        <span>{categoriesT.table.loading}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                                    {categoriesT.table.empty}
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((cat) => (
                                <TableRow key={cat.id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium text-foreground">{cat.nome}</TableCell>
                                    <TableCell>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${cat.tipo === 'receita'
                                            ? 'bg-success/10 text-success border border-success/20'
                                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                                            }`}>
                                            {cat.tipo === 'receita' ? categoriesT.table.revenue : categoriesT.table.expense}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(cat)} className="hover:bg-primary/10 hover:text-primary">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="hover:bg-destructive/10 hover:text-destructive">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? categoriesT.editCategory : categoriesT.newCategory}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">{categoriesT.form.name}</Label>
                            <Input
                                id="nome"
                                placeholder={categoriesT.form.namePlaceholder}
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                required
                                autoFocus
                                className="bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tipo">{categoriesT.form.type}</Label>
                            <Select
                                value={formData.tipo}
                                onValueChange={(val) => setFormData({ ...formData, tipo: val })}
                            >
                                <SelectTrigger className="bg-white border-gray-200 shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="receita">{categoriesT.table.revenueType}</SelectItem>
                                    <SelectItem value="custo">{categoriesT.table.expenseType}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                                {t('common').cancel}
                            </Button>
                            <Button type="submit" disabled={formLoading} className="flex-1 bg-primary hover:bg-primary/90">
                                {formLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {t('common').save}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
