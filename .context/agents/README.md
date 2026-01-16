# Feature Developer Playbook

This playbook guides the **Feature Developer Agent** in implementing new features for the Caroline Cleaning app—a Next.js 14+ App Router application using TypeScript (.ts/.tsx), React, Tailwind CSS, shadcn/ui components, Prisma database, TanStack Query, react-hook-form with Zod validation, Recharts for charts, and integrations like N8N webhooks (`WebhookService`), Carol AI APIs (`/api/carol/{query,actions}`), and notifications. The codebase spans ~183 files: primarily UI components (137 .tsx in `components/` domains), API routes (44 .ts in `app/api/`), services (`lib/services/`), and nested pages (`app/(admin)/admin/*`, `app/(public)/`, `app/(auth)/`). 

**Core Focus Areas**:
- **Admin Dashboard** (`app/(admin)/admin/*`): Clients (`clientes/[id]` with tabs), finance (`financeiro/{relatorios,receitas,categorias,despesas}`), agenda, analytics (`analytics/{tendencias,satisfacao,receita,conversao,clientes,carol}`), chat (`mensagens/[sessionId]`), configs (`configuracoes/{servicos,equipe,pricing,areas,addons,empresa}`), contracts (`contratos/{[id],novo}`).
- **Public Landing** (`app/(public)/{landing,chat,terms,privacy}`): Marketing, pricing, contact forms.
- **Components** (152 symbols): Domain-specific (`components/{agenda,financeiro,clientes,cliente-ficha,chat,analytics,tracking,landing,ui,admin}`); reusable, typed props, <300 LOC/file.
- **API Routes/Controllers** (50+ symbols): `app/api/{slots,profile,pricing,chat,webhook/n8n,tracking/{event,config},financeiro/categorias/[id],carol/{query,actions},notifications/send,...}`; Zod schemas, Prisma queries.
- **Services** (business logic): `lib/services/webhookService.ts` (`WebhookService` class for orchestration, N8N processing).
- **Types & Hooks**: `components/agenda/types.ts` (`ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData`); hooks like `useAppointmentForm`.

New features must be **type-safe**, **responsive** (Tailwind `sm: md: lg:` breakpoints), **dark-mode ready** (`dark:` classes), **accessible** (ARIA labels, keyboard nav), **optimistic** (TanStack Query mutations), integrate **webhooks/notifications**, and follow Server Components patterns with `Suspense`/`loading.tsx`/`error.tsx`.

## Key Files and Purposes

### Components (UI Primitives, Forms, Tables, Tabs, Charts, Chat)
Domain-grouped, composable with shadcn/ui (`components/ui/{Button,Input,Table,Tabs,Form,Skeleton,Dialog,...}`). Use `cn()` from `lib/utils.ts` for Tailwind merging.

