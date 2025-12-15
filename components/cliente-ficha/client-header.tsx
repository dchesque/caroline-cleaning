import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'
import { STATUS_CONFIG } from '@/lib/constants'

export function ClientHeader({ client }: { client: any }) {
    const status = STATUS_CONFIG.cliente[client.status as keyof typeof STATUS_CONFIG.cliente] || STATUS_CONFIG.cliente.lead

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Link href="/admin/clientes">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="font-heading text-2xl text-foreground">{client.nome}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant={status.variant} className="mr-2">
                            {status.label}
                        </Badge>
                        <span>Cliente desde {new Date(client.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(`mailto:${client.email}`)}>
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(`tel:${client.telefone}`)}>
                        <Phone className="w-4 h-4 mr-2" />
                        Ligar
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm bg-white p-4 rounded-lg border border-[#EAE0D5]">
                <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#C48B7F]" />
                    <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#C48B7F]" />
                    <span>{client.telefone}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#C48B7F]" />
                    <span>{client.endereco_rua}, {client.endereco_cidade} - {client.endereco_estado}</span>
                </div>
            </div>
        </div>
    )
}
