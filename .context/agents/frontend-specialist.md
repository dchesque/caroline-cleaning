# Frontend Specialist Agent Playbook

## Mission
Develop, refine, and maintain the React/Next.js frontend for Carolinas Premium Cleaning, a Portuguese-language dashboard for client management, scheduling, finance, chat, analytics, and admin/public pages. Focus on `app/(admin)/`, `app/(public)/`, `app/(auth)/` routes; domain components in `components/{agenda,financeiro,cliente-ficha,clientes,chat,analytics,landing,tracking,ui,admin}`; utils in `lib/{utils,formatters,supabase,config,actions,admin-i18n,context}`; services like `WebhookService`. Use TypeScript, Tailwind CSS (`cn` utility), shadcn/ui, react-hook-form + Zod, Supabase integrations. Ensure responsive (mobile-first), accessible (WCAG AA), performant (>90 Lighthouse), strictly typed UIs with Portuguese naming/symbols (e.g., `tab-financeiro.tsx`, `ServicoTipo`).

## Responsibilities
- Build reusable, typed components (PascalCase `React.FC<Props>`) in domain folders (e.g., `components/agenda/appointment-form/`, `components/cliente-ficha/`).
- Create App Router pages/layouts (`page.tsx`, `loading.tsx`, `error.tsx`) for admin (`app/(admin)/admin/{agenda,clientes/[id],financeiro/{relatorios,receitas,categorias,despesas},contratos/[id,novo],configuracoes/{webhooks,trackeamento,sistema,servicos,pricing,pagina-inicial,equipe,empresa,areas,addons},analytics/{tendencias,satisfacao,receita,conversao,clientes,carol},mensagens/[sessionId]}`), public (`app/(public)/{terms,privacy,chat,landing}`), auth (`app/(auth)/login`).
- Implement forms with formatters/validators; real-time chat/agenda; data via Supabase/services/actions.
- Optimize with memoization, dynamic imports, virtualization; ensure ARIA, keyboard nav, i18n (`lib/admin-i18n/context.tsx`).
- Follow patterns: tabbed profiles (`cliente-ficha/`), tables/filters (`clientes/`), bubbles (`chat/`), charts (`analytics/`), landing sections (`landing/`).

