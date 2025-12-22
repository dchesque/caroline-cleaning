'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    ArrowLeft,
    Download,
    Loader2,
    Calendar as CalendarIcon
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLORS = ['#C48B7F', '#6B8E6B', '#C4A35A', '#C17B7B', '#7B9EB8', '#8E8E8E'];

interface FinancialData {
    id: string
    tipo: 'receita' | 'custo'
    categoria: string
    descricao?: string
    valor: number
    data: string
    status: string
    forma_pagamento?: string
}

export default function RelatoriosPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<FinancialData[]>([])
    const [period, setPeriod] = useState('this_year')

    // Computed Data
    const [metrics, setMetrics] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        margin: 0
    })
    const [monthlyData, setMonthlyData] = useState<any[]>([])
    const [revenueByService, setRevenueByService] = useState<any[]>([])
    const [expensesByCategory, setExpensesByCategory] = useState<any[]>([])

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [period])

    const fetchData = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('financeiro')
                .select('*')
                .neq('status', 'cancelado') // Exclude cancelled
                .order('data', { ascending: true })

            const now = new Date()
            let startDate

            if (period === 'this_month') {
                startDate = startOfMonth(now)
            } else if (period === 'last_month') {
                startDate = startOfMonth(subMonths(now, 1))
                const endDate = endOfMonth(subMonths(now, 1))
                query = query.lte('data', format(endDate, 'yyyy-MM-dd'))
            } else if (period === 'last_3_months') {
                startDate = startOfMonth(subMonths(now, 2)) // Current + 2 prev = 3
            } else if (period === 'last_6_months') {
                startDate = startOfMonth(subMonths(now, 5))
            } else if (period === 'this_year') {
                startDate = new Date(now.getFullYear(), 0, 1)
            }

            if (startDate) {
                query = query.gte('data', format(startDate, 'yyyy-MM-dd'))
            }

            const { data: result, error } = await query

            if (error) throw error

            if (result) {
                processData(result)
                setData(result)
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro ao carregar dados do relatório')
        } finally {
            setLoading(false)
        }
    }

    const processData = (rawData: FinancialData[]) => {
        // 1. Overall Metrics
        const revenue = rawData
            .filter(d => d.tipo === 'receita' && d.status === 'pago')
            .reduce((acc, curr) => acc + curr.valor, 0)

        const expenses = rawData
            .filter(d => d.tipo === 'custo')
            .reduce((acc, curr) => acc + curr.valor, 0)

        const profit = revenue - expenses
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0

        setMetrics({ revenue, expenses, profit, margin })

        // 2. Monthly Evolution (Line Chart & Table)
        // Group by month
        const monthlyGroups = new Map<string, { receita: number, despesa: number }>()

        rawData.forEach(item => {
            const monthKey = item.data.slice(0, 7) // YYYY-MM
            const current = monthlyGroups.get(monthKey) || { receita: 0, despesa: 0 }

            if (item.tipo === 'receita' && item.status === 'pago') {
                current.receita += item.valor
            } else if (item.tipo === 'custo') {
                current.despesa += item.valor
            }

            monthlyGroups.set(monthKey, current)
        })

        const monthlyStats = Array.from(monthlyGroups.entries())
            .map(([month, values]) => {
                const date = new Date(month + '-02') // Avoid timezone issues
                return {
                    rawMonth: month,
                    name: format(date, 'MMM/yy', { locale: ptBR }),
                    receita: values.receita,
                    despesa: values.despesa,
                    lucro: values.receita - values.despesa,
                    margem: values.receita > 0 ? ((values.receita - values.despesa) / values.receita) * 100 : 0
                }
            })
            .sort((a, b) => a.rawMonth.localeCompare(b.rawMonth))

        setMonthlyData(monthlyStats)

        // 3. Revenue by Service (Bar Chart)
        const serviceGroups = new Map<string, number>()
        rawData
            .filter(d => d.tipo === 'receita' && d.status === 'pago')
            .forEach(item => {
                const key = item.categoria || 'Outro'
                serviceGroups.set(key, (serviceGroups.get(key) || 0) + item.valor)
            })

        const serviceData = Array.from(serviceGroups.entries())
            .map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
                value
            }))
            .sort((a, b) => b.value - a.value)

        setRevenueByService(serviceData)

        // 4. Expenses by Category (Pie Chart)
        const expenseGroups = new Map<string, number>()
        rawData
            .filter(d => d.tipo === 'custo')
            .forEach(item => {
                const key = item.categoria || 'Outro'
                expenseGroups.set(key, (expenseGroups.get(key) || 0) + item.valor)
            })

        const expenseData = Array.from(expenseGroups.entries())
            .map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
                value
            }))
            .sort((a, b) => b.value - a.value)

        setExpensesByCategory(expenseData)
    }

    const exportCSV = () => {
        if (data.length === 0) return

        const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Status', 'Forma Pgto']
        const csvContent = [
            headers.join(','),
            ...data.map(row => [
                row.data,
                row.tipo,
                row.categoria,
                `"${row.descricao || ''}"`,
                row.valor.toFixed(2),
                row.status,
                row.forma_pagamento || ''
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `relatorio_financeiro_${period}_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

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
                        <h1 className="font-heading text-h2 text-foreground">Relatórios Financeiros</h1>
                        <p className="text-body text-muted-foreground">
                            Análise detalhada de performance
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="this_month">Este Mês</SelectItem>
                            <SelectItem value="last_month">Mês Anterior</SelectItem>
                            <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                            <SelectItem value="last_6_months">Últimos 6 Meses</SelectItem>
                            <SelectItem value="this_year">Este Ano</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={exportCSV} disabled={data.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar CSV
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Metrics Cards */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-caption text-muted-foreground">Receita Total</p>
                                <p className="text-h3 font-semibold text-success">{formatCurrency(metrics.revenue)}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-caption text-muted-foreground">Despesas Totais</p>
                                <p className="text-h3 font-semibold text-destructive">{formatCurrency(metrics.expenses)}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-caption text-muted-foreground">Lucro Líquido</p>
                                <p className={`text-h3 font-semibold ${metrics.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {formatCurrency(metrics.profit)}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-caption text-muted-foreground">Margem de Lucro</p>
                                <p className={`text-h3 font-semibold ${metrics.margin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    {metrics.margin.toFixed(1)}%
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Evolução Mensal</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickFormatter={(val) => `${val / 1000}k`} tickLine={false} axisLine={false} />
                                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                        <Legend />
                                        <Line type="monotone" dataKey="receita" name="Receita" stroke="#6B8E6B" strokeWidth={2} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="despesa" name="Despesa" stroke="#C17B7B" strokeWidth={2} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#7B9EB8" strokeWidth={2} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Despesas por Categoria</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expensesByCategory}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {expensesByCategory.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row 2 & Table */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Receita por Tipo de Serviço</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueByService} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                        <Bar dataKey="value" fill="#C48B7F" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Resumo Mensal</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Mês</TableHead>
                                            <TableHead>Receita</TableHead>
                                            <TableHead>Despesa</TableHead>
                                            <TableHead>Lucro</TableHead>
                                            <TableHead>Margem</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {monthlyData.map((item) => (
                                            <TableRow key={item.rawMonth}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell className="text-success">{formatCurrency(item.receita)}</TableCell>
                                                <TableCell className="text-destructive">{formatCurrency(item.despesa)}</TableCell>
                                                <TableCell>{formatCurrency(item.lucro)}</TableCell>
                                                <TableCell>{item.margem.toFixed(1)}%</TableCell>
                                            </TableRow>
                                        ))}
                                        {monthlyData.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground p-4">
                                                    Sem dados
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    )
}
