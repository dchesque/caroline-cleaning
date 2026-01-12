# Feature Developer Agent Playbook

## Mission
The Feature Developer Agent delivers end-to-end feature implementation in a Next.js 15+ app with App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase, and webhook integrations. Focus on greenfield features, UI enhancements, admin dashboards, API extensions, and domain-specific components (e.g., financeiro, clientes, analytics, chat). Ensure adherence to patterns like typed functional components, service encapsulation (`WebhookService`), server-side data fetching, and responsive design.

## Responsibilities
- Implement new pages/layouts in `app/(admin)/admin/`, `app/(public)/`, dynamic routes (e.g., `[id]`, `[sessionId]`).
- Build/extend domain components in `components/[domain]/` (e.g., `financeiro/`, `clientes/`, `analytics/`).
- Create services in `lib/services/` for orchestration (e.g., Supabase CRUD, webhooks).
- Develop API routes in `app/api/` (GET/POST handlers with auth).
- Define types/interfaces colocated or in `types/` for props, payloads, responses.
- Integrate Supabase via `lib/supabase/server.ts`/`client.ts`; handle auth/sessions.
- Use utils for formatting (`lib/utils.ts`, `lib/formatters.ts`), toasts, modals.
- Add charts/tables/forms with Recharts, TanStack Table, react-hook-form + Zod.

## Focus Areas
| Area | Directories/Files | Purpose |
|------|-------------------|---------|
| **Admin UI** | `app/(admin)/admin/*` (e.g., `financeiro/relatorios`, `clientes/[id]`, `analytics/tendencias`) | Protected dashboards with tabs, tables, charts, filters. Dynamic segments for details. |
| **Public UI** | `app/(public)/*` (e.g., `chat`, `terms`, `privacy`) | Landing pages, chat interfaces, static content. |
| **Components** | `components/financeiro/`, `clientes/`, `cliente-ficha/`, `chat/`, `analytics/`, `ui/`, `landing/` | Domain-specific (e.g., `RecentTransactions`, `ClientsTable`, `ChatWindow`, `TrendsChart`); primitives in `ui/`. |
| **Services** | `lib/services/` (e.g., `webhookService.ts`) | Business logic classes (e.g., `WebhookService` for orchestration). |
| **API Routes** | `app/api/*` (e.g., `chat/`, `carol/actions`, `notifications/send`, `webhook/n8n`) | Handlers: Auth checks, Supabase queries, service calls, JSON responses `{data, error}`. |
| **Types** | Colocated in components (e.g., `ClientsTableProps`), `types/` | Props (e.g., `TabInfoProps`), payloads (e.g., `Client`). |
| **Utils** | `lib/utils.ts`, `lib/formatters.ts` | `cn()` for Tailwind, `formatCurrency`, `formatPhoneUS`, validation. |

## Best Practices (Derived from Codebase)
- **Components**: Functional, typed props (e.g., `interface ClientsFiltersProps { filters: FilterState }`), `forwardRef` for inputs/buttons. Default export. Responsive Tailwind (e.g., `grid-cols-1 md:grid-cols-2`). Use `cn()` for conditional classes.
- **Pages**: Server Components for data fetching. Async `page.tsx`: `const supabase = createClient(); const {data} = await supabase.from('table').select();`. Client-side: `'use client';` + hooks (SWR/React Query inferred).
- **Forms**: `react-hook-form` + Zod (schemas inferred from props). Formatters onChange: `formatCurrencyInput(e.target.value)`. Server actions or API submits.
- **Tables/Filters**: TanStack Table patterns (e.g., `clients-table.tsx`: `Client[]`, pagination, search). Filters: Local state + debounced queries.
- **Charts**: Recharts (e.g., `trends-chart.tsx`: `TrendData[]`, responsive containers).
- **Chat**: Session-based (e.g., `chat-messages.tsx`, `chat-input.tsx`); optimistic UI, streaming.
- **Auth/Security**: Server: `supabase.auth.getUser()`. Client: Middleware or hooks. Validate payloads (e.g., `zod.parse()`).
- **Error Handling**: `{ data?, error? }` responses. Client: `<ErrorBoundary>`, toasts. Server: 400/401/500 status.
- **Performance**: `Suspense` boundaries, `dynamic` imports for heavy components/charts. `useMemo` for data transforms.
- **Accessibility**: `aria-label`, `role`, keyboard focus (shadcn primitives).
- **Testing**: Vitest/RTL colocated (e.g., `*.test.tsx`); mock Supabase, test props/render.
- **Conventions**: PascalCase exports, kebab-case files. No `any`; strict TS.

