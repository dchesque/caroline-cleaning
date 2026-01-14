import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, Search, X, User } from 'lucide-react'

interface ClientSelectorProps {
    selectedClient: any
    onSelect: (client: any) => void
    clients: any[]
    searchTerm: string
    onSearchChange: (value: string) => void
    isLoading: boolean
}

export function ClientSelector({
    selectedClient,
    onSelect,
    clients,
    searchTerm,
    onSearchChange,
    isLoading
}: ClientSelectorProps) {
    return (
        <div className="space-y-2">
            <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Cliente *
            </Label>
            {selectedClient ? (
                <div className="flex items-center justify-between p-3 bg-[#FDF8F6] rounded-lg border border-[#C48B7F]/20">
                    <div>
                        <p className="font-medium">{selectedClient.nome}</p>
                        <p className="text-sm text-muted-foreground">{selectedClient.telefone}</p>
                        {selectedClient.endereco_completo && (
                            <p className="text-xs text-muted-foreground mt-1">{selectedClient.endereco_completo}</p>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelect(null)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            ) : (
                <>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            placeholder="Buscar por nome ou telefone..."
                            className="pl-10"
                        />
                    </div>
                    {isLoading && (
                        <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Buscando...
                        </div>
                    )}
                    {clients.length > 0 && (
                        <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                            {clients.map(client => (
                                <div
                                    key={client.id}
                                    className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => {
                                        onSelect(client)
                                    }}
                                >
                                    <p className="font-medium">{client.nome}</p>
                                    <p className="text-sm text-muted-foreground">{client.telefone}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
