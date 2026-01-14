# Feature Developer Playbook

This playbook equips the **Feature Developer Agent** to implement new features in the Carolinas Premium repository—a Next.js 14+ App Router app with TypeScript (.ts/.tsx), React, Tailwind CSS, shadcn/ui, Prisma/DB, TanStack Query, react-hook-form + Zod, Recharts, and integrations (N8N via `WebhookService`, Carol AI APIs `/api/carol/{query,actions}`, notifications). 183 files: 137 .tsx (UI/components), 44 .ts (API/services), 2 .mjs. Focus: Admin dashboard (`app/(admin)/admin/*`), client management, finance, agenda, analytics, chat; public landing (`app/(public)/`), auth.

**Primary Focus Areas**:
- **Components** (139 symbols): Domain-grouped in `components/{agenda,financeiro,clientes,cliente-ficha,chat,analytics,landing,ui}`; reusable, typed, <300 LOC.
- **API Routes** (44 symbols): `app/api/{slots,pricing,chat,webhook/n8n,financeiro/categorias,notifications/send,carol/{query,actions},...}`; Zod-validated handlers.
- **Services**: `lib/services/` (e.g., `WebhookService` class for orchestration).
- **Pages**: Nested dynamic routes (`[id]`, subdirs like `financeiro/{relatorios,receitas,despesas,categorias}`), `loading.tsx`/`error.tsx`, Server Components.
- **Types**: `components/agenda/types.ts` (`ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData`); reuse across domains.

Features must be type-safe, responsive (`sm:md:lg:`), dark-mode (`dark:`), accessible (ARIA/keyboard), optimistic (TanStack Query), and integrate services/webhooks.

## Key Files and Purposes

### Components (UI: Forms, Tables, Tabs, Charts, Chat)
Reusable primitives composing pages; shadcn/ui base (`components/ui/{Button,Input,Dialog,Table,Tabs,Form,Skeleton,etc}`).

| Domain/Path | Purpose | Key Files/Symbols | Integration Notes |
|-------------|---------|-------------------|-------------------|
| `components/agenda/` | Scheduling/forms | `types.ts` (`ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData`); `appointment-form/use-appointment-form.ts` (`useAppointmentForm`) | Forms w/ services/addons; use in admin/agenda, client tabs (`tab-agendamentos.tsx`) |
| `components/landing/` | Marketing/public | `pricing.tsx` (`PricingItem`); `whats-included.tsx` (`WhatsIncluded`); `meet-carol.tsx` (`MeetCarol`); `how-it-works.tsx` (`HowItWorks`); `faq.tsx` (`FAQ`); `announcement-bar.tsx` (`AnnouncementBar`) | Hero/pricing in `app/(public)/`; dynamic data fetch |
| `components/financeiro/` | Expenses/transactions/categories | `transaction-form.tsx` (`TransactionFormProps`); `expense-categories.tsx` (`ExpenseCategoryProps`); `category-quick-form.tsx` (`CategoryQuickFormProps`) | Modals/tables; `app/(admin)/admin/financeiro/{relatorios,receitas,despesas,categorias}` + `[id]` |
| `components/clientes/` | Client CRUD/listing | `edit-client-modal.tsx` (`EditClientModalProps`; uses `ServicoTipo`/`Addon`/`DiaServico`); `clients-table.tsx` (`Client`, `ClientsTableProps`); `clients-filters.tsx` (`ClientsFiltersProps`) | Tables/filters/modals; `app/(admin)/admin/clientes/[id]` |
| `components/cliente-ficha/` | Client profile (tabbed) | `tab-notas.tsx` (`TabNotasProps`); `tab-info.tsx` (`TabInfoProps`); `tab-financeiro.tsx` (`TabFinanceiroProps`); `tab-contrato.tsx` (`TabContratoProps`); `tab-agendamentos.tsx` (`TabAgendamentosProps`); `client-header.tsx` (`ClientHeaderProps`) | Tabs for `[id]` pages; parallel data fetches |
| `components/chat/` | Messaging UI | `message-bubble.tsx` (`MessageBubbleProps`); `chat-window.tsx` (`ChatWindowProps`); `chat-messages.tsx` (`ChatMessagesProps`); `chat-input.tsx` (`ChatInputProps`); `chat-header.tsx` (`ChatHeaderProps`); `chat-bubble-notification.tsx` (`ChatBubbleNotificationProps`) | `/api/chat/` + status; `app/(public)/chat`, `app/(admin)/admin/mensagens/[sessionId]` |
| `components/analytics/` | Dashboards/charts | `trends-chart.tsx` (`TrendData`); satisfaction, funnel, etc. | Recharts; `app/(admin)/admin/analytics/{tendencias,satisfacao,receita,conversao,clientes,carol}` |
| `components/ui/` | Primitives | `cn()` utility from `lib/utils.ts` | Tailwind merge; all components |

