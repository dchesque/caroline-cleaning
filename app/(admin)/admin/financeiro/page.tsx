import { createClient } from '@/lib/supabase/server'
import { FinanceiroContent } from '@/components/financeiro/financeiro-content'

export default async function FinanceiroPage() {
    const supabase = await createClient()

    // Get financial summary
    const currentMonth = new Date().toISOString().slice(0, 7)
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7)

    // Current month revenue
    const { data: currentRevenue } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('tipo', 'receita')
        .eq('status', 'pago')
        .gte('data', `${currentMonth}-01`)
        .lte('data', `${currentMonth}-31`)

    // Last month revenue
    const { data: lastRevenue } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('tipo', 'receita')
        .eq('status', 'pago')
        .gte('data', `${lastMonth}-01`)
        .lte('data', `${lastMonth}-31`)

    // Current month expenses
    const { data: currentExpenses } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('tipo', 'custo')
        .eq('status', 'pago')
        .gte('data', `${currentMonth}-01`)
        .lte('data', `${currentMonth}-31`)

    // Pending payments
    const { data: pending } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('tipo', 'receita')
        .eq('status', 'pendente')

    const totalCurrentRevenue = currentRevenue?.reduce((acc, r) => acc + r.valor, 0) || 0
    const totalLastRevenue = lastRevenue?.reduce((acc, r) => acc + r.valor, 0) || 0
    const totalExpenses = currentExpenses?.reduce((acc, r) => acc + r.valor, 0) || 0
    const totalPending = pending?.reduce((acc, r) => acc + r.valor, 0) || 0
    const profit = totalCurrentRevenue - totalExpenses

    const revenueChange = totalLastRevenue > 0
        ? ((totalCurrentRevenue - totalLastRevenue) / totalLastRevenue * 100).toFixed(1)
        : 0

    const stats = {
        totalCurrentRevenue,
        totalLastRevenue,
        totalExpenses,
        totalPending,
        profit,
        revenueChange
    }

    return <FinanceiroContent stats={stats} />
}
