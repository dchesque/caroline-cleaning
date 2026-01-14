# Frontend Specialist Agent Playbook

## Mission
The Frontend Specialist Agent develops, refines, and maintains the React/Next.js frontend for Carolinas Premium, a Portuguese-language client management dashboard. Key features include admin panels (`app/(admin)/`), public landing pages (`app/(public)/`), authentication (`app/(auth)/`), scheduling (`agenda/`), finance tracking (`financeiro/`), client profiles (`cliente-ficha/` & `clientes/`), real-time chat (`chat/`), analytics (`analytics/`), and landing elements (`landing/`). Use TypeScript (.tsx/.ts), Tailwind CSS, shadcn/ui components, react-hook-form + Zod, and integrations with Supabase (`lib/supabase/`), utils (`lib/utils.ts`, `lib/formatters.ts`), actions (`lib/actions/`), services (`lib/services/`), and i18n (`lib/admin-i18n/context.tsx`). Prioritize responsive, accessible UIs; performance; strict typing; and codebase patterns for consistency across 137 .tsx components and 44 .ts utils.

## Responsibilities
- Create reusable, typed components in domain folders (e.g., `components/agenda/appointment-form/`, `components/cliente-ficha/`).
- Build App Router pages/layouts with loading/error boundaries in `app/(admin)/admin/{agenda,clientes/[id],financeiro/{relatorios,receitas,categorias,despesas},contratos/[id]/novo,configuracoes/{servicos,pricing,areas,equipe,addons},analytics/{tendencias,satisfacao,receita,conversao,clientes,carol},mensagens/[sessionId]}` and public/auth routes.
- Implement mobile-first responsive designs with Tailwind (`cn` utility) and shadcn/ui (Button, Card, Input, Table, Tabs, Form, Skeleton, Toaster).
- Handle forms with validation/formatters; real-time updates (chat, agenda); data fetching/mutations via Supabase/services.
- Optimize for performance (memoization, dynamic imports, virtualization); accessibility (WCAG AA, ARIA, keyboard nav).
- Maintain admin i18n; ensure Portuguese naming (e.g., `tab-financeiro.tsx`); profile with Lighthouse (>90 perf/a11y).

## Best Practices (Derived from Codebase)
- **Component Architecture**: PascalCase `React.FC<Props>` default exports. Define prop interfaces/types at file top or shared `types.ts` (e.g., `AppointmentFormData`, `TabAgendamentosProps`). Colocate custom hooks (e.g., `useAppointmentForm`). Use shadcn/ui from `components/ui/`; domain-specific in `components/{agenda,financeiro,cliente-ficha,clientes,chat,analytics,landing,admin}/`.
- **Styling**: `cn` from `lib/utils.ts` for conditional classes: `cn("p-6 rounded-lg border bg-card shadow-sm", isActive && "ring-2 ring-primary ring-offset-background")`. Mobile-first: base → `sm:`, `md:`, `lg:`. No custom CSS; semantic HTML.
- **TypeScript**: Strict; exhaustive unions/discriminated (e.g., tabs); Supabase-inferred + domain types (`ServicoTipo`, `Addon`, `Client`). `PropsWithChildren<T>` for layouts/parents.
- **Forms**: `useForm<Schema>({ resolver: zodResolver(zodSchema) })`. Formatters: `onChange={(e) => setValue('phone', formatPhoneUS(e.target.value))}`; validators: `z.string().refine(isValidPhoneUS)`. Submit with server actions/services.
- **Data & State**: Server Components for fetches; `'use client'` + hooks/context for interactivity. Real-time: optimistic updates + `WebhookService`.
- **Performance**: `React.memo` (lists/items); `useMemo/useCallback`; `dynamic({ ssr: false })` (charts); stable `key={id}`; TanStack Table virtualization.
- **Accessibility**: `<section>`, `<nav role="tablist">`, `aria-label/selected/controls/describedby`, `focus-visible:outline-none ring-2`. High contrast (`text-foreground`, `bg-background`).
- **Real-Time**: Chat (`chat-messages.tsx` + input); agenda notifications; polling/WebSockets via services.
- **Error/Loading**: `Suspense`, `error.tsx`, `loading.tsx` (Skeletons), `toast` (Sonner/shadcn).
- **Conventions**: 2-space indent; JSDoc/@param for props; camelCase; Portuguese in admin paths/symbols (e.g., `DiaServico`); exhaustive `switch`.
- **Patterns**: Tabbed ficha (`cliente-ficha/{tab-*.tsx}`); modals (`edit-client-modal.tsx`); tables/filters (`clients-table.tsx`, `clients-filters.tsx`); bubbles (`message-bubble.tsx`); trends (`trends-chart.tsx` `TrendData`).