### API Routes (`app/api/`: 44 handlers)
Zod schemas, Prisma/services, `NextRequest/Response`.

| Path | Method/Symbols | Purpose | Notes |
|------|----------------|---------|-------|
| `slots/` | `GET` | Availability | Agenda slots |
| `pricing/` | `GET` | Public pricing | Landing integration |
| `chat/` & `chat/status/` | `POST`/`GET` | Messages/status | Real-time; optimistic |
| `webhook/n8n/` | `POST` | N8N workflows | `WebhookService.process()` |
| `financeiro/categorias/` & `[id]` | `GET`/`POST` | Categories CRUD | Expenses |
| `notifications/send/` | `POST` | Alerts | Post-CRUD triggers |
| `carol/{query,actions}/` | `GET`/`POST` | AI queries/actions | Chat/agenda |
| `{ready,health,contact,config/public}/` | `GET`/`POST` | Meta/public | Health checks, forms |

### Services (Business Logic: lib/services/)
| File | Purpose | Key Symbols |
|------|---------|-------------|
| `lib/services/webhookService.ts` | N8N/webhook orchestration (85% service pattern) | `WebhookService` (class @ line 35: `process()`, notify) |

### Pages/Layouts (`app/`)
- **Admin**: `app/(admin)/admin/{configuracoes/{servicos,equipe,pricing,areas,addons},agenda,analytics/{...},clientes/[id],contratos/{[id],novo},equipe,financeiro/{...},leads,mensagens/[sessionId],servicos}`.
- **Public**: `app/(public)/{chat,terms,privacy}`.
- **Auth**: `app/(auth)/login`.
- Patterns: RSC, `Suspense`/`loading.tsx`/`error.tsx`, dynamic `[id]`.

## Code Patterns & Conventions
- **Components/Hooks**:
  ```tsx
  import { cn } from '@/lib/utils';
  import { Button } from '@/components/ui/button';
  interface Props { data: AppointmentFormData; onSubmit: (data: AppointmentFormData) => void; }
  export function MyForm({ data, onSubmit }: Props) {
    return (
      <div className={cn('p-4 space-y-4 md:p-6 dark:bg-slate-900')}>
        <Button className="w-full sm:w-auto">Submit</Button>
      </div>
    );
  }
  // Hook: export const useMyHook = (props: UseProps) => { const queryClient = useQueryClient(); ... }
  ```
- **API Routes**:
  ```ts
  import { NextRequest } from 'next/server';
  import { z } from 'zod';
  import { WebhookService } from '@/lib/services/webhookService';
  const schema = z.object({ clientId: z.string() });
  export async function POST(req: NextRequest) {
    try {
      const data = schema.parse(await req.json());
      await new WebhookService().process(data.clientId);
      return Response.json({ success: true });
    } catch (e) {
      return Response.json({ error: 'Invalid' }, { status: 400 });
    }
  }
  ```
- **Forms**: `useForm({ resolver: zodResolver(schema) })` + shadcn `FormField`.
- **Queries/Mutations**: `useQuery(['key'], fn)`, `useMutation({ onSuccess: () => queryClient.invalidateQueries() })`, optimistic.
- **Charts**: `<LineChart data={TrendData[] as { date: string; value: number }[]}>`.
- **Types**: Export interfaces/enums; Zod.infer.
- **Utils**: `lib/utils.ts` (`cn`, toasts via Sonner).
- **No Tests**: Vitest optional.

## Workflows for Common Tasks

### 1. New Reusable Component (e.g., `AddonSelector`)
1. Place: `components/agenda/addon-selector.tsx`.
2. Props: `interface AddonSelectorProps { addons: Addon[]; selected: AddonSelecionado[]; onChange: (a: AddonSelecionado[]) => void; }`.
3. shadcn: `<Table>`, `<Select>`, `<Skeleton />` for loading.
4. Responsive: `grid-cols-1 lg:grid-cols-2 dark:border-slate-700`.
5. Hook integration: `const { form } = useAppointmentForm(props);`.
6. Barrel export: `components/agenda/index.ts`.
7. Test: Use in `edit-client-modal.tsx` or `appointment-form/`.

### 2. New API Endpoint (e.g., `/api/clients/[id]/addons`)
1. `app/api/clients/[id]/addons/route.ts`.
2. Dynamic: `const { id } = z.object({ id: z.string() }).parse(params);`.
3. Logic: Prisma `prisma.client.findUnique({ where: { id }, include: { addons: true } })` or `WebhookService`.
4. Error: `if (!client) return Response.json({ error: 'Not found' }, { status: 404 });`.
5. CORS/headers if public.

