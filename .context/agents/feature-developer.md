# Feature Developer Agent Playbook

## Mission
Implement complete, production-ready features in this Next.js 15+ TypeScript application using App Router, Tailwind CSS, shadcn/ui components, Supabase for database/auth, Recharts for charts, TanStack Table for data tables, react-hook-form + Zod for forms, and integrations like webhooks (N8N), tracking, notifications, and chat. Prioritize admin dashboards in `app/(admin)/admin/*` (financeiro/{relatorios,despesas,categorias,receitas}, contratos/{[id],novo}, clientes/[id], configuracoes/{webhooks,trackeamento,sistema,servicos,pricing,equipe,pagina-inicial,empresa,areas,addons}, analytics/{tendencias,satisfacao,receita,conversao,clientes,carol}, agenda, mensagens/[sessionId], leads, equipe), public pages in `app/(public)/*` (chat, terms, privacy), auth in `app/(auth)/login`, domain components in `components/{financeiro,agenda/appointment-form,tracking,ui,landing,dashboard,clientes,cliente-ficha/{tab-notas,tab-info,tab-financeiro,tab-contrato,tab-agendamentos,client-header},chat/{message-bubble,chat-window,chat-messages,chat-input,chat-header,chat-bubble-notification},analytics/{trends-chart,top-metrics},admin/config/sidebar}`, API routes in `app/api/*` (slots, ready, profile/{password}, pricing, health, contact, chat/{status}, webhook/n8n, tracking/{config,event}, notifications/send, financeiro/categorias/{[id]}, config/public, carol/{query,actions}), and services in `lib/services/` (e.g., WebhookService). Follow patterns: typed props/interfaces (e.g., `ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData`, `ExpenseCategory`, `RecentTransactions`), server-side rendering/fetching, responsive Tailwind/mobile-first, optimistic updates (forms/chat), service classes for orchestration, colocated types/hooks, strict TypeScript (no `any`), ARIA accessibility, Suspense/Error Boundaries/SWR, JSON `{data?, error?}` API responses.

## Responsibilities
- Create/expand pages/layouts with dynamic routes (e.g., `app/(admin)/admin/contratos/[id]/page.tsx`, `app/(admin)/admin/financeiro/despesas/page.tsx`, `app/(admin)/admin/configuracoes/addons/page.tsx`).
- Build reusable UI components for domains: financeiro (forms/tables/categories/transactions), agenda (forms/hooks/types), tracking (providers), clientes (tables/filters), cliente-ficha (tabs/header), chat (full stack: bubbles/window/messages/input/header/notifications), analytics (charts/trends/metrics), landing (pricing/badges/included), admin (config/sidebar).
- Develop services in `lib/services/` for Supabase CRUD, webhooks, tracking events, notifications.
- Implement API handlers in `app/api/*` with auth/Zod/service calls/typed responses.
- Extend types (e.g., `components/agenda/types.ts`: `ServicoTipo`, `Addon*`, `AppointmentFormData`) and props (e.g., `useAppointmentForm`, `RecentTransactions`, `ExpenseCategoryProps`, `TrackingProviderProps`, `ClientsTableProps`, `ChatWindowProps`, `TrendsChartProps`).
- Integrate Supabase (`lib/supabase/{server.ts,client.ts}`), utils (`lib/utils.ts`: `cn()`), formatters (currency/phone).
- Handle forms (react-hook-form/Zod/optimistic), tables (TanStack/pagination/filters), charts (Recharts), chat (sessioned/optimistic/real-time).
- Ensure responsive Tailwind (breakpoints), performance (Suspense/dynamic/memo/SWR), security (auth/RLS), a11y (ARIA/focus), testing (Vitest).