## Best Practices (Derived from Codebase)
- **Architecture**: Default export `React.FC<PropsWithChildren<T>>` or `React.FC<Props>`. Props/types at top (`interface TabAgendamentosProps { ... }`) or `types.ts` (e.g., `components/agenda/types.ts`). Colocate hooks (e.g., `useAppointmentForm`). `'use client'` for interactivity; Server Components for data.
- **Styling**: `cn("base classes", condition && "variant")` from `lib/utils.ts`. Mobile-first: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`. shadcn/ui (`Button`, `Card`, `Input`, `Table`, `Tabs`, `Form`, `Skeleton`). Semantic: `<section aria-labelledby="title">`.
- **TypeScript**: Strict; discriminated unions (tabs); domain types (`ServicoTipo`, `Addon`, `AppointmentFormData`, `Client`). Infer Supabase + refine (e.g., `z.string().refine(isValidPhoneUS)`).
- **Forms**: `useForm({ resolver: zodResolver(schema) })`. Format onChange: `formatPhoneUS(e.target.value)`, `formatCurrencyInput`. Parse on submit: `parseCurrency`.
- **Data/State**: Optimistic updates + `WebhookService` for mutations. Contexts: `TrackingProviderProps` (`components/tracking/tracking-provider.tsx`), `AdminI18nContextType`.
- **Performance**: `React.memo`, `useMemo/useCallback`, `dynamic({ ssr: false })` (charts), `key={id}`, TanStack Table virtualization.
- **Accessibility**: `role="tablist" aria-selected="true" aria-controls`, `aria-label`, `focus-visible:ring-2`, high-contrast (`text-foreground`, `bg-card`).
- **Real-Time**: Chat (`chat-messages.tsx` + Supabase RT); notifications (`chat-bubble-notification.tsx`); polling/services.
- **Error/Loading**: `Suspense` + `loading.tsx` (Skeletons), `error.tsx`, `toast` (shadcn/Sonner).
- **Conventions**: 2-space indent; JSDoc; camelCase vars; Portuguese paths/symbols (`financeiro`, `DiaServico`); exhaustive `switch`.
- **Patterns**: Tabbed UI (`cliente-ficha/{tab-*.tsx}`); modals/forms (`transaction-form.tsx`, `category-quick-form.tsx`); tables (`clients-table.tsx` + `clients-filters.tsx`); chat stack (`chat-window.tsx` wrapping header/messages/input); trends (`trends-chart.tsx` with `TrendData`).

## Key Areas to Focus On
- **Components (152+ symbols)**: `agenda/` (forms/types/hooks), `financeiro/` (transactions/categories), `cliente-ficha/` (tabs/header), `clientes/` (table/filters), `chat/` (window/messages/input/bubble/header/notification), `analytics/` (trends/metrics), `landing/` (pricing/trust/FAQ), `tracking/` (provider), `ui/` (shadcn primitives), `admin/config/` (subcomponents).
- **Pages/Layouts**: Admin subroutes (analytics/*, configuracoes/*, financeiro/*); public (chat, terms, privacy); auth (login).
- **Utils (55 symbols)**: `lib/utils.ts` (cn/formatters), `lib/formatters.ts` (phone/currency validators/parsers), `lib/{supabase,config,actions}`.
- **Services (85% pattern match)**: `lib/services/webhookService.ts` (`WebhookService` for orchestration/mutations).
- **Contexts/Providers**: `lib/admin-i18n/context.tsx`, `components/tracking/tracking-provider.tsx`.
- **Types**: `components/agenda/types.ts` (`ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData`); prop interfaces everywhere (e.g., `TransactionFormProps`, `ClientsTableProps`).

## Key Files and Purposes
### Core Utils & Types
| File | Purpose | Key Exports/Symbols |
|------|---------|---------------------|
| `lib/utils.ts` | Conditional classes, currency/date formatting | `cn`, `formatCurrency`, `formatDate` |
| `lib/formatters.ts` | Phone/email/currency handling | `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` |
| `lib/admin-i18n/context.tsx` | Admin internationalization | `AdminI18nContextType` |
| `components/tracking/tracking-provider.tsx` | Global tracking context | `TrackingProviderProps`, `Window` extensions |
| `lib/services/webhookService.ts` | Business logic layer | `WebhookService` |
| `components/agenda/types.ts` | Scheduling domain types | `ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData` |

### Agenda
| File | Purpose | Key Symbols |
|------|---------|-------------|
| `components/agenda/appointment-form/use-appointment-form.ts` | Custom form hook | `useAppointmentForm`, `UseAppointmentFormProps` |

### Financeiro
| File | Purpose | Props Interface |
|------|---------|-----------------|
| `components/financeiro/transaction-form.tsx` | Add/edit transactions | `TransactionFormProps` |
| `components/financeiro/expense-categories.tsx` | Category list/management | `ExpenseCategoryProps` |
| `components/financeiro/category-quick-form.tsx` | Quick category creation | `CategoryQuickFormProps` |

### Clientes & Cliente-Ficha
| File | Purpose | Props Interface |
|------|---------|-----------------|
| `components/clientes/clients-table.tsx` | Paginated/searchable client table | `ClientsTableProps`, `Client` |
| `components/clientes/clients-filters.tsx` | Filter controls | `ClientsFiltersProps` |
| `components/cliente-ficha/client-header.tsx` | Client profile header | `ClientHeaderProps` |
| `components/cliente-ficha/tab-notas.tsx` | Notes tab | `TabNotasProps` |
| `components/cliente-ficha/tab-info.tsx` | Client info tab | `TabInfoProps` |
| `components/cliente-ficha/tab-financeiro.tsx` | Finance tab | `TabFinanceiroProps` |
| `components/cliente-ficha/tab-contrato.tsx` | Contracts tab | `TabContratoProps` |
| `components/cliente-ficha/tab-agendamentos.tsx` | Appointments tab | `TabAgendamentosProps` |

### Chat
| File | Purpose | Props Interface |
|------|---------|-----------------|
| `components/chat/message-bubble.tsx` | Message render | `MessageBubbleProps` |
| `components/chat/chat-window.tsx` | Chat container | `ChatWindowProps` |
| `components/chat/chat-messages.tsx` | Messages list | `ChatMessagesProps` |
| `components/chat/chat-input.tsx` | Message composer | `ChatInputProps` |
| `components/chat/chat-header.tsx` | Chat header | `ChatHeaderProps` |
| `components/chat/chat-bubble-notification.tsx` | Unread indicator | `ChatBubbleNotificationProps` |

### Analytics & Landing
| File | Purpose | Props/Data |
|------|---------|------------|
| `components/analytics/trends-chart.tsx` | Trend line/bar charts | `TrendsChartProps`, `TrendData` |
| `components/analytics/top-metrics.tsx` | KPI cards | `Metric` |
| `components/landing/pricing.tsx` | Pricing tiers | `PricingItem` |
| `components/landing/whats-included.tsx` | Features grid | `WhatsIncluded` |
| `components/landing/trust-badges.tsx` | Trust signals | `TrustBadges` |
| `components/landing/meet-carol.tsx` | Hero/intro | `MeetCarol` |
| `components/landing/how-it-works.tsx` | Steps section | `HowItWorks` |
| `components/landing/faq.tsx` | FAQ accordion | `FAQ` |

## Workflows for Common Tasks
### 1. New Tabbed Component (e.g., `components/cliente-ficha/tab-historico.tsx`)
1. Review siblings: `tab-agendamentos.tsx` (Table + filters), `tab-financeiro.tsx` (Cards + totals).
2. Define: `interface TabHistoricoProps { data: HistoricoItem[]; onAction: (id: string) => void; loading: boolean; }`.
3. Implement: `const TabHistorico = React.memo(({ data, onAction, loading }: TabHistoricoProps) => ( <TabsContent value="historico" className={cn("space-y-4 p-6")}> {loading ? <Skeleton className="h-64" /> : data.map(item => ( <Card key={item.id}> <div className="flex justify-between"> <p className="text-sm text-muted-foreground">{formatDate(item.date)}</p> <Button variant="outline" onClick={() => onAction(item.id)} aria-label="Editar histórico">Editar</Button> </div> </Card> ))} </TabsContent> ));`.
4. A11y/Responsive: `aria-labelledby="historico-tab"`, `md:grid-cols-2`.
5. Integrate: In `cliente-ficha/page.tsx`: `<Tabs defaultValue="info"><TabsTrigger value="historico">Histórico</TabsTrigger><TabHistorico data={history} /></Tabs>`.
6. Types: Extend `ClienteFichaContext`; use `useAdminI18n`.

### 2. New Admin Subpage (e.g., `app/(admin)/admin/configuracoes/equipe/page.tsx`)
1. Create dir/files: `page.tsx`, `loading.tsx` (Skeletons), `error.tsx`.
2. Server page: `async function Page({ searchParams }: Props) { const equipe = await getEquipeData(searchParams); return ( <Container className="py-12 space-y-8"> <PageHeader title="Configurações Equipe" /> <EquipeTable data={equipe} /> </Container> ); }`.
3. Client wrapper if interactive: `'use client'` + `<ClientsFilters onChange={refetch} />`.
4. Metadata: `export const metadata = { title: 'Equipe - Configurações' };`.
5. Layout: Share `app/(admin)/admin/configuracoes/layout.tsx`.

### 3. Enhance Form (e.g., Update `transaction-form.tsx`)
1. Schema: `const schema = z.object({ amount: z.string().transform(parseCurrency).refine(v => v > 0, "Valor inválido"), phone: z.string().refine(isValidPhoneUS) });`.
2. Form: `const { control, handleSubmit, setValue, formState } = useForm<TransactionFormProps>({ resolver: zodResolver(schema) });`.
3. Field: `<FormField name="amount" render={({ field }) => <Input {...field} onChange={e => { field.onChange(e); setValue('amount', formatCurrencyInput(e.target.value)); }} />} />`.
4. Submit: `onSubmit={handleSubmit(async data => { await WebhookService.createTransaction(data); toast.success('Salvo!'); refetch(); })}`.
5. UI: Error `<p className="text-destructive text-sm">{errors.amount?.message}</p>`; loading `isPending ? <Button disabled>Loading...</Button> : <Button>Salvar</Button>`.

### 4. Real-Time Chat Feature (e.g., Add to `chat-messages.tsx`)
1. Props: Extend `ChatMessagesProps { messages: Message[]; onSend: (msg: string) => void; }`.
2. State/Hook: `const [optimisticMsgs, setOptimisticMsgs] = useState(messages); useEffect(() => subscribeToSession(sessionId, setOptimisticMsgs), []);`.
3. Render: `<div className="space-y-2 max-h-96 overflow-y-auto"> {optimisticMsgs.map(msg => <MessageBubble key={msg.id} {...msg} />)} </div>`.
4. Optimistic: `const handleSend = (text: string) => { const tempId = uuid(); setOptimisticMsgs(prev => [...prev, { id: tempId, text, isPending: true }]); WebhookService.send(text).then(() => removePending(tempId)); };`.
5. Scroll: `ref.current?.scrollIntoView({ behavior: 'smooth' });`.

### 5. Paginated Table with Filters (e.g., Extend `clients-table.tsx`)
1. TanStack: `const table = useReactTable({ data: clients, columns, state: { pagination, globalFilter }, onPaginationChange, manualPagination: true });`.
2. Filters: `<ClientsFilters onFiltersChange={debounce(setFilters, 300)} />` → server query.
3. Row: `memo(({ row }) => <TableRow> <TableCell>{formatPhoneUS(row.original.phone)}</TableCell> ... </TableRow>)`.
4. Virtual: `<Virtualizer count={totalCount} overscan={5}> {index => <TableRow>{renderRow(table.getRowModel().rows.slice(index)[0])}</TableRow>} </Virtualizer>`.

### 6. New Chart Component (e.g., `components/analytics/equipe-trends.tsx`)
1. Props: `interface EquipeTrendsProps { data: TrendData[]; period: 'month' | 'year'; }`.
2. Dynamic: `const Chart = dynamic(() => import('./recharts/LineChart'), { ssr: false });`.
3. Render: `<Card className="p-6"><Chart data={data} xKey="date" yKey="revenue" yFormatter={formatCurrencyUSD} color="hsl(var(--primary))" height="h-80 md:h-96" /></Card>`.
4. Controls: Buttons toggle `period` → `refetch({ period })`.

### 7. Performance/A11y Optimization Audit
1. Memoize: Props unchanged → `React.memo(Component, (prev, next) => shallowEqual(prev.data, next.data))`.
2. Responsive: Tailwind Play → `container mx-auto px-4 sm:px-6 lg:px-8`.
3. A11y: Axe DevTools; add `aria-describedby="help-text"`.
4. Perf: `npm run build` → analyze bundle; Lighthouse CLI.

## QA & Collaboration Checklist
- **Build/Checks**: `npm run build && tsc --noEmit && npm run lint -- --fix`.
- **Tests**: Responsive (Chrome DevTools); keyboard nav; forms (invalid/valid/empty); states (loading/error/no-data).
- **Metrics**: Lighthouse ≥90 perf/a11y; Core Web Vitals; bundle <2MB.
- **Visual/Edge**: Screenshots (mobile/desktop); PT-BR i18n; slow network.
- **PR**: Diffs; new symbols (`Props` interfaces); Lighthouse report; risks (re-renders, prop drilling).

## Hand-off Notes
- **Artifacts**: Code diffs, types, screenshots, metrics JSON.
- **Risks**: Unmemoized lists → lag; missing `key` → re-mounts; unescaped formatters → invalid data.
- **Escalate**: New Supabase tables; service changes; i18n expansions.
