# FASE 7: ANALYTICS E RELATÓRIOS
## Chesque Premium Cleaning - Plataforma de Atendimento e Gestão

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Duração Estimada:** 4-5 dias  
**Prioridade:** 🟡 HIGH  
**Pré-requisito:** Fases 1-6 completas

---

## 📋 RESUMO EXECUTIVO

Esta fase implementa o **sistema completo de analytics e relatórios** para acompanhamento de métricas de negócio, conversões, performance e insights.

### Escopo da Fase 7:
- ✅ Dashboard de Analytics com métricas em tempo real
- ✅ Relatórios de Receita e Faturamento
- ✅ Análise de Conversão de Leads
- ✅ Performance da Carol (IA)
- ✅ Relatórios de Clientes e Retenção
- ✅ Exportação de Relatórios (PDF/Excel)
- ✅ Integração Google Analytics (opcional)

---

## ARQUITETURA DE ROTAS

```
app/(admin)/admin/
├── analytics/
│   ├── page.tsx                # Dashboard principal
│   ├── conversoes/page.tsx     # Análise de conversões
│   ├── receita/page.tsx        # Relatório de receita
│   ├── clientes/page.tsx       # Análise de clientes
│   └── carol/page.tsx          # Performance da IA
│
├── relatorios/
│   ├── page.tsx                # Central de relatórios
│   ├── gerar/page.tsx          # Gerar relatório customizado
│   └── historico/page.tsx      # Histórico de relatórios
```

---

## 1. DASHBOARD DE ANALYTICS

### 1.1 Página Principal - app/(admin)/admin/analytics/page.tsx

```tsx
// app/(admin)/admin/analytics/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { OverviewChart } from '@/components/analytics/overview-chart'
import { ConversionFunnel } from '@/components/analytics/conversion-funnel'
import { RecentActivity } from '@/components/analytics/recent-activity'
import { TopMetrics } from '@/components/analytics/top-metrics'

// Função para calcular métricas
async function getAnalyticsData(supabase: any) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0]
  const startOfLastMonthStr = startOfLastMonth.toISOString().split('T')[0]
  const endOfLastMonthStr = endOfLastMonth.toISOString().split('T')[0]

  // Receita do mês atual
  const { data: currentRevenue } = await supabase
    .from('financeiro')
    .select('valor')
    .eq('tipo', 'receita')
    .eq('status', 'pago')
    .gte('data', startOfMonthStr)

  // Receita do mês anterior
  const { data: lastRevenue } = await supabase
    .from('financeiro')
    .select('valor')
    .eq('tipo', 'receita')
    .eq('status', 'pago')
    .gte('data', startOfLastMonthStr)
    .lte('data', endOfLastMonthStr)

  // Novos clientes este mês
  const { count: newClients } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonthStr)

  // Novos clientes mês passado
  const { count: lastNewClients } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfLastMonthStr)
    .lte('created_at', endOfLastMonthStr)

  // Agendamentos este mês
  const { count: appointments } = await supabase
    .from('agendamentos')
    .select('*', { count: 'exact', head: true })
    .gte('data', startOfMonthStr)
    .not('status', 'eq', 'cancelado')

  // Agendamentos mês passado
  const { count: lastAppointments } = await supabase
    .from('agendamentos')
    .select('*', { count: 'exact', head: true })
    .gte('data', startOfLastMonthStr)
    .lte('data', endOfLastMonthStr)
    .not('status', 'eq', 'cancelado')

  // Conversas do chat este mês
  const { count: chatSessions } = await supabase
    .from('chat_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonthStr)

  // Total de leads convertidos
  const { count: convertedLeads } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ativo')
    .gte('created_at', startOfMonthStr)

  // Calcular totais e variações
  const totalCurrentRevenue = currentRevenue?.reduce((acc: number, r: any) => acc + r.valor, 0) || 0
  const totalLastRevenue = lastRevenue?.reduce((acc: number, r: any) => acc + r.valor, 0) || 0
  
  const revenueChange = totalLastRevenue > 0 
    ? ((totalCurrentRevenue - totalLastRevenue) / totalLastRevenue * 100)
    : 0

  const clientsChange = (lastNewClients || 0) > 0
    ? (((newClients || 0) - (lastNewClients || 0)) / (lastNewClients || 1) * 100)
    : 0

  const appointmentsChange = (lastAppointments || 0) > 0
    ? (((appointments || 0) - (lastAppointments || 0)) / (lastAppointments || 1) * 100)
    : 0

  return {
    revenue: {
      current: totalCurrentRevenue,
      change: revenueChange
    },
    clients: {
      new: newClients || 0,
      change: clientsChange
    },
    appointments: {
      total: appointments || 0,
      change: appointmentsChange
    },
    chat: {
      sessions: chatSessions || 0,
      conversions: convertedLeads || 0,
      conversionRate: chatSessions ? ((convertedLeads || 0) / chatSessions * 100) : 0
    }
  }
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const analytics = await getAnalyticsData(supabase)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-h2 text-foreground">Analytics</h1>
          <p className="text-body text-muted-foreground">
            Visão geral do desempenho do seu negócio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Receita do Mês</p>
                <p className="text-h3 font-semibold">{formatCurrency(analytics.revenue.current)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {analytics.revenue.change >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-success" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-destructive" />
                  )}
                  <span className={`text-caption ${analytics.revenue.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {Math.abs(analytics.revenue.change).toFixed(1)}% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Clients */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Novos Clientes</p>
                <p className="text-h3 font-semibold">{analytics.clients.new}</p>
                <div className="flex items-center gap-1 mt-1">
                  {analytics.clients.change >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-success" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-destructive" />
                  )}
                  <span className={`text-caption ${analytics.clients.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {Math.abs(analytics.clients.change).toFixed(1)}% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-info/10 rounded-lg">
                <Users className="w-6 h-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Agendamentos</p>
                <p className="text-h3 font-semibold">{analytics.appointments.total}</p>
                <div className="flex items-center gap-1 mt-1">
                  {analytics.appointments.change >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-success" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-destructive" />
                  )}
                  <span className={`text-caption ${analytics.appointments.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {Math.abs(analytics.appointments.change).toFixed(1)}% vs mês anterior
                  </span>
                </div>
              </div>
              <div className="p-3 bg-warning/10 rounded-lg">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Conversion */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-muted-foreground">Taxa de Conversão</p>
                <p className="text-h3 font-semibold">{analytics.chat.conversionRate.toFixed(1)}%</p>
                <p className="text-caption text-muted-foreground mt-1">
                  {analytics.chat.conversions} de {analytics.chat.sessions} leads
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="conversion">Conversões</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-h4">Receita vs Agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[350px]" />}>
                  <OverviewChart />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-h4">Métricas Principais</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[350px]" />}>
                  <TopMetrics />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-h4">Funil de Conversão</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[400px]" />}>
                  <ConversionFunnel />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-h4">Origem dos Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-[400px]" />}>
                  <LeadSourceChart />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-h4">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-[400px]" />}>
                <RecentActivity />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/analytics/receita">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-success" />
                <span className="font-medium">Relatório de Receita</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/analytics/conversoes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-info" />
                <span className="font-medium">Análise de Conversões</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/analytics/clientes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-warning" />
                <span className="font-medium">Análise de Clientes</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/analytics/carol">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="font-medium">Performance Carol</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

