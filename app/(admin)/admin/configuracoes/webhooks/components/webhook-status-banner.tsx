import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react'
import { isWebhookConfigured, WEBHOOK_ENDPOINTS } from "@/lib/config/webhooks"

export function WebhookStatusBanner() {
    const configured = isWebhookConfigured()
    const baseUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ''

    // Mascarar a URL para privacidade
    const maskedUrl = baseUrl
        ? baseUrl.replace(/(https?:\/\/)(.*)/, (_, proto, rest) => {
            const parts = rest.split('.')
            if (parts.length > 1) {
                return `${proto}***.${parts.slice(-2).join('.')}`
            }
            return `${proto}***`
        })
        : ''

    if (!configured) {
        return (
            <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <AlertTitle className="font-semibold">Webhooks não configurados</AlertTitle>
                <AlertDescription className="text-amber-800/80">
                    Configure as variáveis de ambiente <strong>NEXT_PUBLIC_N8N_WEBHOOK_URL</strong> e <strong>N8N_WEBHOOK_SECRET</strong> para habilitar as integrações.
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <Alert className="bg-green-50 border-green-200 text-green-900">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="font-semibold text-green-900">Webhooks configurados e prontos para uso</AlertTitle>
            <AlertDescription className="flex items-center gap-2 text-green-800/80">
                URL Base: <code className="bg-green-100 px-1 rounded text-green-900 font-mono text-xs">{maskedUrl}</code>
            </AlertDescription>
        </Alert>
    )
}