## Key Areas to Focus On
- **Components (137 .tsx, 139 symbols)**: Domain dirs: `agenda/` (forms/types), `financeiro/` (transactions/categories), `cliente-ficha/` (tabs/header), `clientes/` (table/modal/filters), `chat/` (window/messages/input/bubble/header/notification), `analytics/` (trends/satisfaction/revenue), `landing/` (pricing/FAQ/meet-carol/how-it-works/announcement-bar/whats-included), `admin/` (config subdirs), `ui/` (shadcn).
- **App Router Pages/Layouts**: `app/(public)/{terms,privacy,chat}`, `app/(auth)/login`, `app/(admin)/admin/{servicos,leads,mensagens,financeiro/relatorios/{receitas,categorias,despesas},equipe,contratos/{id,novo},configuracoes/{servicos,pricing,areas,equipe,addons},clientes/[id],analytics/{tendencias,satisfacao,receita,conversao,clientes,carol},agenda,mensagens/[sessionId]}`.
- **Utils (44 .ts, 43 symbols)**: `lib/{utils.ts (cn,formatCurrency,formatDate), formatters.ts (formatPhoneUS,unformatPhone,isValidPhoneUS,isValidEmail,formatCurrencyUSD,formatCurrencyInput,parseCurrency), supabase/, config/, actions/, admin-i18n/context.tsx (AdminI18nContextType), context/}`.
- **Services**: `lib/services/webhookService.ts` (WebhookService) for mutations/orchestration.
- **Types**: Domain-specific (e.g., `agenda/types.ts`: `ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData`).

## Key Files and Purposes
### Core Utils & Types
| File | Purpose | Key Exports/Symbols |
|------|---------|---------------------|
| `lib/utils.ts` | UI utilities | `cn`, `formatCurrency`, `formatDate` |
| `lib/formatters.ts` | Formatting/validation | `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` |
| `lib/admin-i18n/context.tsx` | Admin i18n provider | `AdminI18nContextType` |
| `lib/services/webhookService.ts` | Business logic (service layer) | `WebhookService` |
| `components/agenda/types.ts` | Scheduling types | `ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData` |

### Agenda
| File | Purpose | Key Symbols |
|------|---------|-------------|
| `components/agenda/appointment-form/use-appointment-form.ts` | Form hook/logic | `useAppointmentForm`, `UseAppointmentFormProps` |

### Financeiro
| File | Purpose | Props Interface |
|------|---------|-----------------|
| `components/financeiro/transaction-form.tsx` | Transaction forms | `TransactionFormProps` |
| `components/financeiro/expense-categories.tsx` | Category management | `ExpenseCategoryProps` |
| `components/financeiro/category-quick-form.tsx` | Quick adds | `CategoryQuickFormProps` |