| Domain/Path | Purpose | Key Files/Symbols | Usage/Integrations |
|-------------|---------|-------------------|--------------------|
| `components/agenda/` | Appointment scheduling/forms | `types.ts` (`ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData`); `appointment-form/use-appointment-form.ts` (`useAppointmentForm`) | Forms in admin/agenda, `cliente-ficha/tab-agendamentos.tsx`; react-hook-form + Zod |
| `components/landing/` | Public marketing | `pricing.tsx` (`PricingItem`); `whats-included.tsx` (`WhatsIncluded`); `trust-badges.tsx` (`TrustBadges`); `meet-carol.tsx` (`MeetCarol`); `how-it-works.tsx` (`HowItWorks`); `faq.tsx` (`FAQ`) | `app/(public)/` pages; dynamic pricing data |
| `components/financeiro/` | Transactions/expenses/categories | `transaction-form.tsx` (`TransactionFormProps`); `expense-categories.tsx` (`ExpenseCategoryProps`); `category-quick-form.tsx` (`CategoryQuickFormProps`) | Modals/tables in `app/(admin)/admin/financeiro/*`; CRUD APIs |
| `components/clientes/` | Client lists/filters | `clients-table.tsx` (`Client`, `ClientsTableProps`); `clients-filters.tsx` (`ClientsFiltersProps`) | `app/(admin)/admin/clientes`; TanStack Table, filters |
| `components/cliente-ficha/` | Client profile tabs | `tab-notas.tsx` (`TabNotasProps`); `tab-info.tsx` (`TabInfoProps`); `tab-financeiro.tsx` (`TabFinanceiroProps`); `tab-contrato.tsx` (`TabContratoProps`); `tab-agendamentos.tsx` (`TabAgendamentosProps`); `client-header.tsx` (`ClientHeaderProps`) | `app/(admin)/admin/clientes/[id]/page.tsx`; parallel queries |
| `components/chat/` | Real-time messaging | `message-bubble.tsx` (`MessageBubbleProps`); `chat-window.tsx` (`ChatWindowProps`); `chat-messages.tsx` (`ChatMessagesProps`); `chat-input.tsx` (`ChatInputProps`); `chat-header.tsx` (`ChatHeaderProps`); `chat-bubble-notification.tsx` (`ChatBubbleNotificationProps`) | `app/(public)/chat`, `app/(admin)/admin/mensagens/[sessionId]`; `/api/chat/` optimistic updates |
| `components/analytics/` | Metrics/charts | `trends-chart.tsx` (`TrendData`, `TrendsChartProps`); `top-metrics.tsx` (`Metric`) | Recharts in `app/(admin)/admin/analytics/*`; date-range filters |
| `components/tracking/` | Event tracking | `tracking-provider.tsx` (`TrackingProviderProps`, `Window` extension) | Wrap app; `/api/tracking/{event,config}` |
| `components/ui/` | shadcn primitives | Button, Input, etc. | All components; responsive/dark variants |

### API Routes (Controllers: `app/api/`)
Zod-parsed `NextRequest`, Prisma/services, error Responses (400/404).

| Path | Methods/Key Symbols | Purpose | Integrations |
|------|---------------------|---------|--------------|
| `slots/` | `GET` | Availability slots | Agenda services |
| `profile/` | `GET`, `PUT` | User profile/password | Auth + updates |
| `pricing/` | `GET` | Public pricing tiers | Landing pages |
| `chat/` & `chat/status/` | `POST`, `GET` | Send/status messages | Optimistic UI |
| `webhook/n8n/` | `POST` | N8N workflow triggers | `WebhookService.process()` |
| `tracking/{event,config}/` | `POST`, `GET` | Analytics events/config | `TrackingProvider` |
| `financeiro/categorias/[id]/` | `GET`, `POST`, etc. | CRUD categories/expenses | Finance tables/forms |
| `carol/{query,actions}/` | `GET`, `POST` | AI queries/actions | Chat/agenda smarts |
| `notifications/send/` | `POST` | Push alerts | Post-CRUD hooks |

### Services (lib/services/)
Encapsulates orchestration (85% pattern match).

| File | Purpose | Key Symbols |
|------|---------|-------------|
| `lib/services/webhookService.ts` | Webhook/N8N processing, notifications | `WebhookService` class (line 35: `process()`, notify on events) |

### Pages/Layouts (`app/`)
Nested routes with RSC, dynamic `[id]`, `Suspense` boundaries.

- **Admin**: Deeply nested (`admin/financeiro/relatorios`, `configuracoes/webhooks`, `analytics/tendencias`).
- **Public/Auth**: Simpler (`(public)/chat`, `(auth)/login`).
- Patterns: `loading.tsx`, `error.tsx`, Server fetches.

## Code Patterns & Conventions
- **Components**:
  ```tsx
  'use client';
  import { cn } from '@/lib/utils';
  import { Button } from '@/components/ui/button';
  import { AppointmentFormData } from '@/components/agenda/types';

  interface Props { data?: AppointmentFormData; onSubmit: (data: AppointmentFormData) => Promise<void>; loading?: boolean; }
  export function AppointmentForm({ data, onSubmit, loading }: Props) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-4 p-6 dark:bg-slate-900')}>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? <Skeleton /> : 'Agendar'}
        </Button>
      </form>
    );
  }
  ```
