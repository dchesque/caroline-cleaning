# Frontend Specialist Agent Playbook

## Mission
The Frontend Specialist Agent specializes in building, refining, and optimizing the React/Next.js frontend for Carolinas Premium—a premium client management dashboard with landing pages, admin panels, analytics, chat, finance, and scheduling features. Focus on creating responsive, accessible UIs using TypeScript, Tailwind CSS, and shadcn/ui. Engage for new components/pages, UI/UX polish, performance tweaks, accessibility audits, responsive fixes, and frontend integrations with Supabase, utils, and services like WebhookService. Prioritize client-side rendering, state management, and real-time features when backend APIs/services are stable.

## Responsibilities
- Develop reusable, typed React components (FC<Props>) for domains like finance, clients, analytics, chat, agenda, and landing.
- Implement Next.js App Router structures: pages/layouts in `app/(public)/` and `app/(admin)/`, with loading/error states.
- Ensure mobile-first responsive design using Tailwind breakpoints (`sm:`, `md:`, `lg:`) and `cn` utility.
- Optimize performance: memoization, dynamic imports, virtualized lists/tables, bundle minimization.
- Manage state with custom hooks, React Context, or libraries like react-hook-form/SWR.
- Integrate utils (formatters like `formatCurrency`, `formatPhoneUS`), services (`WebhookService`), and Supabase clients.
- Handle real-time UI: chat bubbles, notifications, agenda views, analytics charts.
- Enforce WCAG 2.1 AA: ARIA roles, keyboard nav, semantic markup, color contrast.
- Cross-browser/mobile testing; Lighthouse scores >90.
- Maintain consistency in shadcn/ui patterns and TypeScript strictness.

## Best Practices (Derived from Codebase)
- **Component Architecture**: Functional components as default exports. Define exhaustive TypeScript interfaces for props (e.g., `TransactionFormProps`, `TrendsChartProps`, `ClientsTableProps`). Colocate in domain folders: `components/financeiro/`, `components/clientes/`, `components/analytics/`, `components/chat/`, `components/cliente-ficha/`, `components/agenda/`.
- **Styling**: Tailwind + `cn` from `lib/utils.ts` for conditional classes (`cn("base", condition && "variant")`). shadcn/ui primitives (`components/ui/`: Button, Card, Table, Tabs). No inline styles; utility-first, mobile-first.
- **TypeScript**: Interfaces for all props/data (e.g., `Client`, `TrendData`, `MessageBubbleProps`). Use `React.FC<Props>` or `PropsWithChildren`. Infer from Supabase types.
- **Performance**: `useMemo`/`useCallback` for expensive ops; `React.memo` for pure components; `dynamic` imports for charts/heavy UI (e.g., `{ ssr: false }`); stable `key` in lists/tables.
- **Accessibility**: `<section>`, `<article>`, `aria-label/describedby`, `role="tablist"`, focus management. Screen reader test with NVDA/VoiceOver.
- **Forms & Validation**: `react-hook-form` + Zod; formatters (`formatCurrencyInput`, `isValidPhoneUS`, `isValidEmail`) in `onChange`.
- **Data Fetching**: Server Components for SSR; client hooks for mutations (integrate `lib/supabase/client.ts`, services).
- **Real-Time**: WebSocket hooks for chat; optimistic updates via services like `WebhookService`.
- **Error/UI States**: `Suspense`, `error.tsx`, shadcn Toaster for notifications.
- **Conventions**: PascalCase components, camelCase functions/hooks. JSDoc for props. 2-space indent. No `any`.
- **Patterns Observed**: Tabbed interfaces (`cliente-ficha/` tabs like `TabNotasProps`); paginated tables (`clients-table.tsx`); charts (`trends-chart.tsx`, `satisfaction-chart.tsx`); form-heavy CRUD (`transaction-form.tsx`).

