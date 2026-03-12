import { Suspense } from 'react'
import { WebhooksTabs } from './components/webhooks-tabs'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
    title: 'Webhooks & Integrações | Carolina Admin',
    description: 'Documentação técnica de webhooks para integração com n8n.',
}

export default function WebhooksPage() {
    return (
        <div className="py-8 min-h-screen pr-8">
            <Suspense fallback={<WebhooksSkeleton />}>
                <WebhooksTabs />
            </Suspense>
        </div>
    )
}

function WebhooksSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-14 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        </div>
    )
}
