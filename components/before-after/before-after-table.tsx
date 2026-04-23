'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import type { BeforeAfterItem } from '@/types/before-after'

interface BeforeAfterTableProps {
    items: BeforeAfterItem[]
    loading: boolean
    onEdit: (item: BeforeAfterItem) => void
    onRefresh: () => void
}

export function BeforeAfterTable({
    items,
    loading,
    onEdit,
    onRefresh,
}: BeforeAfterTableProps) {
    const { t } = useAdminI18n()
    const ba = t('beforeAfter')

    const supabase = createClient()
    const [deletingItem, setDeletingItem] = useState<BeforeAfterItem | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleToggleAtivo(item: BeforeAfterItem) {
        try {
            const { error } = await supabase
                .from('before_after')
                .update({ ativo: !item.ativo })
                .eq('id', item.id)

            if (error) throw error
            onRefresh()
        } catch (err) {
            console.error('Toggle ativo error:', err)
            toast.error(ba.saveError)
        }
    }

    async function handleDelete() {
        if (!deletingItem) return
        setIsDeleting(true)
        try {
            // 1. Delete DB row
            const { error: dbError } = await supabase
                .from('before_after')
                .delete()
                .eq('id', deletingItem.id)

            if (dbError) throw dbError

            // 2. Storage cleanup
            try {
                const { data: files } = await supabase.storage
                    .from('before-after')
                    .list(deletingItem.id)

                if (files && files.length > 0) {
                    const paths = files.map((f) => `${deletingItem.id}/${f.name}`)
                    await supabase.storage.from('before-after').remove(paths)
                }
            } catch (storageErr) {
                console.warn('Storage cleanup failed (non-fatal):', storageErr)
                toast.warning(ba.storageCleanupWarning)
            }

            toast.success(ba.deleteSuccess)
            setDeletingItem(null)
            onRefresh()
        } catch (err) {
            console.error('Delete error:', err)
            toast.error(ba.deleteError)
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                {ba.emptyState}
            </div>
        )
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">{ba.columnBefore}</TableHead>
                            <TableHead className="w-[80px]">{ba.columnAfter}</TableHead>
                            <TableHead>{ba.columnTitle}</TableHead>
                            <TableHead className="w-[80px]">{ba.columnOrder}</TableHead>
                            <TableHead className="w-[80px]">{ba.columnActive}</TableHead>
                            <TableHead className="w-[100px]">{ba.columnActions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    {item.imagem_antes ? (
                                        <img
                                            src={item.imagem_antes}
                                            alt={`${item.titulo} — ${ba.columnBefore}`}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                                            —
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {item.imagem_depois ? (
                                        <img
                                            src={item.imagem_depois}
                                            alt={`${item.titulo} — ${ba.columnAfter}`}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                                            —
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{item.titulo}</TableCell>
                                <TableCell>{item.ordem}</TableCell>
                                <TableCell>
                                    <Switch
                                        checked={item.ativo}
                                        onCheckedChange={() => void handleToggleAtivo(item)}
                                        aria-label={`${ba.fieldActive}: ${item.titulo}`}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(item)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeletingItem(item)}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog
                open={!!deletingItem}
                onOpenChange={(open) => { if (!open) setDeletingItem(null) }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{ba.deleteConfirmTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {ba.deleteConfirmBody}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            {ba.cancelButton}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {ba.deleteItem}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
