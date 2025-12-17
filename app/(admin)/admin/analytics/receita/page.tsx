// app/(admin)/admin/analytics/receita/page.tsx
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
    DollarSign,
    TrendingUp,
    Calendar
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'
import { format, subMonths, startOfMonth } from 'date-fns'
import { exportToExcel, exportToPDF } from '@/lib/export-utils'

const COLORS = ['#BE9982', '#9A8478', '#D4C4BC', '#8B7355', '#6B5B4F']

export default function ReceitaPage() {
    const [period, setPeriod] = useState('month')
    const [data, setData] = useState<any>({
        summary: { total: 0, average: 0, count: 0 },
        byMonth: [],
        byService: [],
        transactions: []
    })
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)

            // Definir período
            let startDate: Date
            const endDate = new Date()

            switch (period) {
                case 'week':
                    startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
                    break
                case 'month':
                    startDate = startOfMonth(new Date())
                    break
                case 'quarter':
                    startDate = subMonths(new Date(), 3)
                    break
                case 'year':
                    startDate = subMonths(new Date(), 12)
                    break
                default:
                    startDate = startOfMonth(new Date())
            }

            const startStr = format(startDate, 'yyyy-MM-dd')
            const endStr = format(endDate, 'yyyy-MM-dd')

            // Buscar todas as receitas do período
            const { data: revenue } = await supabase
                .from('financeiro')
                .select(`
          *,
          clientes (nome),
          agendamentos (tipo)
        `)
                .eq('tipo', 'receita')
                .eq('status', 'pago')
                .gte('data', startStr)
                .lte('data', endStr)
                .order('data', { ascending: false })

            if (revenue) {
                // Resumo
                const total = revenue.reduce((acc, r) => acc + r.valor, 0)
                const average = revenue.length > 0 ? total / revenue.length : 0

                // Por mês
                const byMonthMap = new Map()
                revenue.forEach(r => {
                    const month = format(new Date(r.data), 'MMM yyyy')
                    byMonthMap.set(month, (byMonthMap.get(month) || 0) + r.valor)
                })
                const byMonth = Array.from(byMonthMap.entries()).map(([month, value]) => ({
                    month,
                    value
                }))

                // Por tipo de serviço
                const byServiceMap = new Map()
                revenue.forEach(r => {
                    const service = r.categoria || 'Outros'
                    byServiceMap.set(service, (byServiceMap.get(service) || 0) + r.valor)
                })
                const byService = Array.from(byServiceMap.entries()).map(([name, value]) => ({
                    name,
                    value
                }))

                setData({
                    summary: { total, average, count: revenue.length },
                    byMonth,
                    byService,
                    transactions: revenue
                })
            }

            setIsLoading(false)
        }

        fetchData()
    }, [period])

    const handleExportExcel = () => {
        exportToExcel(data.transactions, 'relatorio-receita')
    }

    const handleExportPDF = () => {
        exportToPDF({
            title: 'Relatório de Receita',
            period,
            summary: data.summary,
            data: data.transactions
        })
    }

    if (isLoading) {
        return <div className="h-[400px] flex items-center justify-center text-muted-foreground">Carregando...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/analytics">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-heading text-h2 text-foreground">Relatório de Receita</h1>
                        <p className="text-body text-muted-foreground">
                            Análise detalhada de faturamento
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Última Semana</SelectItem>
                            <SelectItem value="month">Este Mês</SelectItem>
                            <SelectItem value="quarter">Trimestre</SelectItem>
                            <SelectItem value="year">12 Meses</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExportExcel} className="gap-2">
                        <Download className="w-4 h-4" />
                        Excel
                    </Button>
                    <Button onClick={handleExportPDF} className="gap-2">
                        <Download className="w-4 h-4" />
                        PDF
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-caption text-muted-foreground">Receita Total</p>
                                <p className="text-h3 font-semibold text-success">
                                    {formatCurrency(data.summary.total)}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-success/20" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-caption text-muted-foreground">Ticket Médio</p>
                                <p className="text-h3 font-semibold">
                                    {formatCurrency(data.summary.average)}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-muted-foreground/20" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-caption text-muted-foreground">Transações</p>
                                <p className="text-h3 font-semibold">{data.summary.count}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-muted-foreground/20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Bar Chart - By Month */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4">Receita por Período</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.byMonth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" />
                                <XAxis dataKey="month" stroke="#9A8478" fontSize={12} />
                                <YAxis stroke="#9A8478" fontSize={12} tickFormatter={(v) => `$${v}`} />
                                <Tooltip
                                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Receita']}
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E8E4E1',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="value" fill="#BE9982" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Pie Chart - By Service */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h4">Receita por Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data.byService}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {data.byService.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-h4">Transações</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.transactions.slice(0, 20).map((t: any) => (
                                <TableRow key={t.id}>
                                    <TableCell>{formatDate(t.data, 'short')}</TableCell>
                                    <TableCell>{t.clientes?.nome || '-'}</TableCell>
                                    <TableCell>{t.categoria}</TableCell>
                                    <TableCell>{t.descricao || '-'}</TableCell>
                                    <TableCell className="text-right font-semibold text-success">
                                        {formatCurrency(t.valor)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {data.transactions.length > 20 && (
                        <p className="text-center text-caption text-muted-foreground mt-4">
                            Mostrando 20 de {data.transactions.length} transações
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