### 3. Client Tab Extension (e.g., `tab-addons.tsx`)
1. Copy `tab-agendamentos.tsx` → `components/cliente-ficha/tab-addons.tsx` (`TabAddonsProps { clientId: string; }`).
2. Fetch: `useQuery({ queryKey: ['client', clientId, 'addons'], queryFn: () => fetch(`/api/clients/${clientId}/addons`).then(r => r.json()) })`.
3. UI: `<AddonSelector addons={data?.addons || []} />` + mutations.
4. Page update: `app/(admin)/admin/clientes/[id]/page.tsx` → Add `<TabsContent value="addons"> <TabAddons clientId={params.id} /> </TabsContent>` + tab trigger.
5. Invalidate: `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', clientId] })`.

### 4. Full Domain Feature (e.g., Finance Addon Tracking)
1. **Components**: `components/financeiro/addon-expenses-table.tsx` (reuse `ClientsTableProps`, `expense-categories.tsx`).
2. **Filters**: Extend `clients-filters.tsx` pattern.
3. **API**: `app/api/financeiro/addons/route.ts` + `[id]`; Zod + Prisma link (`transaction.addonId`).
4. **Page**: `app/(admin)/admin/financeiro/addons/page.tsx` (Server: `const data = await prisma...`; `<Suspense fallback={<Skeleton />}>`).
5. **Service**: `WebhookService.notifyFinanceUpdate(addonId)`.
6. **Polish**: Empty state (`No addons`), mobile (`overflow-x-auto`), toast feedback, charts (`TrendData` for expenses).

### 5. Chat/Agenda Hybrid (e.g., Inline Scheduling)
1. Extend `chat-input.tsx`: Add `AppointmentFormData` form via `useAppointmentForm`.
2. Mutation: `useMutation({ mutationFn: (data) => post('/api/chat/schedule', { sessionId, data }) })`.
3. Optimistic: `onMutate: prepend simulated message`.
4. Post-success: `/api/notifications/send` + `WebhookService.confirmSchedule(clientId)`.
5. UI: Collapsible form in `chat-window.tsx`.

### 6. Public Landing Feature (e.g., Interactive Pricing Calculator)
1. Component: `components/landing/pricing-calculator.tsx` (extends `PricingItem`; `useState` for addons).
2. Server data: Page `app/(public)/pricing/page.tsx` → `const pricing = await db.pricing.findMany();`.
3. API: `/api/pricing/calculate` (Zod input → compute total w/ `Addon` prices).
4. CTA: Form → `/api/contact` or chat init.

### 7. Analytics Dashboard Widget (e.g., Addon Revenue Trends)
1. `components/analytics/addon-revenue-chart.tsx` (`TrendData[]`).
2. Query: `useQuery(['analytics', 'addons', 'revenue'], () => get('/api/analytics/addons?period=monthly'))`.
3. Integrate: `app/(admin)/admin/analytics/receita/page.tsx` → Grid layout w/ `<AddonRevenueChart />`.
4. Filters: Date range via `react-hook-form`.

## Best Practices from Codebase
- **Modularity**: Compose (e.g., `category-quick-form` in tables/modals); barrel indexes.
- **Performance**: RSC for pages, `Suspense` + streaming, TanStack Table virtualized lists, `useTransition` for UI.
- **UX**: Loading (`Skeleton`), error (`toast.error(e.message)`), empty states, optimistic mutations, infinite scroll for chat/clients.
- **Accessibility**: `aria-label="Add expense"`, `role="tab"`, `onKeyDown` for Enter/Space, focus management in modals.
- **Security/Styling**: Server auth (NextAuth/middleware), Zod sanitization, `dark:` + `data-[state=open]:bg-slate-100`.
- **Types/Validation**: `z.infer<typeof schema>`, export props/types.
- **Integrations**: Always consider `WebhookService` for N8N (e.g., client changes → workflows), Carol AI for smart features.
- **Commits**: `feat(financeiro): add addon expenses tracking + API + webhook`.
- **Dev**: `npm run dev`, ESLint/Prettier auto-fix, Tailwind JIT.

## Quick Reference Checklist
- [ ] Domain-aligned files (`components/financeiro/`, `app/api/financeiro/`)?
- [ ] Typed/reusable (props extend shared `ServicoTipo`/`Addon`)?
- [ ] shadcn/Tailwind/Recharts/TanStack patterns?
- [ ] Query/mutation + invalidate/optimistic/error handling?
- [ ] Zod forms/API + service calls?
- [ ] Responsive/dark/accessible + loading/empty/error states?
- [ ] Webhook/notifications for business events?
- [ ] Page integration (tabs, Suspense, dynamic routes)?
- [ ] Toasts + mobile-first?

Use tools (`listFiles('components/**.tsx')`, `analyzeSymbols()`) for codebase updates. Scale features modularly.
