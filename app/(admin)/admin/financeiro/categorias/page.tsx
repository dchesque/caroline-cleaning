'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Tags } from 'lucide-react'
import { CategoryManager } from '@/components/financeiro/category-manager'
import { useAdminI18n } from '@/lib/admin-i18n/context'

export default function CategoriasPage() {
    const { t } = useAdminI18n()
    const categoriesT = t('finance_categories')
    const common = t('common')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/financeiro">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-heading text-h2 text-foreground">{categoriesT.title}</h1>
                        <p className="text-body text-muted-foreground">
                            {categoriesT.subtitle}
                        </p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                    <Tags className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-primary">{common.totalControl || 'Controle Total'}</span>
                </div>
            </div>

            <div className="grid gap-6">
                <CategoryManager />
            </div>
        </div>
    )
}