## Focus Areas
| Area | Directories/Files | Purpose |
|------|-------------------|---------|
| **Admin UI** | `app/(admin)/admin/{financeiro/{relatorios,receitas,despesas,categorias},contratos/{[id],novo},clientes/[id],configuracoes/{webhooks,trackeamento,sistema,servicos,pricing,equipe,pagina-inicial,empresa,areas,addons},analytics/{tendencias,satisfacao,receita,conversao,clientes,carol},agenda,mensagens/[sessionId],leads,equipe}` + `components/admin/{config,sidebar}` | Dynamic/tabbed dashboards: tables/charts/forms/filters/modals for financials/contracts/clients/config/analytics/agenda/messages; sidebar nav. |
| **Public/Auth UI** | `app/(public)/{chat,terms,privacy}`, `app/(auth)/login`, `app/(public)/chat` + `components/{landing,ui,dashboard}` | Marketing/landing/chat/static pages, login flows. |
| **Domain Components** | `components/{financeiro/{recent-transactions,transaction-form,expense-categories,category-quick-form},agenda/{types.ts,appointment-form/use-appointment-form.ts},tracking/tracking-provider.tsx,clientes/{clients-table,clients-filters},cliente-ficha/{tab-notas,tab-info,tab-financeiro,tab-contrato,tab-agendamentos,client-header},chat/{message-bubble,chat-window,chat-messages,chat-input,chat-header,chat-bubble-notification},analytics/{trends-chart,top-metrics},landing/{pricing,whats-included,trust-badges},ui,admin/config}` | Typed/reusable UI: forms/tables/tabs/chat/charts/sections/providers with shadcn, hooks, responsive Tailwind. |
| **Services** | `lib/services/` (e.g., `webhookService.ts`), colocated (`components/landing`, `components/agenda/appointment-form`) | Business logic: Supabase ops, webhooks, orchestration (85% pattern match: ES6 classes). |
| **API Routes** | `app/api/{slots,ready,profile/{,password},pricing,health,contact,chat/{,status},webhook/n8n,tracking/{config,event},notifications/send,financeiro/categorias/{,[id]},config/public,carol/{query,actions}}` | Authenticated handlers: Zod parsing, service calls, `{data, error}` JSON. |
| **Types/Utils** | `components/agenda/types.ts`, colocated props/hooks (e.g., `TransactionFormProps`, `TabAgendamentosProps`), `lib/{utils.ts,supabase/{server.ts,client.ts},formatters.ts}` | Domain types (`ServicoTipo*`, `TrendData`), utils (`cn`), clients. |

## Best Practices (Derived from Codebase)
- **Components**: PascalCase exports, typed props/interfaces (e.g., `interface ExpenseCategoryProps { categories: ExpenseCategory[]; onEdit: (id: string) => void; }`). `forwardRef` for controls. Tailwind: `cn("grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-lg border bg-card")`. Hooks: `useAppointmentForm({ initialData }: UseAppointmentFormProps)`. shadcn: `Button`, `DataTable`, `Tabs`, `Dialog`, `Card`.
- **Pages/Layouts**: Server Components default; `async function Page({ params }: { params: Promise<{ id: string }> }) { const { data } = await supabase.from('financeiro').select('*'); }`. Client: `'use client';` + `useSWR`, `mutate`. Dynamic: `params.id`. Container: `<section className="container space-y-6 py-10">`.
- **Forms**: `useForm<AppointmentFormData>({ resolver: zodResolver(AppointmentFormDataSchema) })`; formatters: `onChange={formatPhone}`. Optimistic: `mutate('/api/categorias', { revalidate: true })`.
- **Tables**: `@tanstack/react-table`: `useReactTable({ data: clients as Client[], columns, state: { pagination, globalFilter } })`; debounced filters/pagination.
- **Charts**: Recharts: `<ResponsiveContainer className="h-[400px]"><LineChart data={trendData as TrendData[]}><XAxis dataKey="date" /><Tooltip /></LineChart></ResponsiveContainer>`.
- **Chat/Tracking**: Props: `<ChatWindow {...ChatWindowProps} /> <TrackingProvider trackingId={id}>`; sessionId prop, optimistic sends, `window.gtag?`.
- **Services**: Classes: `export class WebhookService { constructor(private supabase = createServerSupabaseClient()) {} async processN8N(payload: any) { ... } } export const webhookService = new WebhookService();`. Inject Supabase.
- **API Routes**: `export async GET(request: NextRequest) { const { data: { user } } = await supabase.auth.getUser(); if (!user.user) return json({ error: 'Unauthorized' }, { status: 401 }); const result = await webhookService.getConfig(); return json({ data: result }); }`. Zod: `schema.parse(await request.json())`. POST/GET/PUT typed.
- **Auth/Security**: Server: `createServerSupabaseClient()` + `getUser()`. Client: session providers. Supabase RLS.
- **Error/Loading/Perf**: `{ data, error, isLoading }`. `<Suspense fallback={<Loader2 className="animate-spin" />}><ErrorBoundary>...</ErrorBoundary></Suspense>`. `useMemo`, `dynamic(() => import('./Heavy'))`.
- **A11y/Responsive**: `role="tablist" aria-label="Client tabs"`, `focus-visible:outline`, Tailwind: `flex-col sm:flex-row`, `lg:grid-cols-3`.
- **Conventions**: Kebab-case paths/files, PascalCase components/types/symbols, JSDoc, ESLint/Prettier/TS strict, no `any`.

