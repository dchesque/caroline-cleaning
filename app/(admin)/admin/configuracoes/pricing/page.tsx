'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    DollarSign,
    Pencil,
    Loader2,
    Save,
    ArrowLeft,
    AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAdminI18n } from '@/lib/admin-i18n/context'

interface PricingConfig {
    id: string
    service_type: string
    service_name: string
    description: string | null
    price_min: number
    price_max: number
    price_unit: string
    badge: string | null
    display_order: number
    is_active: boolean
    notes: string | null
}

export default function PricingConfigPage() {
    const { t } = useAdminI18n()
    const pricingT = t('services').modals.pricing
    const common = t('common')

    const [pricing, setPricing] = useState<PricingConfig[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingItem, setEditingItem] = useState<PricingConfig | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchPricing()
    }, [])

    async function fetchPricing() {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('pricing_config')
            .select('*')
            .order('display_order', { ascending: true })

        if (error) {
            toast.error(pricingT.messages.errorLoading)
            console.error(error)
        } else {
            setPricing(data || [])
        }
        setIsLoading(false)
    }

    function handleEdit(item: PricingConfig) {
        setEditingItem({ ...item })
        setIsModalOpen(true)
    }

    async function handleSave() {
        if (!editingItem) return

        setIsSaving(true)

        const { error } = await supabase
            .from('pricing_config')
            .update({
                service_name: editingItem.service_name,
                description: editingItem.description,
                price_min: editingItem.price_min,
                price_max: editingItem.price_max,
                price_unit: editingItem.price_unit,
                badge: editingItem.badge || null,
                is_active: editingItem.is_active,
                notes: editingItem.notes,
                display_order: editingItem.display_order
            })
            .eq('id', editingItem.id)

        if (error) {
            toast.error(pricingT.messages.errorSaving)
            console.error(error)
        } else {
            toast.success(pricingT.messages.successUpdate)
            setIsModalOpen(false)
            fetchPricing()
        }

        setIsSaving(false)
    }

    async function toggleActive(item: PricingConfig) {
        const { error } = await supabase
            .from('pricing_config')
            .update({ is_active: !item.is_active })
            .eq('id', item.id)

        if (error) {
            toast.error(common.error)
        } else {
            toast.success(item.is_active ? pricingT.messages.statusDeactivated : pricingT.messages.statusActivated)
            fetchPricing()
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/configuracoes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="font-heading text-2xl font-bold text-foreground">
                        {pricingT.title}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {pricingT.subtitle}
                    </p>
                </div>
            </div>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="flex items-start gap-3 pt-4">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium">{pricingT.howItWorks.title}</p>
                        <p>{pricingT.howItWorks.description}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Pricing Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        {pricingT.table.title}
                    </CardTitle>
                    <CardDescription>
                        {pricingT.table.description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{pricingT.table.order}</TableHead>
                                    <TableHead>{pricingT.table.service}</TableHead>
                                    <TableHead>{pricingT.table.minPrice}</TableHead>
                                    <TableHead>{pricingT.table.maxPrice}</TableHead>
                                    <TableHead>{pricingT.table.badge}</TableHead>
                                    <TableHead>{pricingT.table.active}</TableHead>
                                    <TableHead className="text-right">{common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pricing.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono text-sm">
                                            {item.display_order}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{item.service_name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.service_type}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            ${Number(item.price_min).toFixed(0)}
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            ${Number(item.price_max).toFixed(0)}
                                        </TableCell>
                                        <TableCell>
                                            {item.badge ? (
                                                <Badge variant="secondary">{item.badge}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={item.is_active}
                                                onCheckedChange={() => toggleActive(item)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{common.edit} {pricingT.table.service}</DialogTitle>
                    </DialogHeader>

                    {editingItem && (
                        <div className="space-y-4">
                            {/* Service Name */}
                            <div className="space-y-2">
                                <Label>{pricingT.fields.serviceName}</Label>
                                <Input
                                    value={editingItem.service_name}
                                    onChange={(e) => setEditingItem({
                                        ...editingItem,
                                        service_name: e.target.value
                                    })}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label>{pricingT.fields.description}</Label>
                                <Input
                                    value={editingItem.description || ''}
                                    onChange={(e) => setEditingItem({
                                        ...editingItem,
                                        description: e.target.value
                                    })}
                                    placeholder={pricingT.fields.description}
                                />
                            </div>

                            {/* Price Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{pricingT.fields.minPrice}</Label>
                                    <Input
                                        type="number"
                                        value={editingItem.price_min}
                                        onChange={(e) => setEditingItem({
                                            ...editingItem,
                                            price_min: Number(e.target.value)
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{pricingT.fields.maxPrice}</Label>
                                    <Input
                                        type="number"
                                        value={editingItem.price_max}
                                        onChange={(e) => setEditingItem({
                                            ...editingItem,
                                            price_max: Number(e.target.value)
                                        })}
                                    />
                                </div>
                            </div>

                            {/* Badge */}
                            <div className="space-y-2">
                                <Label>{pricingT.fields.badge}</Label>
                                <Input
                                    value={editingItem.badge || ''}
                                    onChange={(e) => setEditingItem({
                                        ...editingItem,
                                        badge: e.target.value
                                    })}
                                    placeholder={pricingT.fields.badgePlaceholder}
                                />
                            </div>

                            {/* Display Order */}
                            <div className="space-y-2">
                                <Label>{pricingT.fields.displayOrder}</Label>
                                <Input
                                    type="number"
                                    value={editingItem.display_order}
                                    onChange={(e) => setEditingItem({
                                        ...editingItem,
                                        display_order: Number(e.target.value)
                                    })}
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label>{pricingT.fields.internalNotes}</Label>
                                <Textarea
                                    value={editingItem.notes || ''}
                                    onChange={(e) => setEditingItem({
                                        ...editingItem,
                                        notes: e.target.value
                                    })}
                                    placeholder={pricingT.fields.notesPlaceholder}
                                    rows={2}
                                />
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between">
                                <Label>{pricingT.fields.activeOnSite}</Label>
                                <Switch
                                    checked={editingItem.is_active}
                                    onCheckedChange={(checked) => setEditingItem({
                                        ...editingItem,
                                        is_active: checked
                                    })}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                        >
                            {common.cancel}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-brandy-rose-500 hover:bg-brandy-rose-600"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {common.save}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
