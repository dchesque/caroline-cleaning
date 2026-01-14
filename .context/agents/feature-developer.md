# Feature Developer Agent Playbook

## Mission
Implement complete, production-ready features in this Next.js 15+ TypeScript application using App Router, Tailwind CSS, shadcn/ui components, Supabase for database/auth, Recharts for charts, TanStack Table for data tables, react-hook-form + Zod for forms, and webhook integrations (e.g., N8N). Focus on admin dashboards in `app/(admin)/admin/*` (e.g., financeiro relatórios/despesas/categorias/receitas, contratos/[id]/novo, clientes/[id], configuracoes/servicos/pricing/equipe/areas/addons, analytics/tendencias/satisfacao/receita/conversao/clientes/carol, agenda, mensagens/[sessionId], leads, equipe), public pages in `app/(public)/*` (e.g., chat, terms, privacy), domain-specific components in `components/{financeiro,agenda/appointment-form,clientes,cliente-ficha/{tab-notas,tab-info,tab-financeiro,tab-contrato,tab-agendamentos,client-header},chat/{message-bubble,chat-window,chat-messages,chat-input,chat-header,chat-bubble-notification},analytics,landing/{pricing,whats-included,meet-carol,how-it-works,faq,announcement-bar},ui,admin/config,dashboard}`, API routes in `app/api/*` (e.g., slots, chat/status, webhook/n8n, notifications/send, financeiro/categorias/[id], carol/query/actions, config/public), and services in `lib/services/` (e.g., WebhookService). Adhere to patterns: typed props/interfaces (e.g., `ServicoTipo`, `Addon`, `AppointmentFormData`), server-side data fetching/rendering, responsive/mobile-first Tailwind, optimistic updates for forms/chat, service classes for business logic, colocated types, strict TypeScript (no `any`), ARIA accessibility, Suspense/Error Boundaries, and JSON `{data?, error?}` responses.

## Responsibilities
- Build new/expand pages/layouts with dynamic routes (e.g., `app/(admin)/admin/contratos/[id]/page.tsx`, `app/(admin)/admin/mensagens/[sessionId]/page.tsx`, `app/(admin)/admin/analytics/tendencias/page.tsx`).
- Develop UI components for core domains: financeiro (transaction/expense forms, categories), agenda (appointment forms/hooks/types), clientes (tables/filters/modals), cliente-ficha (tabbed profiles: info/notas/financeiro/contrato/agendamentos/header), chat (full UI: window/messages/input/bubbles/header/notifications), analytics (charts/trends/satisfaction/revenue), landing (pricing/FAQ/sections), admin (sidebar/config).
- Create services in `lib/services/` for Supabase CRUD, webhooks, notifications, orchestration.
- Implement API handlers in `app/api/*` with auth, Zod parsing, service calls.
- Define/extend types (e.g., `components/agenda/types.ts`: `ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData`) and typed props (e.g., `TransactionFormProps`, `ClientsTableProps`, `ChatWindowProps`, `TrendData`).
- Integrate Supabase server/client clients (`lib/supabase/server.ts`/`client.ts`), utils (`lib/utils.ts`: `cn()`), formatters (currency/phone).
- Manage forms (react-hook-form/Zod), tables (TanStack/pagination/filters), charts (Recharts responsive), chat (sessioned/optimistic).
- Ensure responsive design (Tailwind breakpoints), performance (Suspense/dynamic, memoization), security (auth checks), testing (Vitest snapshots/mocks).

## Focus Areas
| Area | Directories/Files | Purpose |
|------|-------------------|---------|
| **Admin UI** | `app/(admin)/admin/{financeiro/{relatorios,despesas,categorias,receitas},contratos/{[id],novo},clientes/[id],configuracoes/{servicos,pricing,equipe,areas,addons},analytics/{tendencias,satisfacao,receita,conversao,clientes,carol},agenda,mensagens/[sessionId],leads,equipe}` + `components/admin/config`, `components/admin/sidebar.tsx` | Tabbed/dynamic dashboards: tables/charts/filters/modals for financials/contracts/clients/config/analytics; sidebar navigation. |
| **Public UI** | `app/(public)/{chat,terms,privacy}` + `components/landing/*`, `components/dashboard` | Landing/marketing pages, chat interfaces, static content. |
| **Domain Components** | `components/{financeiro/{transaction-form,expense-categories,category-quick-form},agenda/{types.ts,appointment-form/use-appointment-form.ts},clientes/{clients-table,clients-filters,edit-client-modal},cliente-ficha/{tab-notas,tab-info,tab-financeiro,tab-contrato,tab-agendamentos,client-header},chat/{message-bubble,chat-window,chat-messages,chat-input,chat-header,chat-bubble-notification},analytics/trends-chart,landing/{pricing,whats-included,meet-carol,how-it-works,faq,announcement-bar},ui}` | Reusable UI: forms/tables/tabs/chat/charts/sections with typed props, hooks, shadcn primitives. |
| **Services** | `lib/services/` (e.g., `webhookService.ts`) + colocated in `components/landing`, `components/agenda/appointment-form` | Business logic encapsulation (e.g., `WebhookService` class for Supabase/webhooks/notifications). |
| **API Routes (Controllers)** | `app/api/{slots,ready,pricing,health,contact,chat/{,status},webhook/n8n,notifications/send,financeiro/categorias/{,[id]},config/public,carol/{query,actions}}` | Typed GET/POST handlers: auth, Zod, services, `{data, error}` JSON. |
| **Types & Utils** | `components/agenda/types.ts`, colocated props (e.g., `use-appointment-form.ts`), `lib/{utils.ts,formatters.ts,supabase/{server.ts,client.ts}}` | Domain types (`ServicoTipo`, `Addon`, etc.), utilities (`cn`, formatters), Supabase clients. |

