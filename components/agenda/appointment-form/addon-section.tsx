import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Package, Check } from 'lucide-react'
import { formatCurrencyUSD } from '@/lib/formatters'
import { Addon, AddonSelecionado } from '../types'
import { cn } from '@/lib/utils'

interface AddonSectionProps {
    addonsDisponiveis: Addon[]
    addonsSelecionados: AddonSelecionado[]
    toggleAddon: (addon: Addon) => void
    updateAddonQuantidade: (codigo: string, quantidade: number) => void
}

export function AddonSection({
    addonsDisponiveis,
    addonsSelecionados,
    toggleAddon,
    updateAddonQuantidade
}: AddonSectionProps) {
    if (addonsDisponiveis.length === 0) return null

    return (
        <div className="space-y-3">
            <Label className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Serviços Adicionais
            </Label>
            <div className="grid grid-cols-2 gap-2">
                {addonsDisponiveis.map(addon => {
                    const selecionado = addonsSelecionados.find(a => a.codigo === addon.codigo)
                    return (
                        <div
                            key={addon.codigo}
                            className={cn(
                                "relative p-3 border rounded-lg transition-all text-left",
                                selecionado
                                    ? 'border-[#C48B7F] bg-[#FDF8F6] ring-1 ring-[#C48B7F]'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                            )}
                        >
                            <button
                                type="button"
                                className="w-full h-full flex items-start gap-3 outline-none"
                                onClick={() => toggleAddon(addon)}
                            >
                                <div className={cn(
                                    "mt-0.5 size-4 shrink-0 rounded-[4px] border flex items-center justify-center transition-colors",
                                    selecionado
                                        ? "bg-[#C48B7F] border-[#C48B7F]"
                                        : "border-gray-300"
                                )}>
                                    {selecionado && <Check className="w-3 h-3 text-white" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium leading-none">{addon.nome}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-[#C48B7F] font-bold">
                                            +{formatCurrencyUSD(addon.preco)}
                                        </span>
                                        {addon.minutos_adicionais > 0 && (
                                            <span className="text-xs text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded">
                                                +{addon.minutos_adicionais}min
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>

                            {selecionado && (
                                <div
                                    className="mt-3 flex items-center justify-between border-t border-[#C48B7F]/20 pt-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <span className="text-[10px] font-semibold text-[#8B5A4E] uppercase tracking-wider">Quantidade</span>
                                    <div className="flex items-center gap-2 bg-white rounded-md border border-[#C48B7F]/30 p-0.5">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 hover:bg-[#FDF8F6] text-[#C48B7F]"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                updateAddonQuantidade(addon.codigo, selecionado.quantidade - 1)
                                            }}
                                            disabled={selecionado.quantidade <= 1}
                                        >
                                            -
                                        </Button>
                                        <span className="w-4 text-center text-xs font-bold">{selecionado.quantidade}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 hover:bg-[#FDF8F6] text-[#C48B7F]"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                updateAddonQuantidade(addon.codigo, selecionado.quantidade + 1)
                                            }}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