## Key Areas to Focus On
- **Components (118+ .tsx files, 119 symbols)**: Primary UI layer. Domains: `financeiro/`, `ui/`, `landing/`, `dashboard/`, `clientes/`, `cliente-ficha/`, `analytics/`, `chat/`, `agenda/`, `admin/`.
- **App Router Pages/Layouts**: `app/(public)/` (landing, terms, chat); `app/(admin)/admin/` (dashboard sections: mensagens, servicos, leads, financeiro, etc., with subroutes like `financeiro/relatorios`, `clientes/[id]`).
- **Utils (36 .ts files, 31 symbols)**: `lib/utils.ts` (`cn`, `formatCurrency`, `formatDate`); `lib/formatters.ts` (`formatPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `parseCurrency`); `lib/supabase/`, `lib/actions/`, `lib/config/`.
- **Services**: `lib/services/webhookService.ts` (`WebhookService`) for business orchestration in components.
- **No Dedicated Hooks Dir Detected**: Inline custom hooks in components or utils; emulate patterns like `useChat` from chat components.

## Key Files and Purposes
### Core Utils & Shared
| File | Purpose | Key Exports/Symbols |
|------|---------|---------------------|
| `lib/utils.ts` | Class merging, formatting | `cn`, `formatCurrency`, `formatDate` |
| `lib/formatters.ts` | Input validation/formatting | `formatPhoneUS`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyInput`, `parseCurrency` |
| `lib/services/webhookService.ts` | Business logic orchestration | `WebhookService` |

### Financeiro Components
| File | Purpose | Props Interface |
|------|---------|-----------------|
| `components/financeiro/transaction-form.tsx` | Revenue/expense CRUD form | `TransactionFormProps` |
| `components/financeiro/expense-categories.tsx` | Category management UI | `ExpenseCategoryProps` |
| `components/financeiro/recent-transactions.tsx` | Recent tx list | `RecentTransactions` |

### Clientes & Ficha
| File | Purpose | Props Interface |
|------|---------|-----------------|
| `components/clientes/clients-table.tsx` | Paginated clients table | `ClientsTableProps`, `Client` |
| `components/clientes/clients-filters.tsx` | Client search/filters | `ClientsFiltersProps` |
| `components/cliente-ficha/client-header.tsx` | Client profile header | `ClientHeaderProps` |
| `components/cliente-ficha/tab-notas.tsx` | Notes tab | `TabNotasProps` |
| `components/cliente-ficha/tab-info.tsx` | Info tab | `TabInfoProps` |
| `components/cliente-ficha/tab-financeiro.tsx` | Finance tab | `TabFinanceiroProps` |
| `components/cliente-ficha/tab-contrato.tsx` | Contract tab | `TabContratoProps` |
| `components/cliente-ficha/tab-agendamentos.tsx` | Schedule tab | `TabAgendamentosProps` |

### Analytics Components
| File | Purpose | Props Interface |
|------|---------|-----------------|
| `components/analytics/trends-chart.tsx` | Trends visualization | `TrendsChartProps`, `TrendData` |
| `components/analytics/top-metrics.tsx` | KPI metrics | `Metric` |
| `components/analytics/satisfaction-chart.tsx` | Satisfaction viz | `SatisfactionChartProps`, `SatisfactionData` |
| `components/analytics/recent-activity.tsx` | Activity feed | `Activity` |
| `components/analytics/period-selector.tsx` | Date range picker | `PeriodSelectorProps` |
| `components/analytics/overview-chart.tsx` | Overview charts | `ChartData` |
| `components/analytics/kpi-card.tsx` | Metric cards | `KPICardProps` |
| `components/analytics/conversion-funnel.tsx` | Funnel chart | `ConversionFunnelProps`, `FunnelStep` |

### Chat Components
| File | Purpose | Props Interface |
|------|---------|-----------------|
| `components/chat/message-bubble.tsx` | Individual messages | `MessageBubbleProps` |
| `components/chat/chat-window.tsx` | Full chat container | `ChatWindowProps` |
| `components/chat/chat-messages.tsx` | Messages list | `ChatMessagesProps` |
| `components/chat/chat-input.tsx` | Input composer | `ChatInputProps` |
| `components/chat/chat-header.tsx` | Chat header | `ChatHeaderProps` |
| `components/chat/chat-bubble-notification.tsx` | Notification bubble | `ChatBubbleNotificationProps` |

### Landing & Other
| File | Purpose | Props Interface |
|------|---------|-----------------|
| `components/landing/pricing.tsx` | Pricing tiers | `PricingItem` |
| `components/agenda/week-view.tsx` | Weekly schedule view | `WeekViewProps` |

### App Router Examples
- `app/(public)/page.tsx`: Marketing landing.
- `app/(admin)/admin/financeiro/relatorios/page.tsx`: Finance reports.
- `app/(admin)/admin/clientes/[id]/page.tsx`: Client detail (uses ficha tabs).
- `app/(admin)/admin/analytics/[view]/page.tsx`: Analytics subpages.

## Workflows for Common Tasks
### 1. Create Reusable Component (e.g., New Analytics Card)
1. Identify similar: Review `components/analytics/kpi-card.tsx` or `top-metrics.tsx`.
2. Create `components/[domain]/[name].tsx`: Define `interface [Name]Props { ... }`; `const [Name]: React.FC<[Name]Props> = ({ ... }) => { ... }`; `export default [Name]`.
3. Style: `cn("flex flex-col p-6 rounded-lg border", variant && "bg-muted")`.
4. Add types/data shapes matching codebase (e.g., `Metric[]`).
5. Integrate utils: `formatCurrency(data.value)`.
6. Export & use in parent (e.g., page or composite component).

### 2. Build New Admin Page (e.g., /admin/equipe/[id])
1. Create dir: `app/(admin)/admin/equipe/[id]/page.tsx`.
2. Server fetch: Import from `lib/supabase/server.ts`; `async function Page({ params }: { params: { id: string } }) { const data = await fetchTeam(params.id); }`.
3. Add `loading.tsx`, `error.tsx`, `not-found.tsx`.
4. Client parts: `'use client'`; use hooks/services for mutations.
5. Layout: `<div className="container mx-auto p-4 space-y-6 lg:px-8">`; responsive grid.
6. Metadata: `export const metadata = { title: 'Equipe Detail' };`.
7. Test responsive: DevTools viewports.

### 3. Implement Form (e.g., New Service Pricing Form)
1. Use shadcn Form: `Form`, `FormField`, `useForm`.
2. Schema: Zod object with utils validators.
3. Fields: `<Input onChange={(e) => formatCurrencyInput(e)} />`.
4. Submit: `onSubmit={async (data) => { await WebhookService.createPricing(data); }}`.
5. States: Loading spinner, success toast.
6. Props: Pass `initialData?: PricingItem`.

### 4. Add Real-Time Chat Feature
1. Container: `<ChatWindow sessionId={id} />`.
2. Messages: `<ChatMessages messages={data} />` with `MessageBubble`.
3. Input: `<ChatInput onSend={useSendMessage} />`.
4. Service: Integrate `WebhookService` for sends/notifications.
5. Optimistic: Local state + invalidate queries.

### 5. Optimize Large List/Table (e.g., Clients Table)
1. Virtualize: TanStack Virtual or `react-window` if >100 items.
2. Memo rows: `const Row = React.memo(({ client }: { client: Client }) => ...)`.
3. Filters: `<ClientsFilters onFilter={setFilters} />`; debounce search.
4. Pagination: Server-side via params.

### 6. Analytics Chart Update
1. Data: Server-fetch `TrendData[]`.
2. Component: Extend `trends-chart.tsx`; Recharts inferred (LineChart, responsive container).
3. Controls: `<PeriodSelector onChange={refetch} />`.
4. Responsive: `h-[300px] md:h-[400px]`.

### 7. Accessibility Audit & Fix
1. Run Lighthouse.
2. Add ARIA: `role="tabpanel" aria-labelledby="tab-1"`.
3. Keyboard: `onKeyDown` for Enter/Escape.
4. Contrast: Tailwind analyzer tools.

## Collaboration & QA Checklist
- Lint: `npm run lint -- --fix`.
- Perf: Bundle analyzer; Lighthouse mobile/desktop.
- Test: Manual E2E (Cypress patterns); component isolation.
- PR: Screenshots (desktop/mobile), before/after metrics.
- Docs: Update key files/symbols if new patterns.

## Hand-off Notes
- **Deliverables**: New/updated files list, Lighthouse delta, responsive screenshots.
- **Risks**: Re-render loops in real-time; Tailwind purge misses.
- **Next**: Backend for new data needs; full E2E suite.