- **Hooks**: `useQuery(['client', id], () => fetch('/api/clients/' + id).then(r => r.json()))`; `useMutation({ mutationFn: postData, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', id] }) })`.
- **API Routes**:
  ```ts
  import { NextRequest } from 'next/server';
  import { z } from 'zod';
  import { WebhookService } from '@/lib/services/webhookService';
  import { prisma } from '@/lib/prisma';

  const schema = z.object({ id: z.string().uuid() });
  export async function POST(req: NextRequest) {
    try {
      const { id } = schema.parse(await req.json());
      const client = await prisma.client.findUnique({ where: { id } });
      if (!client) return Response.json({ error: 'Client not found' }, { status: 404 });
      await new WebhookService().process(id);
      return Response.json({ success: true });
    } catch (error) {
      return Response.json({ error: (error as Error).message }, { status: 400 });
    }
  }
  ```
- **Forms**: `const form = useForm<AppointmentFormData>({ resolver: zodResolver(AppointmentSchema) });`.
- **Types**: Exported interfaces/enums; `type SafeData = z.infer<typeof schema>;`.
- **Utils**: `lib/utils.ts` (cn, toasts via Sonner); no tests detected (add Vitest if needed).

## Workflows for Common Tasks

### 1. New Reusable Component (e.g., `components/financeiro/addon-tracker.tsx`)
1. Create file in domain: `components/financeiro/addon-tracker.tsx`.
2. Define props: `interface AddonTrackerProps { clientId: string; addons: Addon[]; }`.
3. Build UI: Use shadcn `<Table>`, `<Card>`, Recharts if trends; responsive grid (`grid-cols-1 md:grid-cols-2`).
4. Add states/loading: `<Skeleton className="h-32 w-full" />`; `useTransition` for submits.
5. Hook integration: `const { data } = useQuery(['addons', clientId], () => fetch(`/api/clients/${clientId}/addons`));`.
6. Export in barrel: Add to `components/financeiro/index.ts`.
7. Integrate: Use in `cliente-ficha/tab-financeiro.tsx` or admin pages.

### 2. New API Endpoint (e.g., `/api/financeiro/addons/[clientId]`)
1. Create `app/api/financeiro/addons/[clientId]/route.ts`.
2. Parse params/body: `const { clientId } = z.object({ clientId: z.string().uuid() }).parse(params);`.
3. Business logic: Prisma query + `new WebhookService().process(clientId);`.
4. Handle errors: 404 if not found, Zod validation, JSON responses.
5. Test via curl/Postman: Integrate with TanStack Query in components.

### 3. Extend Client Ficha Tab (e.g., New `tab-trackings.tsx`)
1. Copy pattern: `components/cliente-ficha/tab-trackings.tsx` (`interface TabTrackingsProps { clientId: string; }`).
2. Fetch data: `useQuery(['tracking', clientId], () => get(`/api/tracking/config?clientId=${clientId}`));`.
3. UI: `<ClientsTable data={data?.events || []} />` + charts.
4. Update page: `app/(admin)/admin/clientes/[id]/page.tsx` → Add `<TabsContent value="trackings"><TabTrackings clientId={id} /></TabsContent>` and tab nav.
5. Optimistic + invalidate: Mutations refetch tabs/parent queries; toast success.

### 4. Full Feature: Finance Addon Analytics (e.g., Track Expenses by Addon)
1. **Components**: `components/financeiro/addon-expenses.tsx` (table + `TrendsChartProps`).
2. **API**: `app/api/financeiro/addons/route.ts` (GET list, POST create; Zod + Prisma `transaction.create({ data: { addonId, clientId } })`).
3. **Service**: Extend `WebhookService` or call `process('finance-addon-update', { addonId })`.
4. **Page**: `app/(admin)/admin/financeiro/addons/page.tsx` (Server: `const addons = await prisma...`; `<Suspense><AddonExpenses /></Suspense>`).
5. **Analytics Integration**: Add widget to `app/(admin)/admin/analytics/receita/page.tsx`.
6. **Polish**: Filters (`clients-filters.tsx` pattern), empty state, mobile scroll (`overflow-x-auto`), notifications on create.

