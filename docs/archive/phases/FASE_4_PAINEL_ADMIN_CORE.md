# FASE 4: PAINEL ADMIN - CORE
## Chesque Premium Cleaning - Plataforma de Atendimento e Gestão

**Versão:** 1.0  
**Data:** Dezembro 2024  
**Duração Estimada:** 5-7 dias  
**Prioridade:** 🔴 CRITICAL  
**Pré-requisito:** Fases 1, 2 e 3 completas

---

## 📋 RESUMO EXECUTIVO

Este documento contém instruções completas para implementar o **núcleo do painel administrativo** do Chesque Premium Cleaning.

### Escopo da Fase 4:
- ✅ Sistema de autenticação (Login/Logout)
- ✅ Middleware de proteção de rotas
- ✅ Layout Admin com Sidebar
- ✅ Dashboard com métricas
- ✅ Módulo Agenda (Day/Week/Month)
- ✅ Módulo Clientes (Lista + Ficha)
- ✅ CRUD completo

### Estrutura do Documento:
1. Autenticação e Middleware
2. Layout Admin (Sidebar, Header)
3. Dashboard (Stats, Agenda do Dia, Alertas)
4. Módulo Agenda (Calendar Views, Appointment Modal)
5. Módulo Clientes (Table, Filters, Modal)
6. Ficha do Cliente (5 Tabs)
7. Server Actions e Hooks
8. Checklist de Validação

---

## ARQUITETURA DE ROTAS