## Key Files and Purposes
| File/Path | Key Symbols/Props | Purpose/Example |
|-----------|-------------------|-----------------|
| `lib/services/webhookService.ts` | `WebhookService` | Class for webhook orchestration; template for new services (e.g., `ClientService`). |
| `components/landing/pricing.tsx` | `PricingItem` | Dynamic pricing tables; responsive grids. |
| `components/financeiro/transaction-form.tsx` | `TransactionFormProps` | Form with validation/formatting; Zod + react-hook-form. |
| `components/financeiro/expense-categories.tsx`/`recent-transactions.tsx` | `ExpenseCategoryProps` | Category selectors, transaction lists/tables. |
| `components/clientes/clients-table.tsx`/`clients-filters.tsx` | `Client`, `ClientsTableProps`, `ClientsFiltersProps` | Paginated tables, filters/search. |
| `components/cliente-ficha/*` (e.g., `tab-info.tsx`, `tab-financeiro.tsx`) | `TabInfoProps`, `TabFinanceiroProps`, etc. | Multi-tab client profiles; fetch by ID. |
| `components/chat/*` (e.g., `chat-window.tsx`, `message-bubble.tsx`) | `ChatWindowProps`, `MessageBubbleProps` | Full chat UI; input, messages, notifications. |
| `components/analytics/*` (e.g., `trends-chart.tsx`, `top-metrics.tsx`) | `TrendsChartProps`, `Metric`, `KPICardProps` | Recharts trends, KPIs, funnels. |
| `app/api/chat/route.ts` | `POST` | Chat message handling; Supabase insert + webhook. |
| `app/api/carol/query/route.ts` | `GET/POST` | AI query endpoints; service integration. |
| `lib/utils.ts`/`lib/formatters.ts` | `cn`, `formatCurrency`, `formatPhoneUS` | Styling, input helpers. |
| `lib/supabase/server.ts` | `createClient` | Server Supabase client. |

## Workflows for Common Tasks

### 1. New Admin Page (e.g., `app/(admin)/admin/equipe/membros/page.tsx`)
1. Create `page.tsx`: `'use server';` or Server Component.
2. Fetch data: `import { createClient } from 'lib/supabase/server'; const { data: membros } = await supabase.from('equipe').select('*');`.
3. Layout: `<div className={cn('space-y-4')}> <ClientsFilters /> <ClientsTable data={membros} /> </div>`.
4. Add types: Colocate `interface MembrosPageProps { membros: Membro[] }`.
5. Navigation: Update sidebar in `components/admin/sidebar.tsx`.
6. Client features: `'use client'; useSWR('/api/equipe');`.
7. Test: Render page, query mocks.

### 2. New Domain Component (e.g., `components/analytics/client-retention.tsx`)
1. Create `.tsx` in domain dir.
2. Props: `interface ClientRetentionProps { data: RetentionData[] }`.
3. Implement: `<ResponsiveContainer> <LineChart data={data}> ... </LineChart> </ResponsiveContainer>`.
4. Styling: `cn('w-full h-64 bg-card')`.
5. Export: `export const ClientRetention = ({ data }: ClientRetentionProps) => ...`.
6. Usage: Import in page, `<ClientRetention data={fetchedData} />`.
7. Test: `render(<ClientRetention data={mockData} />); expect(screen.getByText('Retention')).toBeInTheDocument();`.

### 3. New Service (e.g., `lib/services/clientService.ts`)
1. `export class ClientService { constructor(private supabase = createClient()) {} async createClient(data: CreateClientPayload) { /* validate, insert, webhook */ } }`.
2. Use utils: `formatters.formatPhoneUS(phone)`.
3. Singleton: `export const clientService = new ClientService();`.
4. Integrate: In API/page: `await clientService.createClient(payload);`.

### 4. New API Route (e.g., `app/api/equipe/route.ts`)
1. `import { NextRequest } from 'next/server'; export async function POST(req: NextRequest) { const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const payload = await req.json(); const result = await clientService.handle(payload); return NextResponse.json(result); }`.
2. Types: Reference colocated or `types/equipe.ts`.

### 5. Form + Mutation Feature (e.g., New Expense Form)
1. Component: `const { register, handleSubmit } = useForm<ExpenseFormData>();`.
2. Submit: `onSubmit={async (data) => { const res = await fetch('/api/financeiro/expenses', { method: 'POST', body: JSON.stringify(data) }); toast(res.ok ? 'Success' : 'Error'); }}`.
3. Validation: Zod schema, `formatCurrencyInput`.

### 6. Webhook/Notification Integration
1. Import `WebhookService`.
2. Trigger: `await webhookService.handle('client.created', { id, data });` or `/api/notifications/send`.
3. Payloads: Match existing (e.g., `LeadCreatedPayload` patterns).

### 7. Full Feature Checklist
1. Lint: `npm run lint -- --fix`.
2. Type-check: `tsc --noEmit`.
3. Test coverage: `vitest`.
4. Docs: Update `docs/architecture.md`.
5. PR: Changelog, screenshots.

## Key Symbols Reference
- **Props**: `ClientsFiltersProps`, `ChatWindowProps`, `TrendsChartProps`, `TransactionFormProps`.
- **Data**: `Client`, `TrendData`, `Metric`, `MessageBubbleProps`.
- **Services**: `WebhookService`.
- **Utils**: `cn`, formatters (currency, phone, date).

## Hand-off Notes
- PR-ready code with tests, types, docs.
- Risks: Supabase schema changes (run migrations), large data perf (virtualize tables), mobile (test Tailwind breakpoints).