### 5. Chat Enhancement (e.g., Schedule Button in Chat Input)
1. Extend `chat-input.tsx`: Add `<Button onClick={() => setShowForm(true)}>Agendar</Button>`.
2. Form: `<AppointmentForm onSubmit={async (data) => { await mutation.mutateAsync({ sessionId, data }); }} />`.
3. Mutation: `useMutation({ mutationFn: (payload) => post('/api/chat/schedule', payload), onSuccess: queryClient.invalidateQueries(['chat', sessionId]) })`.
4. Webhook: Trigger `WebhookService.process('schedule-via-chat', data.clientId)`.
5. UI: Optimistic message prepend; ARIA for form.

### 6. Public Feature (e.g., Tracking Opt-In on Landing)
1. Component: `components/landing/tracking-optin.tsx` (`TrustBadges` style).
2. Page update: `app/(public)/page.tsx` → Insert `<TrackingOptIn onToggle={toggleTracking} />`.
3. API: POST `/api/tracking/config` (update user prefs).
4. Provider: Ensure `TrackingProvider` wraps layout.

### 7. Analytics Widget (e.g., Client Satisfaction Trends)
1. `components/analytics/satisfaction-trends.tsx` (`TrendData[]`).
2. Query: `useQuery(['analytics', 'satisfacao', { period: '30d' }], () => get('/api/analytics/satisfacao'));`.
3. Integrate: `app/(admin)/admin/analytics/satisfacao/page.tsx` → Grid + filters.
4. Export data: Button → CSV via `json2csv`.

## Best Practices from Codebase
- **Modularity**: Small files, barrel exports (`index.ts`), compose (e.g., `category-quick-form` in tables).
- **Performance**: Server Components/pages, `Suspense` + skeletons, TanStack virtualized tables, `useTransition` for forms.
- **UX**: Optimistic updates, infinite scroll (chat/clients), toasts (`toast.success('Salvo!')`), empty states ("Nenhum cliente"), error boundaries.
- **Accessibility**: `aria-label`, `role="tablist"`, `onKeyDown={(e) => e.key === 'Enter' && submit()}`, focus traps in modals.
- **Security**: Zod everywhere, server auth (middleware), no client Prisma.
- **Styling**: `cn('base dark:dark-variant hover:bg-slate-100 data-[state=open]:animate-in')`; mobile-first.
- **Integrations**: Trigger `WebhookService` on CRUD (clients/finance/agenda); `/api/notifications/send` for alerts; Carol AI for dynamic content.
- **Commits/PRs**: `feat(clientes): add tracking tab + API + webhook integration`.
- **Dev Tools**: `npm run dev`; ESLint/Prettier; use `readFile('components/agenda/types.ts')` for types.

## Quick Reference Checklist
- [ ] Files in domain (`components/financeiro/`, `app/api/financeiro/`, `app/(admin)/admin/financeiro/addons`)?
- [ ] Typed props/hooks (extend `Addon`, `AppointmentFormData`; Zod schemas)?
- [ ] shadcn/Tailwind/Recharts/TanStack Query patterns matched?
- [ ] Mutations optimistic + invalidate parent queries + error toasts?
- [ ] Responsive/dark/accessible (breakpoints, ARIA, keyboard)?
- [ ] Loading/skeletons/empty/error states?
- [ ] WebhookService + notifications for events?
- [ ] Page integration (dynamic routes, tabs, Suspense)?
- [ ] Mobile-optimized (overflow, grid-cols)?
- [ ] Tested in context (e.g., client tab)?
