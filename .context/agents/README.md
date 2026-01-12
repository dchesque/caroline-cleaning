# Feature Developer Playbook

This playbook equips the **Feature Developer Agent** to implement new features in the Carolinas Premium repository—a Next.js 14+ app (App Router) using TypeScript (.ts/.tsx), React, Tailwind CSS, shadcn/ui, and integrations like N8N webhooks, Carol AI, and Prisma/DB. The app powers admin dashboards for clients, finance, chat, analytics, agenda, contracts, and public landing pages.

**Primary Focus Areas**:
- **Components** (118 .tsx files): Domain-specific UI (e.g., `components/cliente-ficha/`, `components/analytics/`).
- **API Routes** (`app/api/`): 40+ endpoints for CRUD, webhooks, chat, notifications.
- **Services** (`lib/services/`): Business logic (e.g., `WebhookService`).
- **Pages/Layouts** (`app/(admin)/`, `app/(public)/`): Nested routes with suspense/loading.tsx.
- **Key Patterns**: Type-safe props/interfaces, Zod validation, TanStack Query/SWR for data, react-hook-form for forms.

New features must be modular, responsive (Tailwind breakpoints: sm/md/lg), accessible (ARIA), dark-mode ready, and integrate with existing symbols like `Client`, `ChatWindowProps`, `TrendsChartProps`.

## Key Files and Purposes

### Components (Core UI Library)
Organized by domain. Create new ones here for reusability.

| Directory/Path | Purpose | Key Files/Symbols | Usage Notes |
|----------------|---------|-------------------|-------------|
| `components/landing/` | Public marketing/hero sections | `pricing.tsx` (`PricingItem`), `whats-included.tsx` (`WhatsIncluded`), `meet-carol.tsx` (`MeetCarol`), `how-it-works.tsx` (`HowItWorks`), `faq.tsx` (`FAQ`), `announcement-bar.tsx` (`AnnouncementBar`), `about-us.tsx` (`AboutUs`) | Landing pages (`app/(public)/`), pricing tables, FAQs |
| `components/financeiro/` | Transactions/expenses | `recent-transactions.tsx` (`RecentTransactions`), `transaction-form.tsx` (`TransactionFormProps`), `expense-categories.tsx` (`ExpenseCategoryProps`) | Forms, lists in `app/(admin)/admin/financeiro/` |
| `components/clientes/` | Client lists/filters | `clients-table.tsx` (`Client`, `ClientsTableProps`), `clients-filters.tsx` (`ClientsFiltersProps`) | Searchable tables with filters |
| `components/cliente-ficha/` | Client profile tabs | `tab-notas.tsx` (`TabNotasProps`), `tab-info.tsx` (`TabInfoProps`), `tab-financeiro.tsx` (`TabFinanceiroProps`), `tab-contrato.tsx` (`TabContratoProps`), `tab-agendamentos.tsx` (`TabAgendamentosProps`), `client-header.tsx` (`ClientHeaderProps`) | Dynamic `[id]` routes (`app/(admin)/admin/clientes/[id]`) |
| `components/chat/` | Real-time chat UI | `chat-window.tsx` (`ChatWindowProps`), `chat-messages.tsx` (`ChatMessagesProps`), `chat-input.tsx` (`ChatInputProps`), `message-bubble.tsx` (`MessageBubbleProps`), `chat-header.tsx` (`ChatHeaderProps`), `chat-bubble-notification.tsx` (`ChatBubbleNotificationProps`) | Integrate with `/api/chat/` |
| `components/analytics/` | Charts/metrics | `trends-chart.tsx` (`TrendData`, `TrendsChartProps`), `top-metrics.tsx` (`Metric`), `satisfaction-chart.tsx` (`SatisfactionData`, `SatisfactionChartProps`), `conversion-funnel.tsx` (`FunnelStep`, `ConversionFunnelProps`), `recent-activity.tsx` (`Activity`), `period-selector.tsx` (`PeriodSelectorProps`), `overview-chart.tsx` (`ChartData`), `kpi-card.tsx` (`KPICardProps`) | Recharts-based, `app/(admin)/admin/analytics/*` subroutes |
| `components/dashboard/` | Quick actions/KPIs | `quick-actions.tsx` (`QuickActions`) | Dashboards/homepages |
| `components/ui/` | shadcn primitives | Button, Input, Dialog, Table, etc. | Base for all forms/tables/modals |

### API Routes (`app/api/`)
Handle requests with Zod + services/DB.

| Path | Purpose | Key Handlers/Symbols |
|------|---------|----------------------|
| `app/api/slots/` | Scheduling availability | `GET` |
| `app/api/chat/` & `chat/status/` | Messaging/status | `POST` (`chat/route.ts`), `GET` (`status/route.ts`) |
| `app/api/notifications/send/` | Push alerts | `POST` |
| `app/api/webhook/n8n/` | N8N orchestration | `POST` (uses `WebhookService`) |
| `app/api/carol/{query,actions}/` | AI (Carol) queries/actions | `GET/POST` |
| `app/api/pricing/`, `/contact/`, `/health/`, `/ready/`, `/config/public/` | Public/meta endpoints | Various `GET/POST` |

### Services
| File | Purpose | Key Symbols |
|------|---------|-------------|
| `lib/services/webhookService.ts` | Webhook processing/N8N | `WebhookService` (class at line 35) |

### Pages/Layouts (`app/`)
- **Admin**: `app/(admin)/admin/{clientes/[id], financeiro/{relatorios,receitas,despesas}, contratos/[id|novo], analytics/{tendencias,satisfacao,...}, configuracoes/{servicos,areas,addons,pricing}, ...}`
- **Public**: `app/(public)/{chat,terms,privacy}`
- **Auth**: `app/(auth)/login`
- **Pattern**: Parallel routes, `loading.tsx`, dynamic `[id]` segments.