## Key Files and Purposes
| File/Path | Key Symbols/Props | Purpose/Example |
|-----------|-------------------|-----------------|
| `lib/services/webhookService.ts` | `WebhookService` (class) | Webhook orchestration (N8N/Supabase/notifications); pattern for new services like `FinanceiroService`. |
| `components/agenda/types.ts` | `ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData` | Core agenda types; import for forms/tables/modals. |
| `components/agenda/appointment-form/use-appointment-form.ts` | `useAppointmentForm` (`UseAppointmentFormProps`) | Zod-validated form hook; extend for scheduling/CRUDS. |
| `components/tracking/tracking-provider.tsx` | `TrackingProviderProps`, `Window` (extended) | GA/tracking context/provider; wrap pages/components. |
| `components/financeiro/{recent-transactions.tsx,transaction-form.tsx,expense-categories.tsx,category-quick-form.tsx}` | `RecentTransactions`, `TransactionFormProps`, `ExpenseCategory(Props)`, `CategoryQuickFormProps` | Financial UI: lists/forms/categories with formatting/TanStack. |
| `components/landing/{pricing.tsx,whats-included.tsx,trust-badges.tsx}` | `PricingItem`, `WhatsIncluded`, `TrustBadges` | Marketing sections: responsive cards/grids/badges. |
| `components/clientes/{clients-table.tsx,clients-filters.tsx}` | `Client`, `ClientsTableProps`, `ClientsFiltersProps` | Paginated/filtered client management; TanStack + modals. |
| `components/cliente-ficha/{tab-notas.tsx,tab-info.tsx,tab-financeiro.tsx,tab-contrato.tsx,tab-agendamentos.tsx,client-header.tsx}` | `Tab*Props`, `ClientHeaderProps` | Client profile tabs; ID-fetched data, shadcn Tabs. |
| `components/chat/{message-bubble.tsx,chat-window.tsx,chat-messages.tsx,chat-input.tsx,chat-header.tsx,chat-bubble-notification.tsx}` | `MessageBubbleProps`, `ChatWindowProps`, `Chat*Props` | Full chat UI: sessioned, optimistic, accessible bubbles/input. |
| `components/analytics/{trends-chart.tsx,top-metrics.tsx}` | `TrendData`, `TrendsChartProps`, `Metric` | Recharts/TanStack metrics/trends; responsive data viz. |
| `app/api/{slots/route.ts,chat/route.ts,webhook/n8n/route.ts,financeiro/categorias/[id]/route.ts,tracking/config/route.ts}` | `GET`/`POST` (handlers) | Endpoints: auth/Zod/services/JSON (e.g., slots availability, chat send, webhook process). |
| `lib/utils.ts`, `lib/supabase/server.ts`/`client.ts` | `cn(...)`, `createClient(...)` | Tailwind merger, Supabase clients (server/client). |