## Best Practices (Derived from Codebase)
- **Components**: PascalCase functional exports, typed interfaces/props (e.g., `interface TransactionFormProps { data?: any; onSubmit: (data: AppointmentFormData) => void; }`). Use `forwardRef` for inputs. Tailwind: `cn('flex flex-col md:flex-row gap-4 p-6 rounded-lg border bg-card shadow-sm')`. Custom hooks (e.g., `useAppointmentForm`). shadcn: `Button`, `Table`, `Dialog`, `Tabs`.
- **Pages/Layouts**: Default Server Components; async fetches: `const { data } = await supabase.from('clientes').select('*').eq('id', params.id);`. Client: `'use client';` + hooks/SWR. Dynamic params: `{params}: {params: {id: string}}`. Layouts: `<section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">...</section>`.
- **Forms**: `const { register, handleSubmit, formState } = useForm<AppointmentFormData>({ resolver: zodResolver(schema) });`. Formatters: `onChange={formatCurrencyInput}`. Optimistic: `mutate('/api/slots')` on submit.
- **Tables**: TanStack: `const table = useReactTable({ data: clients as Client[], columns });` with pagination/search/filters (debounced state).
- **Charts**: Recharts: `<ResponsiveContainer className="h-80 w-full"><LineChart data={data as TrendData[]}> <XAxis dataKey="date" /> ...</LineChart></ResponsiveContainer>`.
- **Chat**: Props-driven: `<ChatWindow sessionId={sessionId}><ChatMessages messages={[]} /><ChatInput onSend={sendMessage} /></ChatWindow>`. Bubbles: role="img" aria-label for accessibility.
- **Services**: ES6 classes: `export class WebhookService { constructor(private supabase = createClient()) {} async handleWebhook(event: string, payload: any) { ... } }`. Singleton exports: `export const webhookService = new WebhookService();`.
- **API Routes**: `export async POST(request: NextRequest) { const { data: { user } } = await supabase.auth.getUser(); if (!user.data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const payload = schema.parse(await request.json()); const result = await service.method(payload); return NextResponse.json({ data: result }); }`. Zod for all inputs.
- **Auth/Security**: Server: `supabase.auth.getUser()`. Client: providers/session hooks. Row-Level Security (Supabase).
- **Error/Loading/Perf**: `{ data, error }` patterns. `<Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>`. `useMemo`, `dynamic`, table virtualization.
- **A11y/Responsive**: ARIA roles/labels, `focus-visible`, Tailwind: `grid-cols-1 lg:grid-cols-2`, `sm:`, `md:` breakpoints.
- **Conventions**: Kebab-case files/paths, PascalCase components/types, JSDoc comments, no `any`, ESLint/Prettier.

## Key Files and Purposes
| File/Path | Key Symbols/Props | Purpose/Example |
|-----------|-------------------|-----------------|
| `lib/services/webhookService.ts` | `WebhookService` (class) | Core service for webhook handling/orchestration; extend pattern for new services (e.g., `FinanceiroService`, `ClienteService`). |
| `components/agenda/types.ts` | `ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData` | Shared agenda types; import for forms/modals/tables. |
| `components/agenda/appointment-form/use-appointment-form.ts` | `useAppointmentForm` (`UseAppointmentFormProps`) | Form hook with Zod/validation; reuse/extend for scheduling. |
| `components/landing/pricing.tsx` | `PricingItem` | Pricing grids/sections; responsive Tailwind cards. |
| `components/financeiro/{transaction-form.tsx,expense-categories.tsx,category-quick-form.tsx}` | `TransactionFormProps`, `ExpenseCategoryProps`, `CategoryQuickFormProps` | Financial CRUD forms/tables/selectors with formatting. |
| `components/clientes/{clients-table.tsx,clients-filters.tsx,edit-client-modal.tsx}` | `Client`, `ClientsTableProps`, `ClientsFiltersProps`, `EditClientModalProps` (`ServicoTipo`, `Addon`, `DiaServico`) | Paginated/filtered client tables, edit modals. |
| `components/cliente-ficha/{tab-notas.tsx,tab-info.tsx,tab-financeiro.tsx,tab-contrato.tsx,tab-agendamentos.tsx,client-header.tsx}` | `TabNotasProps`, `TabInfoProps`, etc., `ClientHeaderProps` | Client profile tabs; fetch by ID, shadcn Tabs. |
| `components/chat/{message-bubble.tsx,chat-window.tsx,chat-messages.tsx,chat-input.tsx,chat-header.tsx,chat-bubble-notification.tsx}` | `MessageBubbleProps`, `ChatWindowProps`, etc. | Session-based chat UI stack; optimistic sends. |
| `components/analytics/trends-chart.tsx` | `TrendData` | Recharts trends; extend for analytics pages. |
| `app/api/slots/route.ts`, `app/api/chat/route.ts`, `app/api/financeiro/categorias/[id]/route.ts`, `app/api/notifications/send/route.ts` | `GET`/`POST` handlers | Authenticated endpoints; service calls, Zod, JSON responses. |
| `lib/utils.ts`, `lib/supabase/server.ts` | `cn`, `createClient(...)` | Utility classes, server Supabase client. |