// Componente auxiliar para origem dos leads
async function LeadSourceChart() {
  return (
    <div className="space-y-4">
      {[
        { source: 'Website Chat', count: 45, percentage: 45, color: 'bg-primary' },
        { source: 'WhatsApp', count: 30, percentage: 30, color: 'bg-success' },
        { source: 'Indicação', count: 15, percentage: 15, color: 'bg-warning' },
        { source: 'Instagram', count: 10, percentage: 10, color: 'bg-info' },
      ].map((item) => (
        <div key={item.source} className="space-y-2">
          <div className="flex justify-between text-body-sm">
            <span>{item.source}</span>
            <span className="font-medium">{item.count} ({item.percentage}%)</span>
          </div>
          <div className="h-2 bg-pampas rounded-full overflow-hidden">
            <div 
              className={`h-full ${item.color} rounded-full`}
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 1.2 Overview Chart Component

```tsx
// components/analytics/overview-chart.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

interface ChartData {
  date: string
  receita: number
  agendamentos: number
}

export function OverviewChart() {
  const [data, setData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const chartData: ChartData[] = []

      // Últimos 30 dias
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateStr = format(date, 'yyyy-MM-dd')

        // Receita do dia
        const { data: revenue } = await supabase
          .from('financeiro')
          .select('valor')
          .eq('tipo', 'receita')
          .eq('status', 'pago')
          .eq('data', dateStr)

        // Agendamentos do dia
        const { count: appointments } = await supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('data', dateStr)
          .not('status', 'eq', 'cancelado')

        chartData.push({
          date: format(date, 'dd/MM'),
          receita: revenue?.reduce((acc, r) => acc + r.valor, 0) || 0,
          agendamentos: appointments || 0
        })
      }

      setData(chartData)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  if (isLoading) {
    return <div className="h-[350px] flex items-center justify-center text-muted-foreground">Carregando...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorAgendamentos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#BE9982" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#BE9982" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" />
        <XAxis 
          dataKey="date" 
          stroke="#9A8478" 
          fontSize={12}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis 
          yAxisId="left"
          stroke="#9A8478" 
          fontSize={12}
          tickFormatter={(value) => `$${value}`}
          tickLine={false}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          stroke="#9A8478" 
          fontSize={12}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E8E4E1',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          formatter={(value: number, name: string) => [
            name === 'receita' ? `$${value.toFixed(2)}` : value,
            name === 'receita' ? 'Receita' : 'Agendamentos'
          ]}
        />
        <Legend />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="receita"
          stroke="#22c55e"
          fillOpacity={1}
          fill="url(#colorReceita)"
          name="Receita"
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="agendamentos"
          stroke="#BE9982"
          fillOpacity={1}
          fill="url(#colorAgendamentos)"
          name="Agendamentos"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

### 1.3 Conversion Funnel Component

```tsx
// components/analytics/conversion-funnel.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FunnelStep {
  name: string
  value: number
  percentage: number
  color: string
}

export function ConversionFunnel() {
  const [steps, setSteps] = useState<FunnelStep[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0]

      // Total de sessões de chat
      const { count: sessions } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth)

      // Leads capturados (clientes criados)
      const { count: leads } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth)

      // Orçamentos enviados
      const { count: quotes } = await supabase
        .from('orcamentos')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth)

      // Agendamentos criados
      const { count: appointments } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth)

      // Serviços concluídos
      const { count: completed } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'concluido')
        .gte('data', startOfMonth)

      const totalSessions = sessions || 1

      setSteps([
        { 
          name: 'Visitantes Chat', 
          value: sessions || 0, 
          percentage: 100,
          color: 'bg-brandy-rose-200'
        },
        { 
          name: 'Leads Capturados', 
          value: leads || 0, 
          percentage: ((leads || 0) / totalSessions) * 100,
          color: 'bg-brandy-rose-300'
        },
        { 
          name: 'Orçamentos Enviados', 
          value: quotes || 0, 
          percentage: ((quotes || 0) / totalSessions) * 100,
          color: 'bg-brandy-rose-400'
        },
        { 
          name: 'Agendamentos', 
          value: appointments || 0, 
          percentage: ((appointments || 0) / totalSessions) * 100,
          color: 'bg-brandy-rose-500'
        },
        { 
          name: 'Serviços Concluídos', 
          value: completed || 0, 
          percentage: ((completed || 0) / totalSessions) * 100,
          color: 'bg-brandy-rose-600'
        },
      ])

      setIsLoading(false)
    }

    fetchData()
  }, [])

  if (isLoading) {
    return <div className="h-[400px] flex items-center justify-center text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.name} className="relative">
          <div className="flex justify-between mb-1">
            <span className="text-body-sm font-medium">{step.name}</span>
            <span className="text-body-sm text-muted-foreground">
              {step.value} ({step.percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="h-10 bg-pampas rounded-lg overflow-hidden relative">
            <div
              className={`h-full ${step.color} transition-all duration-500`}
              style={{ width: `${Math.max(step.percentage, 5)}%` }}
            />
            {index < steps.length - 1 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-caption text-muted-foreground">
                {index > 0 && steps[index - 1].value > 0 && (
                  <span>
                    {((step.value / steps[index - 1].value) * 100).toFixed(0)}% →
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="pt-4 border-t border-pampas">
        <div className="flex justify-between text-body-sm">
          <span className="text-muted-foreground">Taxa de Conversão Total</span>
          <span className="font-semibold text-success">
            {steps.length > 0 && steps[0].value > 0
              ? ((steps[steps.length - 1].value / steps[0].value) * 100).toFixed(1)
              : 0}%
          </span>
        </div>
      </div>
    </div>
  )
}
```

### 1.4 Top Metrics Component

```tsx
// components/analytics/top-metrics.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { 
  TrendingUp, 
  Clock, 
  Star, 
  Repeat,
  DollarSign,
  Users
} from 'lucide-react'

interface Metric {
  label: string
  value: string
  icon: any
  trend?: string
  trendUp?: boolean
}

export function TopMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchMetrics = async () => {
      // Ticket médio
      const { data: revenue } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('tipo', 'receita')
        .eq('status', 'pago')

      const avgTicket = revenue && revenue.length > 0
        ? revenue.reduce((acc, r) => acc + r.valor, 0) / revenue.length
        : 0

      // Taxa de retenção (clientes com mais de 1 agendamento)
      const { data: clients } = await supabase
        .from('clientes')
        .select('id')
        .eq('status', 'ativo')

      let retentionCount = 0
      if (clients) {
        for (const client of clients) {
          const { count } = await supabase
            .from('agendamentos')
            .select('*', { count: 'exact', head: true })
            .eq('cliente_id', client.id)
            .eq('status', 'concluido')

          if (count && count > 1) retentionCount++
        }
      }

      const retentionRate = clients && clients.length > 0
        ? (retentionCount / clients.length) * 100
        : 0

      // Avaliação média
      const { data: feedback } = await supabase
        .from('feedback')
        .select('rating')

      const avgRating = feedback && feedback.length > 0
        ? feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length
        : 0

      // Tempo médio de resposta (mock por enquanto)
      const avgResponseTime = '< 1 min'

      // LTV estimado (ticket médio * frequência média)
      const estimatedLTV = avgTicket * 12 // Assumindo 1 serviço por mês

      setMetrics([
        {
          label: 'Ticket Médio',
          value: formatCurrency(avgTicket),
          icon: DollarSign,
          trend: '+5.2%',
          trendUp: true
        },
        {
          label: 'Taxa de Retenção',
          value: `${retentionRate.toFixed(1)}%`,
          icon: Repeat,
          trend: '+2.1%',
          trendUp: true
        },
        {
          label: 'Avaliação Média',
          value: avgRating > 0 ? `${avgRating.toFixed(1)} ⭐` : 'N/A',
          icon: Star,
        },
        {
          label: 'Tempo de Resposta',
          value: avgResponseTime,
          icon: Clock,
        },
        {
          label: 'LTV Estimado',
          value: formatCurrency(estimatedLTV),
          icon: TrendingUp,
        },
        {
          label: 'Clientes Ativos',
          value: clients?.length.toString() || '0',
          icon: Users,
        },
      ])

      setIsLoading(false)
    }

    fetchMetrics()
  }, [])

  if (isLoading) {
    return <div className="h-[350px] flex items-center justify-center text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <div key={metric.label} className="flex items-center justify-between p-3 bg-desert-storm rounded-lg">
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-body-sm">{metric.label}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold">{metric.value}</span>
              {metric.trend && (
                <p className={`text-caption ${metric.trendUp ? 'text-success' : 'text-destructive'}`}>
                  {metric.trend}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

### 1.5 Recent Activity Component

```tsx
// components/analytics/recent-activity.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  UserPlus, 
  Calendar, 
  DollarSign, 
  MessageSquare,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Activity {
  id: string
  type: 'client' | 'appointment' | 'payment' | 'chat' | 'completed' | 'cancelled'
  description: string
  time: string
  icon: any
  color: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchActivities = async () => {
      const allActivities: Activity[] = []

      // Novos clientes
      const { data: clients } = await supabase
        .from('clientes')
        .select('id, nome, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      clients?.forEach(c => {
        allActivities.push({
          id: `client-${c.id}`,
          type: 'client',
          description: `Novo lead: ${c.nome}`,
          time: c.created_at,
          icon: UserPlus,
          color: 'text-info'
        })
      })

      // Agendamentos recentes
      const { data: appointments } = await supabase
        .from('agendamentos')
        .select('id, tipo, data, status, created_at, clientes(nome)')
        .order('created_at', { ascending: false })
        .limit(5)

      appointments?.forEach(a => {
        const clientName = (a.clientes as any)?.nome || 'Cliente'
        if (a.status === 'concluido') {
          allActivities.push({
            id: `completed-${a.id}`,
            type: 'completed',
            description: `Serviço concluído para ${clientName}`,
            time: a.created_at,
            icon: CheckCircle,
            color: 'text-success'
          })
        } else if (a.status === 'cancelado') {
          allActivities.push({
            id: `cancelled-${a.id}`,
            type: 'cancelled',
            description: `Agendamento cancelado: ${clientName}`,
            time: a.created_at,
            icon: XCircle,
            color: 'text-destructive'
          })
        } else {
          allActivities.push({
            id: `apt-${a.id}`,
            type: 'appointment',
            description: `Novo agendamento: ${clientName} (${a.data})`,
            time: a.created_at,
            icon: Calendar,
            color: 'text-warning'
          })
        }
      })

      // Pagamentos recentes
      const { data: payments } = await supabase
        .from('financeiro')
        .select('id, valor, created_at, clientes(nome)')
        .eq('tipo', 'receita')
        .eq('status', 'pago')
        .order('created_at', { ascending: false })
        .limit(5)

      payments?.forEach(p => {
        const clientName = (p.clientes as any)?.nome || 'Cliente'
        allActivities.push({
          id: `payment-${p.id}`,
          type: 'payment',
          description: `Pagamento recebido: $${p.valor} de ${clientName}`,
          time: p.created_at,
          icon: DollarSign,
          color: 'text-success'
        })
      })

      // Ordenar por tempo
      allActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

      setActivities(allActivities.slice(0, 10))
      setIsLoading(false)
    }

    fetchActivities()
  }, [])

  if (isLoading) {
    return <div className="h-[400px] flex items-center justify-center text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activity.icon
        return (
          <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-desert-storm rounded-lg transition-colors">
            <div className={`p-2 rounded-lg bg-pampas ${activity.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm">{activity.description}</p>
              <p className="text-caption text-muted-foreground">
                {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

---

## 2. RELATÓRIO DE RECEITA

### 2.1 Página de Receita - app/(admin)/admin/analytics/receita/page.tsx

```tsx
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
  TrendingDown,
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
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
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
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Receita']}
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
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.byService.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
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
```

---

## 3. ANÁLISE DE CONVERSÕES

### 3.1 Página de Conversões - app/(admin)/admin/analytics/conversoes/page.tsx

```tsx
// app/(admin)/admin/analytics/conversoes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, TrendingUp, Users, MessageSquare, Calendar, Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { format, subDays } from 'date-fns'

export default function ConversoesPage() {
  const [period, setPeriod] = useState('30')
  const [data, setData] = useState<any>({
    funnel: [],
    dailyConversions: [],
    bySource: [],
    stats: {}
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const days = parseInt(period)
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')

      // Sessões de chat
      const { count: sessions } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)

      // Leads capturados
      const { count: leads } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)

      // Orçamentos
      const { count: quotes } = await supabase
        .from('orcamentos')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)

      // Agendamentos
      const { count: appointments } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)

      // Concluídos
      const { count: completed } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'concluido')
        .gte('data', startDate)

      // Receita de convertidos
      const { data: revenue } = await supabase
        .from('financeiro')
        .select('valor')
        .eq('tipo', 'receita')
        .eq('status', 'pago')
        .gte('data', startDate)

      const totalRevenue = revenue?.reduce((acc, r) => acc + r.valor, 0) || 0

      // Conversões diárias
      const dailyData = []
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateStr = format(date, 'yyyy-MM-dd')

        const { count: dailyLeads } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${dateStr}T00:00:00`)
          .lt('created_at', `${dateStr}T23:59:59`)

        const { count: dailyAppointments } = await supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${dateStr}T00:00:00`)
          .lt('created_at', `${dateStr}T23:59:59`)

        dailyData.push({
          date: format(date, 'dd/MM'),
          leads: dailyLeads || 0,
          agendamentos: dailyAppointments || 0
        })
      }

      // Por origem
      const { data: clientsBySource } = await supabase
        .from('clientes')
        .select('origem')
        .gte('created_at', startDate)

      const sourceMap = new Map()
      clientsBySource?.forEach(c => {
        const source = c.origem || 'Direto'
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
      })

      const bySource = Array.from(sourceMap.entries()).map(([source, count]) => ({
        source,
        count
      }))

      setData({
        funnel: [
          { name: 'Visitantes', value: sessions || 0 },
          { name: 'Leads', value: leads || 0 },
          { name: 'Orçamentos', value: quotes || 0 },
          { name: 'Agendamentos', value: appointments || 0 },
          { name: 'Concluídos', value: completed || 0 },
        ],
        dailyConversions: dailyData,
        bySource,
        stats: {
          sessions: sessions || 0,
          leads: leads || 0,
          appointments: appointments || 0,
          completed: completed || 0,
          revenue: totalRevenue,
          conversionRate: sessions ? ((completed || 0) / sessions * 100) : 0,
          avgValue: completed ? (totalRevenue / completed) : 0
        }
      })

      setIsLoading(false)
    }

    fetchData()
  }, [period])

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
            <h1 className="font-heading text-h2 text-foreground">Análise de Conversões</h1>
            <p className="text-body text-muted-foreground">
              Acompanhe o funil de vendas e taxas de conversão
            </p>
          </div>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-info/10 rounded-lg">
                <MessageSquare className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Sessões Chat</p>
                <p className="text-h3 font-semibold">{data.stats.sessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <Users className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Leads Capturados</p>
                <p className="text-h3 font-semibold">{data.stats.leads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <Target className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Taxa Conversão</p>
                <p className="text-h3 font-semibold">{data.stats.conversionRate?.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Receita Gerada</p>
                <p className="text-h3 font-semibold">{formatCurrency(data.stats.revenue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h4">Funil de Conversão</CardTitle>
          <CardDescription>Do primeiro contato até o serviço concluído</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.funnel.map((step: any, index: number) => {
              const prevValue = index > 0 ? data.funnel[index - 1].value : step.value
              const dropRate = prevValue > 0 ? ((prevValue - step.value) / prevValue * 100) : 0
              const convRate = data.funnel[0].value > 0 
                ? (step.value / data.funnel[0].value * 100) 
                : 0

              return (
                <div key={step.name} className="relative">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-caption flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <span className="font-medium">{step.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{step.value}</span>
                      <span className="text-caption text-muted-foreground ml-2">
                        ({convRate.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-8 bg-pampas rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brandy-rose-400 to-brandy-rose-500 transition-all duration-500"
                      style={{ width: `${Math.max(convRate, 2)}%` }}
                    />
                  </div>
                  {index > 0 && dropRate > 0 && (
                    <p className="text-caption text-destructive mt-1">
                      ↓ {dropRate.toFixed(1)}% de perda do estágio anterior
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Conversions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h4">Conversões Diárias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyConversions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" />
                <XAxis dataKey="date" stroke="#9A8478" fontSize={12} />
                <YAxis stroke="#9A8478" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E8E4E1',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#BE9982" 
                  strokeWidth={2}
                  dot={{ fill: '#BE9982' }}
                  name="Leads"
                />
                <Line 
                  type="monotone" 
                  dataKey="agendamentos" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                  name="Agendamentos"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h4">Leads por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.bySource} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" />
                <XAxis type="number" stroke="#9A8478" fontSize={12} />
                <YAxis dataKey="source" type="category" stroke="#9A8478" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E8E4E1',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#BE9982" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## 4. PERFORMANCE DA CAROL (IA)

### 4.1 Página de Performance - app/(admin)/admin/analytics/carol/page.tsx

```tsx
// app/(admin)/admin/analytics/carol/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft, 
  MessageSquare, 
  Zap, 
  Clock, 
  ThumbsUp,
  Bot,
  Users,
  Target,
  TrendingUp
} from 'lucide-react'
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
  LineChart,
  Line
} from 'recharts'
import { format, subDays } from 'date-fns'

const COLORS = ['#BE9982', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444']

export default function CarolPerformancePage() {
  const [period, setPeriod] = useState('30')
  const [data, setData] = useState<any>({
    stats: {},
    intentDistribution: [],
    dailyActivity: [],
    responseQuality: [],
    topQuestions: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const days = parseInt(period)
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')

      // Total de mensagens
      const { count: totalMessages } = await supabase
        .from('mensagens_chat')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)

      // Mensagens da Carol
      const { count: carolMessages } = await supabase
        .from('mensagens_chat')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'assistant')
        .gte('created_at', startDate)

      // Sessões únicas
      const { data: sessions } = await supabase
        .from('mensagens_chat')
        .select('session_id')
        .gte('created_at', startDate)

      const uniqueSessions = new Set(sessions?.map(s => s.session_id)).size

      // Leads gerados via chat
      const { count: leadsGenerated } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('origem', 'chat_carol')
        .gte('created_at', startDate)

      // Agendamentos via chat
      const { count: appointmentsBooked } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true })
        .eq('origem', 'chat_carol')
        .gte('created_at', startDate)

      // Intenções detectadas
      const { data: intents } = await supabase
        .from('mensagens_chat')
        .select('intent_detected')
        .not('intent_detected', 'is', null)
        .gte('created_at', startDate)

      const intentMap = new Map()
      intents?.forEach(i => {
        const intent = i.intent_detected || 'outros'
        intentMap.set(intent, (intentMap.get(intent) || 0) + 1)
      })

      const intentDistribution = Array.from(intentMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

      // Atividade diária
      const dailyActivity = []
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateStr = format(date, 'yyyy-MM-dd')

        const { count: dailyMessages } = await supabase
          .from('mensagens_chat')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${dateStr}T00:00:00`)
          .lt('created_at', `${dateStr}T23:59:59`)

        const { count: dailySessions } = await supabase
          .from('chat_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${dateStr}T00:00:00`)
          .lt('created_at', `${dateStr}T23:59:59`)

        dailyActivity.push({
          date: format(date, 'dd/MM'),
          mensagens: dailyMessages || 0,
          sessoes: dailySessions || 0
        })
      }

      // Calcular métricas
      const avgMessagesPerSession = uniqueSessions > 0 
        ? (totalMessages || 0) / uniqueSessions 
        : 0

      const conversionRate = uniqueSessions > 0
        ? ((leadsGenerated || 0) / uniqueSessions * 100)
        : 0

      setData({
        stats: {
          totalMessages: totalMessages || 0,
          carolMessages: carolMessages || 0,
          uniqueSessions,
          leadsGenerated: leadsGenerated || 0,
          appointmentsBooked: appointmentsBooked || 0,
          avgMessagesPerSession,
          conversionRate
        },
        intentDistribution,
        dailyActivity,
        responseQuality: [
          { name: 'Resolvido', value: 75 },
          { name: 'Transferido', value: 15 },
          { name: 'Abandonado', value: 10 },
        ],
        topQuestions: [
          'Quanto custa a limpeza?',
          'Quais áreas vocês atendem?',
          'Como agendar?',
          'Vocês aceitam pets?',
          'Qual o horário de funcionamento?'
        ]
      })

      setIsLoading(false)
    }

    fetchData()
  }, [period])

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
            <h1 className="font-heading text-h2 text-foreground">Performance da Carol</h1>
            <p className="text-body text-muted-foreground">
              Análise de desempenho da assistente virtual
            </p>
          </div>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Total Mensagens</p>
                <p className="text-h3 font-semibold">{data.stats.totalMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-info/10 rounded-lg">
                <Users className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Sessões Únicas</p>
                <p className="text-h3 font-semibold">{data.stats.uniqueSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <Target className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Leads Gerados</p>
                <p className="text-h3 font-semibold">{data.stats.leadsGenerated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-caption text-muted-foreground">Taxa Conversão</p>
                <p className="text-h3 font-semibold">{data.stats.conversionRate?.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h4">Atividade Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" />
                <XAxis dataKey="date" stroke="#9A8478" fontSize={12} />
                <YAxis stroke="#9A8478" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E8E4E1',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mensagens" 
                  stroke="#BE9982" 
                  strokeWidth={2}
                  name="Mensagens"
                />
                <Line 
                  type="monotone" 
                  dataKey="sessoes" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Sessões"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Intent Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h4">Intenções Detectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.intentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.intentDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Response Quality */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h4">Qualidade das Respostas</CardTitle>
            <CardDescription>Resultado das interações</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.responseQuality.map((item: any, index: number) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between text-body-sm">
                    <span>{item.name}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                  <div className="h-3 bg-pampas rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ 
                        width: `${item.value}%`,
                        backgroundColor: COLORS[index]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h4">Perguntas Mais Frequentes</CardTitle>
            <CardDescription>O que os usuários mais perguntam</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topQuestions.map((question: string, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-3 bg-desert-storm rounded-lg"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-caption flex items-center justify-center font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-body-sm">{question}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h4">Métricas de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-desert-storm rounded-lg">
              <Bot className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-h4 font-semibold">{data.stats.carolMessages}</p>
              <p className="text-caption text-muted-foreground">Respostas da Carol</p>
            </div>
            <div className="text-center p-4 bg-desert-storm rounded-lg">
              <Zap className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-h4 font-semibold">{data.stats.avgMessagesPerSession?.toFixed(1)}</p>
              <p className="text-caption text-muted-foreground">Msgs por Sessão</p>
            </div>
            <div className="text-center p-4 bg-desert-storm rounded-lg">
              <Clock className="w-8 h-8 text-info mx-auto mb-2" />
              <p className="text-h4 font-semibold">&lt; 1s</p>
              <p className="text-caption text-muted-foreground">Tempo de Resposta</p>
            </div>
            <div className="text-center p-4 bg-desert-storm rounded-lg">
              <ThumbsUp className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-h4 font-semibold">{data.stats.appointmentsBooked}</p>
              <p className="text-caption text-muted-foreground">Agendamentos via Chat</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 5. UTILITÁRIOS DE EXPORTAÇÃO

### 5.1 lib/export-utils.ts

```typescript
// lib/export-utils.ts

// Export to Excel (CSV format)
export function exportToExcel(data: any[], filename: string) {
  if (!data || data.length === 0) return

  // Get headers from first object
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle nested objects
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        }
        // Handle strings with commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value ?? ''
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Export to PDF (using browser print)
export function exportToPDF(options: {
  title: string
  period?: string
  summary?: any
  data?: any[]
}) {
  const { title, period, summary, data } = options

  // Create printable content
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 20px;
          color: #333;
        }
        h1 { 
          color: #BE9982; 
          border-bottom: 2px solid #BE9982;
          padding-bottom: 10px;
        }
        .meta { 
          color: #666; 
          margin-bottom: 20px;
        }
        .summary { 
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          flex: 1;
        }
        .summary-card label {
          font-size: 12px;
          color: #666;
        }
        .summary-card value {
          display: block;
          font-size: 24px;
          font-weight: bold;
        }
        table { 
          width: 100%; 
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left;
        }
        th { 
          background: #BE9982; 
          color: white;
        }
        tr:nth-child(even) { 
          background: #f9f9f9;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="meta">
        Gerado em: ${new Date().toLocaleDateString('pt-BR')}
        ${period ? ` | Período: ${period}` : ''}
      </p>
      
      ${summary ? `
        <div class="summary">
          <div class="summary-card">
            <label>Total</label>
            <value>$${summary.total?.toFixed(2) || 0}</value>
          </div>
          <div class="summary-card">
            <label>Média</label>
            <value>$${summary.average?.toFixed(2) || 0}</value>
          </div>
          <div class="summary-card">
            <label>Transações</label>
            <value>${summary.count || 0}</value>
          </div>
        </div>
      ` : ''}
      
      ${data && data.length > 0 ? `
        <table>
          <thead>
            <tr>
              ${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.slice(0, 50).map(row => `
              <tr>
                ${Object.values(row).map(val => {
                  if (typeof val === 'object' && val !== null) {
                    return `<td>${(val as any).nome || JSON.stringify(val)}</td>`
                  }
                  return `<td>${val ?? '-'}</td>`
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${data.length > 50 ? `<p>... e mais ${data.length - 50} registros</p>` : ''}
      ` : ''}
      
      <div class="footer">
        <p>Chesque Premium Cleaning - Relatório Confidencial</p>
      </div>
    </body>
    </html>
  `

  // Open print window
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}
```

---

## 6. ATUALIZAR SIDEBAR

Adicionar link para Analytics na sidebar:

```tsx
// components/admin/sidebar.tsx - Atualizar navigation

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Agenda', href: '/admin/agenda', icon: Calendar },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Contratos', href: '/admin/contratos', icon: FileText },
  { name: 'Financeiro', href: '/admin/financeiro', icon: DollarSign },
  { name: 'Mensagens', href: '/admin/mensagens', icon: MessageSquare },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 }, // NOVO
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
]
```

---

## 7. CHECKLIST DE VALIDAÇÃO

### Dashboard Analytics
- [ ] KPI cards carregam corretamente
- [ ] Gráfico de receita vs agendamentos funciona
- [ ] Funil de conversão renderiza
- [ ] Métricas principais calculam corretamente
- [ ] Atividade recente carrega

### Relatório de Receita
- [ ] Filtro de período funciona
- [ ] Gráfico de barras por mês funciona
- [ ] Gráfico de pizza por categoria funciona
- [ ] Tabela de transações carrega
- [ ] Exportação Excel funciona
- [ ] Exportação PDF funciona

### Análise de Conversões
- [ ] Funil visualiza corretamente
- [ ] Taxas de conversão calculam
- [ ] Gráfico de conversões diárias funciona
- [ ] Leads por origem mostra dados

### Performance Carol
- [ ] Métricas de chat carregam
- [ ] Atividade diária renderiza
- [ ] Intenções detectadas mostram
- [ ] Perguntas frequentes listam

---

## ✅ DEFINIÇÃO DE PRONTO

A Fase 7 está COMPLETA quando:

1. ✅ Dashboard de Analytics com KPIs funcionando
2. ✅ Gráficos interativos (Recharts) renderizando
3. ✅ Relatório de Receita com exportação
4. ✅ Análise de Conversões com funil
5. ✅ Performance da Carol com métricas
6. ✅ Exportação para Excel (CSV)
7. ✅ Exportação para PDF
8. ✅ Sidebar atualizada
9. ✅ Build passa sem erros

---

## 🔗 PRÓXIMA FASE

**FASE 8: Deploy e Produção**
- Configuração Easypanel
- Dockerfile otimizado
- Variáveis de ambiente de produção
- SSL e domínio
- Monitoramento e logs

---

**— FIM DA FASE 7 —**
