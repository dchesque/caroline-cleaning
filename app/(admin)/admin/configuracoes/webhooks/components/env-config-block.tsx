import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CopyCodeBlock } from "./copy-code-block"
import { Info } from 'lucide-react'

export function EnvConfigBlock() {
    const envContent = `# Webhooks n8n
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook
N8N_WEBHOOK_SECRET=seu-secret-seguro-aqui`

    return (
        <Card className="border-brandy-rose/20 bg-white/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-brandy-rose" />
                    <CardTitle className="text-lg font-serif">Configuração de Ambiente</CardTitle>
                </div>
                <CardDescription>
                    Adicione estas variáveis ao seu arquivo <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">.env.local</code> para habilitar os webhooks.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <CopyCodeBlock
                    code={envContent}
                    language="env"
                    title=".env"
                />
                <p className="mt-3 text-xs text-zinc-500 italic">
                    * Certifique-se de que o secret no n8n seja idêntico ao definido em N8N_WEBHOOK_SECRET.
                </p>
            </CardContent>
        </Card>
    )
}
