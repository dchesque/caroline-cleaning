'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function RecentTransactions() {
    const [transactions, setTransactions] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        const fetchTransactions = async () => {
            const { data } = await supabase
                .from('financeiro')
                .select(`
          *,
          clientes (nome)
        `)
                .order('data', { ascending: false })
                .limit(5)

            setTransactions(data || [])
        }

        fetchTransactions()
    }, [])

    if (transactions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Nenhuma transação registrada
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${transaction.tipo === 'receita' ? 'bg-success/10' : 'bg-destructive/10'
                            }`}>
                            {transaction.tipo === 'receita' ? (
                                <TrendingUp className="w-4 h-4 text-success" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-destructive" />
                            )}
                        </div>
                        <div>
                            <p className="text-body-sm font-medium">
                                {transaction.descricao || transaction.categoria}
                            </p>
                            <p className="text-caption text-muted-foreground">
                                {transaction.clientes?.nome || formatDate(transaction.data)}
                            </p>
                        </div>
                    </div>
                    <p className={`font-semibold shrink-0 ${transaction.tipo === 'receita' ? 'text-success' : 'text-destructive'
                        }`}>
                        {transaction.tipo === 'receita' ? '+' : '-'}
                        {formatCurrency(transaction.valor)}
                    </p>
                </div>
            ))}
        </div>
    )
}