\`\`\`
app/
├── (auth)/
│   ├── login/page.tsx          # /login
│   └── layout.tsx
│
├── (admin)/
│   ├── layout.tsx              # Layout com sidebar
│   ├── admin/
│   │   ├── page.tsx            # /admin (Dashboard)
│   │   ├── agenda/page.tsx     # /admin/agenda
│   │   ├── clientes/
│   │   │   ├── page.tsx        # /admin/clientes
│   │   │   └── [id]/page.tsx   # /admin/clientes/[id]
│   │   └── loading.tsx
│
middleware.ts                    # Proteção de rotas
\`\`\`

---

## 1. AUTENTICAÇÃO

### 1.1 Página de Login

\`\`\`tsx
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        router.push('/admin')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-desert-storm p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <span className="font-heading text-h2 text-brandy-rose-600">Chesque</span>
          </div>
          <CardTitle className="text-h3">Welcome back</CardTitle>
          <CardDescription>Sign in to access your admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@Chesquecleaning.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
\`\`\`

### 1.2 Middleware de Proteção

\`\`\`tsx
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Rotas protegidas
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Redirecionar se já logado
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
\`\`\`

### 1.3 Auth Actions

\`\`\`tsx
// lib/actions/auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
\`\`\`

---

## 2. LAYOUT ADMIN

### 2.1 Layout Principal

\`\`\`tsx
// app/(admin)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-desert-storm">
      <Sidebar />
      <div className="lg:pl-64">
        <AdminHeader user={user} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
\`\`\`

### 2.2 Sidebar

\`\`\`tsx
// components/admin/sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard, Calendar, Users, FileText,
  DollarSign, Settings, Menu, MessageSquare,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Agenda', href: '/admin/agenda', icon: Calendar },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Contratos', href: '/admin/contratos', icon: FileText, disabled: true },
  { name: 'Financeiro', href: '/admin/financeiro', icon: DollarSign, disabled: true },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings, disabled: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-16 px-6 border-b border-pampas">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-heading text-h4 text-brandy-rose-600">Chesque</span>
          <span className="font-heading text-h4 text-foreground">Admin</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.disabled ? '#' : item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm font-medium transition-colors',
                  isActive ? 'bg-pot-pourri text-brandy-rose-700' : 'text-muted-foreground hover:bg-pampas',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-pampas">
        <SidebarContent />
      </aside>
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-3 left-3 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
\`\`\`

---

## 3. DASHBOARD

### 3.1 Página Dashboard

\`\`\`tsx
// app/(admin)/admin/page.tsx
import { Suspense } from 'react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { TodaySchedule } from '@/components/dashboard/today-schedule'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-h2 text-foreground">Dashboard</h1>
        <p className="text-body text-muted-foreground">
          Bem-vinda de volta! Aqui está o resumo do seu dia.
        </p>
      </div>

      <Suspense fallback={<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>}>
        <StatsCards />
      </Suspense>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-[400px]" />}>
            <TodaySchedule />
          </Suspense>
        </div>
        <div className="space-y-6">
          <QuickActions />
          <Suspense fallback={<Skeleton className="h-[200px]" />}>
            <AlertsPanel />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
\`\`\`

### 3.2 Stats Cards

\`\`\`tsx
// components/dashboard/stats-cards.tsx
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Users, DollarSign, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export async function StatsCards() {
  const supabase = await createClient()
  const { data: stats } = await supabase.from('v_dashboard_stats').select('*').single()

  const cards = [
    {
      title: 'Agendamentos Hoje',
      value: stats?.agendamentos_hoje || 0,
      subtitle: \`\${stats?.confirmados_hoje || 0} confirmados\`,
      icon: Calendar,
      color: 'text-service-regular',
      bgColor: 'bg-service-regular-light',
    },
    {
      title: 'Novos Leads',
      value: stats?.novos_leads_semana || 0,
      subtitle: 'Esta semana',
      icon: Users,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Receita do Mês',
      value: formatCurrency(stats?.receita_mes || 0),
      subtitle: 'vs mês anterior',
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Avaliação Média',
      value: stats?.rating_medio || '5.0',
      subtitle: 'Últimos 90 dias',
      icon: Star,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-muted-foreground">{card.title}</p>
                <p className="text-h2 font-semibold text-foreground mt-1">{card.value}</p>
                <p className="text-caption text-muted-foreground mt-1">{card.subtitle}</p>
              </div>
              <div className={\`p-3 rounded-lg \${card.bgColor}\`}>
                <card.icon className={\`w-5 h-5 \${card.color}\`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
\`\`\`

---

## 4. MÓDULO AGENDA

O módulo agenda inclui:
- CalendarView com navegação
- DayView, WeekView, MonthView
- AppointmentCard e AppointmentModal

### Estrutura de Componentes:

\`\`\`
components/agenda/
├── calendar-view.tsx      # Container principal
├── day-view.tsx          # Visualização por dia
├── week-view.tsx         # Visualização por semana
├── month-view.tsx        # Visualização por mês
├── appointment-card.tsx  # Card de agendamento
└── appointment-modal.tsx # Modal criar/editar
\`\`\`

### Funcionalidades:
- Navegação entre datas (prev/next/today)
- Clicar em slot vazio abre modal de criação
- Clicar em agendamento abre ficha do cliente
- Busca de cliente no modal (autocomplete)
- Validação de campos obrigatórios

---

## 5. MÓDULO CLIENTES

### 5.1 Lista de Clientes

\`\`\`tsx
// app/(admin)/admin/clientes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { ClientsTable } from '@/components/clientes/clients-table'
import { ClientsFilters } from '@/components/clientes/clients-filters'
import { ClientModal } from '@/components/clientes/client-modal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ClientesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true)
      let query = supabase.from('clientes').select('*', { count: 'exact' })

      if (filters.search) {
        query = query.or(\`nome.ilike.%\${filters.search}%,telefone.ilike.%\${filters.search}%\`)
      }
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })

      const { data } = await query
      setClients(data || [])
      setIsLoading(false)
    }
    fetchClients()
  }, [filters])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-h2 text-foreground">Clientes</h1>
          <p className="text-body text-muted-foreground">Gerencie seus clientes e leads</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      <ClientsFilters filters={filters} onChange={setFilters} />
      <ClientsTable clients={clients} isLoading={isLoading} />
      <ClientModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}
\`\`\`

### 5.2 Modal de Cliente (5 Steps)

O ClientModal usa um wizard de 5 passos:
1. **Informações Básicas**: Nome, Telefone, Email
2. **Endereço**: Rua, Cidade, Estado, ZIP
3. **Detalhes da Casa**: Tipo, Quartos, Banheiros
4. **Preferências**: Tipo serviço, Frequência, Dia preferido
5. **Acesso & Pets**: Tipo acesso, Código, Pets, Notas

---

## 6. FICHA DO CLIENTE

### 6.1 Página da Ficha

\`\`\`tsx
// app/(admin)/admin/clientes/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientHeader } from '@/components/cliente-ficha/client-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TabInfo } from '@/components/cliente-ficha/tab-info'
import { TabAgendamentos } from '@/components/cliente-ficha/tab-agendamentos'
import { TabFinanceiro } from '@/components/cliente-ficha/tab-financeiro'
import { TabContrato } from '@/components/cliente-ficha/tab-contrato'
import { TabNotas } from '@/components/cliente-ficha/tab-notas'

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client, error } = await supabase
    .from('clientes')
    .select(\`*, contratos(*), recorrencias(*)\`)
    .eq('id', id)
    .single()

  if (error || !client) notFound()

  return (
    <div className="space-y-6">
      <ClientHeader client={client} />
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="bg-white border border-pampas">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="contrato">Contrato</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>
        <TabsContent value="info"><TabInfo client={client} /></TabsContent>
        <TabsContent value="agendamentos"><TabAgendamentos clientId={id} /></TabsContent>
        <TabsContent value="financeiro"><TabFinanceiro clientId={id} /></TabsContent>
        <TabsContent value="contrato"><TabContrato client={client} /></TabsContent>
        <TabsContent value="notas"><TabNotas client={client} /></TabsContent>
      </Tabs>
    </div>
  )
}
\`\`\`

### 6.2 Tabs da Ficha

- **TabInfo**: Detalhes da casa, acesso, pets, preferências
- **TabAgendamentos**: Próximos + Histórico
- **TabFinanceiro**: Total recebido, pendente, transações
- **TabContrato**: Status do contrato, download PDF
- **TabNotas**: Notas públicas e internas (editáveis)

---

## 7. CONSTANTES E UTILITÁRIOS

### 7.1 lib/constants.ts

\`\`\`tsx
export const STATUS_CONFIG = {
  cliente: {
    lead: { label: 'Lead', variant: 'secondary' },
    ativo: { label: 'Ativo', variant: 'success' },
    pausado: { label: 'Pausado', variant: 'warning' },
    cancelado: { label: 'Cancelado', variant: 'destructive' },
    inativo: { label: 'Inativo', variant: 'outline' },
  },
  agendamento: {
    agendado: { label: 'Agendado', variant: 'secondary' },
    confirmado: { label: 'Confirmado', variant: 'success' },
    em_andamento: { label: 'Em Andamento', variant: 'warning' },
    concluido: { label: 'Concluído', variant: 'default' },
    cancelado: { label: 'Cancelado', variant: 'destructive' },
  },
}

export const SERVICE_TYPES = [
  { value: 'visit', label: 'Visita de Orçamento' },
  { value: 'regular', label: 'Limpeza Regular' },
  { value: 'deep', label: 'Limpeza Profunda' },
  { value: 'move_in_out', label: 'Move-in/Move-out' },
]

export const FREQUENCIES = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
]

export const WEEKDAYS = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
]
\`\`\`

---

## 8. FUNÇÃO SQL NECESSÁRIA

Criar no Supabase SQL Editor:

\`\`\`sql
CREATE OR REPLACE FUNCTION public.get_client_stats(client_id UUID)
RETURNS TABLE (
  total_servicos BIGINT,
  total_gasto DECIMAL,
  rating_medio DECIMAL,
  ultimo_servico DATE
) AS \$\$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM agendamentos WHERE cliente_id = client_id AND status = 'concluido'),
    (SELECT COALESCE(SUM(valor), 0) FROM financeiro WHERE cliente_id = client_id AND status = 'pago'),
    (SELECT ROUND(AVG(rating), 1) FROM feedback WHERE cliente_id = client_id),
    (SELECT MAX(data) FROM agendamentos WHERE cliente_id = client_id AND status = 'concluido');
END;
\$\$ LANGUAGE plpgsql;
\`\`\`

---

## 9. DEPENDÊNCIAS ADICIONAIS

\`\`\`bash
# Toast notifications
npm install sonner

# Date utilities
npm install date-fns
\`\`\`

Adicionar ao layout:
\`\`\`tsx
import { Toaster } from 'sonner'
// <Toaster richColors position="top-right" />
\`\`\`

---

## 10. CHECKLIST DE VALIDAÇÃO

### Autenticação
- [ ] Login funciona com email/senha
- [ ] Logout funciona
- [ ] Rotas /admin/* protegidas
- [ ] Redirect para /login se não autenticado
- [ ] Redirect para /admin se já logado

### Dashboard
- [ ] Stats cards carregam dados reais
- [ ] Agenda do dia mostra agendamentos
- [ ] Quick actions funcionam
- [ ] Alertas aparecem corretamente

### Agenda
- [ ] Day/Week/Month views funcionam
- [ ] Navegação entre datas funciona
- [ ] Criar agendamento funciona
- [ ] Busca de cliente no modal funciona

### Clientes
- [ ] Lista carrega clientes
- [ ] Busca por nome/telefone funciona
- [ ] Filtro por status funciona
- [ ] Paginação funciona
- [ ] Criar cliente funciona (5 steps)
- [ ] Ficha do cliente carrega
- [ ] Todas as 5 tabs funcionam
- [ ] Salvar notas funciona

---

## ✅ DEFINIÇÃO DE PRONTO

A Fase 4 está COMPLETA quando:

1. ✅ Login/Logout funcionando
2. ✅ Middleware protegendo rotas
3. ✅ Layout admin com sidebar
4. ✅ Dashboard com stats reais
5. ✅ Agenda com 3 views
6. ✅ CRUD de agendamentos
7. ✅ Lista de clientes com filtros
8. ✅ CRUD de clientes
9. ✅ Ficha do cliente com 5 tabs
10. ✅ Build passa sem erros

---

## 🔗 PRÓXIMA FASE

**FASE 5: Painel Admin - Módulos**
- Módulo de Contratos
- Módulo Financeiro
- Página de Configurações

---

**— FIM DA FASE 4 —**
