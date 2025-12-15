import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download } from 'lucide-react'

export function TabContrato({ client }: { client: any }) {
    return (
        <Card className="border-[#EAE0D5]">
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#C48B7F]" />
                        Contrato de Prestação de Serviços
                    </span>
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar PDF
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded text-sm text-gray-600 border border-gray-100 italic">
                    "Este contrato estabelece os termos para prestação de serviços de limpeza..."
                    <br /><br />
                    (Visualização do contrato não disponível. Mockup.)
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium text-green-600">Ativo</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Assinado em</p>
                        <p className="font-medium">{new Date(client.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
