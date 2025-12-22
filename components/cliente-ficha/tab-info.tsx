import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Key, Calendar } from 'lucide-react'

export function TabInfo({ client }: { client: any }) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-[#EAE0D5]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Home className="w-4 h-4 text-[#C48B7F]" />
                        Detalhes da Residência
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Tipo</p>
                        <p className="font-medium capitalize">{client.tipo_residencia || '-'}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Área</p>
                        <p className="font-medium">{client.square_feet || '-'} sqft</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Quartos</p>
                        <p className="font-medium">{client.bedrooms || '-'}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Banheiros</p>
                        <p className="font-medium">{client.bathrooms || '-'}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-[#EAE0D5]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="w-4 h-4 text-[#C48B7F]" />
                        Preferências de Serviço
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Tipo de Serviço</p>
                        <p className="font-medium capitalize">{client.tipo_servico_padrao || '-'}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Frequência</p>
                        <p className="font-medium capitalize">{client.frequencia || '-'}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Dia Preferido</p>
                        <p className="font-medium capitalize">{client.dia_preferido || '-'}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-[#EAE0D5]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Key className="w-4 h-4 text-[#C48B7F]" />
                        Acesso & Pets
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Tipo de Acesso</p>
                        <p className="font-medium capitalize">{client.acesso_tipo || '-'}</p>
                    </div>
                    {client.acesso_codigo && (
                        <div>
                            <p className="text-muted-foreground">Código de Acesso</p>
                            <p className="font-mono bg-gray-100 p-1 rounded inline-block">{client.acesso_codigo}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-muted-foreground">Pets</p>
                        <p className="font-medium">
                            {client.tem_pets ? (client.pets_detalhes || 'Sim') : 'Não'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