### Clientes & Cliente-Ficha
| File | Purpose | Props Interface |
|------|---------|-----------------|
| `components/clientes/edit-client-modal.tsx` | Client editing | `EditClientModalProps` (uses `ServicoTipo`, `Addon`, `DiaServico`) |
| `components/clientes/clients-table.tsx` | Paginated table | `ClientsTableProps`, `Client` |
| `components/clientes/clients-filters.tsx` | Search/filters | `ClientsFiltersProps` |
| `components/cliente-ficha/client-header.tsx` | Profile header | `ClientHeaderProps` |
| `components/cliente-ficha/tab-notas.tsx` | Notes tab | `TabNotasProps` |
| `components/cliente-ficha/tab-info.tsx` | Info tab | `TabInfoProps` |
| `components/cliente-ficha/tab-financeiro.tsx` | Finance tab | `TabFinanceiroProps` |
| `components/cliente-ficha/tab-contrato.tsx` | Contracts tab | `TabContratoProps` |
| `components/cliente-ficha/tab-agendamentos.tsx` | Appointments tab | `TabAgendamentosProps` |

### Chat
| File | Purpose | Props Interface |
|------|---------|-----------------|
| `components/chat/message-bubble.tsx` | Individual messages | `MessageBubbleProps` |
| `components/chat/chat-window.tsx` | Full chat UI | `ChatWindowProps` |
| `components/chat/chat-messages.tsx` | Messages list | `ChatMessagesProps` |
| `components/chat/chat-input.tsx` | Input composer | `ChatInputProps` |
| `components/chat/chat-header.tsx` | Header | `ChatHeaderProps` |
| `components/chat/chat-bubble-notification.tsx` | Unread notifications | `ChatBubbleNotificationProps` |

### Analytics & Landing
| File | Purpose | Props/Data |
|------|---------|------------|
| `components/analytics/trends-chart.tsx` | Trend visualizations | `TrendData` |
| `components/landing/pricing.tsx` | Pricing tiers | `PricingItem` |
| `components/landing/meet-carol.tsx` | Intro section | `MeetCarol` |
| `components/landing/how-it-works.tsx` | Workflow steps | `HowItWorks` |
| `components/landing/faq.tsx` | Accordion FAQ | `FAQ` |
| `components/landing/announcement-bar.tsx` | Top bar | `AnnouncementBar` |
| `components/landing/whats-included.tsx` | Features list | `WhatsIncluded` |

## Workflows for Common Tasks
### 1. New Domain Component (e.g., `tab-historico.tsx` in `cliente-ficha/`)
1. Analyze similar: Review `tab-agendamentos.tsx`/`tab-financeiro.tsx` patterns (TabsContent, Table/Card lists).
2. Create: `components/cliente-ficha/tab-historico.tsx`.
3. Define: `interface TabHistoricoProps { history: HistoryItem[]; onEdit: (id: string) => void; }`.
4. Implement: `const TabHistorico: React.FC<TabHistoricoProps> = memo(({ history, onEdit }) => ( <TabsContent className={cn("space-y-4")}> {history.map(item => <Card key={item.id}> <p>{formatDate(item.date)}</p> <Button onClick={() => onEdit(item.id)}>Editar</Button> </Card> )} </TabsContent> ));`.
5. Style/A11y: Tailwind responsive; `aria-label="Histórico do Cliente"`.
6. Integrate: Export; use in `cliente-ficha/page.tsx` `<Tabs><TabsTrigger value="historico">Histórico</TabsTrigger>...</Tabs>`.
7. Test: Types, responsive, empty state.

### 2. New Admin Page (e.g., `/admin/analytics/equipe`)
1. Dir: `app/(admin)/admin/analytics/equipe/page.tsx`.
2. Server fetch: `async function Page({ searchParams }: { searchParams: { period?: string } }) { const data = await fetchEquipeTrends(searchParams.period); return <EquipeTrendsChart data={data} />; }`.
3. Add siblings: `loading.tsx` (Skeletons), `error.tsx`.
4. Client interactivity: `'use client'` for filters/charts; use `useSearchParams`.
5. Layout: `<Container className="py-8 space-y-6"><PageHeader title="Equipe Analytics" /><Filters /><Chart /> </Container>`.
6. Metadata/i18n: `export const metadata = { title: 'Analytics Equipe' };` + `useAdminI18n`.