## Workflows for Common Tasks

### 1. New Admin Page (e.g., `app/(admin)/admin/configuracoes/addons/page.tsx`)
1. Create `page.tsx` (Server): `export default async function AddonsPage({ params }: { params: Promise<{ } > }) { const supabase = createClient(); const { data: addons } = await supabase.from('addons').select('*'); return <div className="space-y-6 p-6"><PageHeader title="Addons" /><DataTable data={addons} columns={columns} /> <AddonForm /></div>; }`.
2. Add table/form: Reuse `clients-table.tsx` pattern, `useForm` for CRUD.
3. Filters/charts: `<ClientsFilters onFilterChange={setFilters} /> <TrendsChart data={trendData} />`.
4. Dynamic `[id]`: Fetch `supabase.from('addons').eq('id', params.id).single()`.
5. Update sidebar: Add nav link in `components/admin/sidebar.tsx`.
6. Client features: `'use client';` + `useSWR('/api/configuracoes/addons')`.
7. API: `app/api/configuracoes/addons/[id]/route.ts` with service.

### 2. New Component (e.g., `components/analytics/satisfacao-chart.tsx`)
1. Types: `interface SatisfacaoData extends TrendData { score: number; } interface SatisfacaoChartProps { data: SatisfacaoData[]; }`.
2. JSX: `<ResponsiveContainer><BarChart data={data}><Bar dataKey="score" fill="#10b981" /></BarChart></ResponsiveContainer>`.
3. Hook: `useSatisfacaoData(id)` with SWR/mutate.
4. Responsive/A11y: Tailwind responsive, `aria-label="Satisfaction trends"`.
5. Export/use in `app/(admin)/admin/analytics/satisfacao/page.tsx`.

### 3. New Service (e.g., `lib/services/clienteService.ts`)
1. Class: `export class ClienteService { constructor(private supabase = createServerClient()) {} async getById(id: string) { const { data } = await this.supabase.from('clientes').select('*').eq('id', id).single(); return data; } async create(data: Client) { const { data } = await this.supabase.from('clientes').insert(data).select(); webhookService.handle('cliente.created', data); return data; } }`.
2. Export: `export const clienteService = new ClienteService();`.
3. Use: In API/pages/components.

### 4. New API Route (e.g., `app/api/analytics/tendencias/route.ts`)
1. Handlers: `export async GET() { const { data: { user } } = await supabase.auth.getUser(); const trends = await analyticsService.getTrends(); return NextResponse.json({ data: trends }); } export async POST(req) { const payload = tendenciasSchema.parse(await req.json()); const result = await analyticsService.createTrend(payload); return NextResponse.json({ data: result }); }`.
2. Auth/Zod/errors: Always check user, parse, 400/401 responses.

### 5. Full Feature: Form + Table + Modal (e.g., New Receitas Management)
1. Component: `components/financeiro/receitas-table.tsx` (TanStack + filters).
2. Form/Modal: `receitas-form.tsx`/`receitas-modal.tsx` (react-hook-form/Zod).
3. Page: `app/(admin)/admin/financeiro/receitas/page.tsx` integrates all.
4. Service: `financeiroService.createReceita(data)`.
5. API: `app/api/financeiro/receitas/[id]/route.ts`.
6. Optimistic: `mutate` on submit.

### 6. Chat/Agenda Feature
1. Form: Extend `useAppointmentForm`.
2. Chat: `<ChatWindow sessionId={appt.sessionId} />`.
3. Integration: Service call `appointmentService.create()` → webhook → chat notify.

### 7. Deployment Checklist
1. Lint/Type: `npm run lint -- --fix && tsc --noEmit`.
2. Tests: Colocate `*.test.tsx`, `vitest` with `@testing-library/react`, Supabase mocks.
3. Perf: Bundle analyzer, Lighthouse 90+ (mobile).
4. Docs: JSDoc, update domain READMEs.
5. PR: Changelog, screenshots, schema changes (Supabase migrations).