## Workflows for Common Tasks

### 1. New Admin Page (e.g., `app/(admin)/admin/configuracoes/addons/page.tsx`)
1. Create Server `page.tsx`: `export default async function Page() { const supabase = createServerSupabaseClient(); const { data: addons } = await supabase.from('addons').select('*'); return <div className="space-y-6"><h1 className="text-3xl font-bold">Addons</h1><DataTable columns={addonsColumns} data={addons || []} /></div>; }`.
2. Add components: `<ClientsFilters /> <CategoryQuickForm />` (reuse patterns).
3. Dynamic `[id]`: `const { data } = await supabase.from('addons').select().eq('id', await params.id).single();`.
4. Sidebar: Update `components/admin/sidebar.tsx` nav links.
5. Client interactivity: `'use client'; const { data } = useSWR('/api/configuracoes/addons');`.
6. API/Service: Create `app/api/configuracoes/addons/route.ts`, `lib/services/configService.ts`.

### 2. New Component (e.g., `components/financeiro/receitas-chart.tsx`)
1. Types: `interface ReceitasData { date: string; value: number; } interface ReceitasChartProps { data: ReceitasData[]; }`.
2. JSX: `<ResponsiveContainer><BarChart data={data} fill="#3b82f6"><XAxis dataKey="date" /></BarChart></ResponsiveContainer>`.
3. Hook: `function useReceitasData(filters: Filters) { return useSWR('/api/financeiro/receitas', ...); }`.
4. A11y/Responsive: `aria-label="Receitas trends" className="h-80 sm:h-96"`.
5. Integrate: Use in `app/(admin)/admin/financeiro/receitas/page.tsx`.

### 3. New Service (e.g., `lib/services/financeiroService.ts`)
1. Class: `export class FinanceiroService { constructor(private supabase = createServerSupabaseClient()) {} async createCategoria(data: ExpenseCategory) { const { data: result } = await this.supabase.from('categorias').insert(data).select(); webhookService.handleWebhook('categoria.created', result); return result; } } export const financeiroService = new FinanceiroService();`.
2. Methods: CRUD + orchestration (webhooks/notifications).
3. Usage: API/pages: `await financeiroService.getCategorias()`.

### 4. New API Route (e.g., `app/api/financeiro/receitas/route.ts`)
1. Auth/Zod: `const { data: { user } } = await supabase.auth.getUser(); schema.parse(await request.json());`.
2. Handlers: `export async GET() { return json({ data: await financeiroService.getReceitas() }); } export async POST(request) { ... }`.
3. Errors: `{ error: 'Validation failed' }` (status: 400).

### 5. Full Feature: Table + Form + Modal (e.g., Despesas Management)
1. Components: `components/financeiro/despesas-table.tsx` (TanStack), `despesas-form.tsx` (useForm/Zod), `despesas-modal.tsx`.
2. Page: `app/(admin)/admin/financeiro/despesas/page.tsx`: `<DespesasTable /> <DespesasModal />`.
3. Service: `financeiroService.crudDespesas(data)`.
4. API: `app/api/financeiro/despesas/[id]/route.ts`.
5. Optimistic: `mutate('/api/financeiro/despesas', optimisticData, { revalidate: false })`.

### 6. Chat/Agenda Integration
1. Extend: `useAppointmentForm` + `<ChatWindow sessionId={formData.sessionId} />`.
2. Service: `appointmentService.create(formData)` → `webhookService.notify('appointment booked')`.
3. Tracking: `<TrackingProvider><AppointmentForm /></TrackingProvider>`.

### 7. Testing/Deployment Checklist
1. Tests: Colocate `despesas-table.test.tsx`: `render(<DespesasTable data={mockData} />); expect(screen.getByRole('table')).toBeInTheDocument();`.
2. Lint/TS: `npm run lint --fix && tsc --noEmit`.
3. Perf/Security: Lighthouse 90+, auth coverage, RLS checks.
4. Docs/PR: JSDoc, changelog, Supabase schema migration, screenshots.
