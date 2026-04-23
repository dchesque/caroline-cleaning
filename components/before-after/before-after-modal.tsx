'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'
import { useAdminI18n } from '@/lib/admin-i18n/context'
import type { BeforeAfterItem } from '@/types/before-after'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

interface BeforeAfterModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: BeforeAfterItem | null
    onSaved: () => void
}

export function BeforeAfterModal({
    open,
    onOpenChange,
    item,
    onSaved,
}: BeforeAfterModalProps) {
    const { t } = useAdminI18n()
    const ba = t('beforeAfter')

    const supabase = createClient()

    const [id, setId] = useState<string>('')
    const [titulo, setTitulo] = useState('')
    const [ordem, setOrdem] = useState<number>(0)
    const [ativo, setAtivo] = useState(true)
    const [imgAntes, setImgAntes] = useState('')
    const [imgDepois, setImgDepois] = useState('')
    const [uploadingAntes, setUploadingAntes] = useState(false)
    const [uploadingDepois, setUploadingDepois] = useState(false)
    const [saving, setSaving] = useState(false)

    const inputAntesRef = useRef<HTMLInputElement>(null)
    const inputDepoisRef = useRef<HTMLInputElement>(null)

    // Reset state on open/item change
    useEffect(() => {
        if (!open) return
        if (item) {
            setId(item.id)
            setTitulo(item.titulo)
            setOrdem(item.ordem)
            setAtivo(item.ativo)
            setImgAntes(item.imagem_antes)
            setImgDepois(item.imagem_depois)
        } else {
            setId(crypto.randomUUID())
            setTitulo('')
            setOrdem(0)
            setAtivo(true)
            setImgAntes('')
            setImgDepois('')
        }
    }, [open, item])

    function validateFile(file: File): boolean {
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error('Tipo de arquivo inválido. Use JPEG, PNG ou WebP.')
            return false
        }
        if (file.size > MAX_SIZE) {
            toast.error('Arquivo muito grande. Máximo 5 MB.')
            return false
        }
        return true
    }

    async function handleUpload(kind: 'antes' | 'depois', file: File) {
        if (!validateFile(file)) return

        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${id}/${kind === 'antes' ? 'antes' : 'depois'}.${ext}`

        kind === 'antes' ? setUploadingAntes(true) : setUploadingDepois(true)
        try {
            const { error: uploadError } = await supabase.storage
                .from('before-after')
                .upload(path, file, { upsert: true, contentType: file.type })

            if (uploadError) throw uploadError

            const {
                data: { publicUrl },
            } = supabase.storage.from('before-after').getPublicUrl(path)

            if (kind === 'antes') {
                setImgAntes(publicUrl)
            } else {
                setImgDepois(publicUrl)
            }
        } catch (err) {
            console.error('Upload error:', err)
            toast.error(ba.saveError)
        } finally {
            kind === 'antes' ? setUploadingAntes(false) : setUploadingDepois(false)
        }
    }

    async function handleSave() {
        if (!titulo.trim() || !imgAntes || !imgDepois) {
            toast.error(ba.saveError)
            return
        }

        setSaving(true)
        try {
            const now = new Date().toISOString()
            const payload = {
                id,
                titulo: titulo.trim(),
                ordem,
                ativo,
                imagem_antes: imgAntes,
                imagem_depois: imgDepois,
                updated_at: now,
                ...(item ? {} : { created_at: now }),
            }

            const { error } = await supabase.from('before_after').upsert(payload)
            if (error) throw error

            toast.success(ba.saveSuccess)
            onSaved()
            onOpenChange(false)
        } catch (err) {
            console.error('Save error:', err)
            toast.error(ba.saveError)
        } finally {
            setSaving(false)
        }
    }

    const inputClasses =
        'bg-white border-gray-200 shadow-sm focus:border-brandy-rose-400 focus:ring-brandy-rose-400'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {item ? ba.editItem : ba.newItem}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="ba-titulo">{ba.fieldTitle} *</Label>
                        <Input
                            id="ba-titulo"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            maxLength={120}
                            className={inputClasses}
                        />
                    </div>

                    {/* Ordem + Ativo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ba-ordem">{ba.fieldOrder}</Label>
                            <Input
                                id="ba-ordem"
                                type="number"
                                value={ordem}
                                onChange={(e) => setOrdem(Number(e.target.value))}
                                className={inputClasses}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{ba.fieldActive}</Label>
                            <div className="flex items-center h-10">
                                <Switch
                                    checked={ativo}
                                    onCheckedChange={setAtivo}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Image hint */}
                    <p className="text-xs text-muted-foreground">{ba.imageHint}</p>

                    {/* Image slots */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Before */}
                        <div className="space-y-2">
                            <Label>{ba.fieldImageBefore}</Label>
                            <div className="relative w-full aspect-square rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden group">
                                {imgAntes ? (
                                    <img
                                        src={imgAntes}
                                        alt="antes"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-400 text-xs">
                                        <Upload className="w-6 h-6" />
                                        <span>{ba.uploadBefore}</span>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={inputAntesRef}
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => {
                                    const f = e.target.files?.[0]
                                    if (f) void handleUpload('antes', f)
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full gap-2 border-brandy-rose-200 hover:bg-brandy-rose-50 hover:text-brandy-rose-600"
                                onClick={() => inputAntesRef.current?.click()}
                                disabled={uploadingAntes}
                            >
                                {uploadingAntes ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {ba.uploadBefore}
                            </Button>
                        </div>

                        {/* After */}
                        <div className="space-y-2">
                            <Label>{ba.fieldImageAfter}</Label>
                            <div className="relative w-full aspect-square rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden group">
                                {imgDepois ? (
                                    <img
                                        src={imgDepois}
                                        alt="depois"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-400 text-xs">
                                        <Upload className="w-6 h-6" />
                                        <span>{ba.uploadAfter}</span>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={inputDepoisRef}
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => {
                                    const f = e.target.files?.[0]
                                    if (f) void handleUpload('depois', f)
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full gap-2 border-brandy-rose-200 hover:bg-brandy-rose-50 hover:text-brandy-rose-600"
                                onClick={() => inputDepoisRef.current?.click()}
                                disabled={uploadingDepois}
                            >
                                {uploadingDepois ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {ba.uploadAfter}
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        {ba.cancelButton}
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-brandy-rose-500 hover:bg-brandy-rose-600"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        {ba.saveButton}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