## Code Patterns & Conventions (Derived from 247 Symbols, 156 Files)
- **Components**: Functional + typed props interface. <300 LOC. Tailwind + `cn()` helper.
  ```tsx
  interface TrendsChartProps { data: TrendData[]; }
  export function TrendsChart({ data }: TrendsChartProps) {
    return <Chart data={data} className="w-full h-64" />;
  }
  ```
- **API**: `NextRequest/Response`, Zod parsing, async/await.
  ```ts
  import { z } from 'zod';
  const schema = z.object({ id: z.string() });
  export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const data = schema.parse({ id: searchParams.get('id') });
    return Response.json(await fetchClients(data));
  }
  ```
- **Data**: TanStack Query (`useQuery/useMutation`), optimistic updates, `Suspense`.
- **Forms**: `react-hook-form` + `zodResolver`, shadcn Form.
- **Charts**: Recharts (inferred from `trends-chart.tsx`).
- **State**: Local `useState`; global via Zustand/Context.
- **Exports**: Named for components/services; barrel `index.ts`.
- **Types**: Inline interfaces (e.g., `Client`, `MessageBubbleProps`). Strict TS.
- **Styling**: `className` with Tailwind (e.g., `md:grid-cols-2 dark:bg-slate-900`).
- **No Tests**: Implement vitest if adding (match future patterns).
- **Utils**: `lib/utils.ts` (cn, toast via Sonner).

## Workflows for Common Tasks

### 1. **New UI Component (e.g., New Analytics Widget)**
   1. Choose domain dir (e.g., `components/analytics/new-funnel.tsx`).
   2. Define props: `interface NewFunnelProps { steps: FunnelStep[]; }`.
   3. Build with shadcn (Card, Chart), add loading/error: `<Skeleton />` or `isLoading ? ...`.
   4. Responsive Tailwind: `grid grid-cols-1 md:grid-cols-2`.
   5. Export named, add to barrel `index.ts`.
   6. Import into page (e.g., `app/(admin)/admin/analytics/page.tsx`).

### 2. **New API Endpoint (e.g., `/api/clients/[id]/notes`)**
   1. Create `app/api/clients/[id]/notes/route.ts`.
   2. Zod schema: `z.object({ note: z.string().min(1) })`.
   3. Auth check (middleware or headers).
   4. DB/service: `prisma.client.update({ where: { id }, data: { notes: { push: input.note } } })`.
   5. Use service if complex: `new WebhookService().notifyUpdate(id)`.
   6. `return Response.json({ success: true }, { status: 201 })`.

### 3. **Tabbed Client Feature (e.g., New Tab in Ficha)**
   1. Copy pattern: `components/cliente-ficha/tab-new.tsx` from `tab-financeiro.tsx`.
   2. Props: `interface TabNewProps { clientId: string; data: NewData[]; }`.
   3. Fetch: `useQuery({ queryKey: ['client', clientId, 'new'], queryFn: () => fetch(`/api/clients/${clientId}/new`) })`.
   4. Add to `page.tsx` tabs: `<TabsContent value="new"><TabNew {...props} /></TabsContent>`.
   5. Update tabs list: `defaultValue="info"` → include `"new"`.

### 4. **Full Feature (e.g., New Finance Report)**
   1. **Spec**: Components (table/chart/filter), API (`/api/finance/reports`), service if needed.
   2. **Backend**: API route → DB query → Zod response type.
   3. **Frontend**: Component (`components/financeiro/report-table.tsx`) → Page (`app/(admin)/admin/financeiro/relatorios/novo/page.tsx`).
   4. **Integration**: `useQuery` in page/component; mutations for CRUD.
   5. **Enhance**: Toasts (`toast.success`), empty states (`<EmptyState />`), ARIA labels.
   6. **Test**: `npm run dev`, check mobile/devtools, edge cases (no data, errors).

### 5. **Chat/Notification Integration**
   1. In `chat-input.tsx`, add `useMutation({ mutationFn: (msg) => post('/api/chat', msg) })`.
   2. On success: `post('/api/notifications/send', { type: 'message', clientId })`.
   3. Update `WebhookService` for N8N if external sync needed.
   4. Optimistic: `onMutate: () => prepend message locally`.

### 6. **Public Landing Feature (e.g., New Pricing Tier)**
   1. Extend `components/landing/pricing.tsx`: Add `PricingItem` variant.
   2. Fetch dynamic: Server Component `async function PricingPage() { const tiers = await getTiers(); }`.
   3. Add route if needed: `app/(public)/pricing/page.tsx`.

## Best Practices from Codebase
- **Modularity**: Compose small components (reuse `KpiCard`, `ClientsFilters`).
- **Performance**: Server Components first, `Suspense` boundaries, virtualized lists (TanStack Table).
- **Error Handling**: `try/catch` → `toast.error(err.message)`, global `error.tsx`.
- **Accessibility**: `aria-label={label}`, `role="tablist"`, keyboard focus.
- **Security**: Server-side auth/validation, no API keys client-side.
- **Mobile-First**: Tailwind `sm:`, test on devtools.
- **Commits**: `feat(finance): add expense report table`.
- **Lint/Format**: ESLint/Prettier; `npm run lint` before push.

## Quick Reference Checklist
- [ ] Typed props/interfaces?
- [ ] shadcn/Tailwind patterns matched?
- [ ] Query/mutation with loading/error?
- [ ] Zod for API/forms?
- [ ] Reuses key symbols/files?
- [ ] Responsive/dark mode/accessible?
- [ ] Integrates services/APIs?

Use this for production-ready features. Update playbook with new patterns. For complex changes, consult Code Reviewer.