### 3. Typed Form (e.g., Update `transaction-form.tsx`)
1. Schema: Zod with formatters (`z.string().transform(parseCurrency).refine(n => n > 0)`).
2. Hook: Extend patterns from `useAppointmentForm`.
3. JSX: `<FormField control={control} name="amount" render={({ field }) => <Input type="text" {...field} onChange={formatCurrencyInput} placeholder="R$ 0,00" />} />`.
4. Submit: `onSubmit={handleSubmit(async (data: TransactionFormData) => { await WebhookService.createTransaction(data); refetch(); })}`.
5. Validation/UI: Errors via `formState.errors`; loading spinner.

### 4. Real-Time Chat Update (e.g., New Notification)
1. Container: `app/(public)/chat/page.tsx` → `<ChatWindow sessionId={id}><ChatHeader /><ChatMessages /><ChatInput /></ChatWindow>`.
2. State: `const [messages, setMessages] = useState<Message[]>([]);` optimistic `setMessages(prev => [...prev, newMsg]);`.
3. Service: `WebhookService.sendMessage(msg)` + subscribe for incoming.
4. Render: `<VirtualizedList data={messages} renderItem={({ item }) => <MessageBubble key={item.id} {...item} isOwn={item.senderId === user.id} />} />`.
5. Notify: `<ChatBubbleNotification unread={unreadCount} onClick={openChat} />`.

### 5. Optimize Table (e.g., Enhance `clients-table.tsx`)
1. TanStack: `<Table data={clients} columns={columns} />` with server pagination (`pageIndex`, `pageSize`).
2. Filters: Integrate `<ClientsFilters onFiltersChange={setFilters} />` + debounce.
3. Row: `const ClientRow = memo(({ client }: { client: Client }) => <TableRow key={client.id}> <TableCell>{formatPhoneUS(client.phone)}</TableCell> ... </TableRow>);`.
4. Virtual: `@tanstack/react-virtual` for large N.

### 6. New Analytics Chart (e.g., `equipe-chart.tsx`)
1. Data: Server `TrendData[]` prop.
2. Impl: `dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })), { ssr: false })`.
3. JSX: `<ResponsiveContainer className="h-80 lg:h-96"><LineChart data={data}><XAxis dataKey="date" /><YAxis tickFormatter={formatCurrencyUSD} /><Line dataKey="value" stroke="hsl(var(--primary))" /> </LineChart></ResponsiveContainer>`.
4. Controls: Period buttons → refetch.

### 7. Responsive/A11y/Perf Audit
1. Tailwind: DevTools → toggle devices; ensure `grid-cols-1 md:grid-cols-2`.
2. A11y: `role="tablist" aria-selected`; `screenreader-only`; Lighthouse/axe.
3. Perf: Memo callbacks; `why-did-you-render`; `npm run build` → `npx @next/bundle-analyzer`.

## QA & Collaboration Checklist
- **Build/Lint**: `npm run build`, `npm run lint -- --fix`, `tsc --noEmit`.
- **Metrics**: Lighthouse (perf≥90, a11y≥95, best-practices≥90); Core Web Vitals.
- **Tests**: Responsive (mobile/tablet/desktop); keyboard (Tab/Enter); empty/error/loading states; form validation.
- **Visual**: Before/after screenshots; Figma if specs.
- **PR**: Changed files/symbols; metrics delta; edge cases (no data, invalid phone/currency).

## Hand-off Notes
- **Artifacts**: File diffs, new types/props, UI screenshots, Lighthouse JSON.
- **Risks**: Re-renders (no memo) → lag; prop drilling → Context; Tailwind purge misses.
- **Escalate**: Supabase schema updates; service logic changes; i18n keys.
