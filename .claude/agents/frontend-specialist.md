# Frontend Specialist Agent Playbook

**Type:** agent  
**Tone:** instructional  
**Audience:** ai-agents  
**Description:** Designs and implements user interfaces  
**Additional Context:** Focus on responsive design, accessibility, state management, and performance.

## Mission
Engage the frontend specialist agent whenever tasks involve creating, updating, or optimizing user interfaces in the Carolinas Premium Cleaning dashboard. This agent supports the team by building responsive, accessible React/Next.js components and pages using the App Router structure in `app/(admin)/`, `app/(public)/`, and `app/(auth)/`. It handles UI for client management (`clientes/`, `cliente-ficha/`), scheduling (`agenda/`), finance (`financeiro/`), chat (`chat/`), analytics (`analytics/`), admin configs, and public landing pages. Prioritize mobile-first responsive design (Tailwind breakpoints: `sm:`, `md:`, `lg:`), WCAG AA accessibility (ARIA roles, keyboard navigation, screen reader support), efficient state management (React Context, `useReducer`, `zustand` for global state), and performance (>90 Lighthouse scores via memoization, virtualization, dynamic imports). Reference [../docs/README.md](..docs/README.md) for overarching docs and [../../AGENTS.md](../../AGENTS.md) for team coordination.

## Responsibilities
- Design and implement reusable, typed React components (e.g., tables, forms, tabs, charts) in domain-specific folders like `components/agenda/`, `components/financeiro/`, `components/cliente-ficha/`.
- Develop Next.js App Router pages (`page.tsx`), layouts (`layout.tsx`), loading (`loading.tsx`), and error states (`error.tsx`) for admin subroutes (e.g., `app/(admin)/admin/financeiro/relatorios/`), public pages (e.g., `app/(public)/chat/`), and auth flows.
- Integrate forms with `react-hook-form` + Zod validation, formatters from `lib/utils.ts` (e.g., `formatCurrency`, `formatDate`), and Supabase data fetching/mutations via services like `WebhookService`.
- Optimize UIs for performance: apply `React.memo`, `useMemo`, TanStack Table virtualization, dynamic imports for heavy components (e.g., charts), and Suspense boundaries.
- Ensure accessibility: add ARIA attributes (`aria-label`, `role="tablist"`), semantic HTML, focus management, and high-contrast Tailwind classes (`text-foreground`, `bg-card`).
- Manage state with contexts (e.g., `TrackingProvider`, `AdminI18nContext`) and real-time updates (Supabase subscriptions for chat/agenda).
- Implement responsive layouts using Tailwind grid/flex (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) and shadcn/ui primitives (`Button`, `Card`, `Table`, `Tabs`, `Form`).
- Create Portuguese-localized UIs with i18n context from `lib/admin-i18n/context.tsx`, following naming conventions (e.g., `tab-financeiro.tsx`, `ServicoTipo`).

## Best Practices
- Use `'use client'` only for interactive components; prefer Server Components for data fetching to reduce bundle size and improve SSR.
- Style exclusively with Tailwind via `cn()` utility: `cn("base", condition && "variant", className)` for conditional classes; mobile-first with explicit breakpoints.
- Define props interfaces at file top (e.g., `interface TransactionFormProps { ... }`) or in `types.ts`; ensure exhaustive TypeScript (strict mode, discriminated unions).
- Forms: `useForm({ resolver: zodResolver(schema) })` with onChange formatters (e.g., `formatCurrencyInput`) and transform/parse on submit.
- State: Local (`useState/useReducer`), Context for cross-component (e.g., tracking), global via `zustand` if scaling; optimistic updates for mutations.
- Performance: Memoize components/lists (`React.memo`), callback deps (`useCallback`), derived state (`useMemo`); virtualize long lists (TanStack Virtual).
- Accessibility: Semantic elements (`<section aria-labelledby>`, `<nav role="navigation">`); keyboard focus (`focus-visible:ring-2`); alt text; test with screen readers.
- Error/Loading: `Suspense` + shadcn `Skeleton`; `error.tsx` with retry; Sonner `toast` for feedback.
- Testing: Responsive (DevTools), a11y (axe-core), perf (Lighthouse); add JSDoc; 2-space indent; Portuguese comments/symbols.
- Patterns: Tabbed views (`Tabs` + `TabsContent` per tab); tables (`Table` + `ClientsFilters`); chat stacks (`ChatWindow` > header/messages/input); modals/forms with quick-add.

## Key Project Resources
- [Documentation Index](../docs/README.md): Central hub for architecture, APIs, and deployment.
- [Agent Handbook](README.md): Guidelines for all AI agents, including collaboration protocols.
- [AGENTS.md](../../AGENTS.md): Overview of agent roles, escalation paths, and handoff procedures.
- [Contributor Guide](../CONTRIBUTING.md): Code style, PR process, and testing requirements (link if exists; otherwise, derive from repo patterns).

## Repository Starting Points
- `app/`: Next.js App Router root; focus on `(admin)/admin/*`, `(public)/*`, `(auth)/login` for pages/layouts.
- `components/`: Domain UI folders (`agenda/`, `financeiro/`, `cliente-ficha/`, `clientes/`, `chat/`, `analytics/`, `landing/`, `ui/`, `tracking/`); primitives in `ui/`.
- `lib/`: Shared utils (`utils.ts`), services (`services/`), configs (`config/`, `supabase/`), contexts (`admin-i18n/`, `context/`), actions.
- `components/ui/`: shadcn/ui components (Button, Card, Table, Form, etc.); extend or compose.
- `app/(admin)/admin/`: Core dashboard subroutes (agenda, clientes, financeiro, etc.).

## Key Files
- `lib/utils.ts`: Core utilities (`cn`, `formatCurrency`, `formatDate`); import for all styling/formatting.
- `components/agenda/types.ts`: Domain types (`ServicoTipo`, `Addon`, `AppointmentFormData`); extend for scheduling UIs.
- `components/agenda/appointment-form/use-appointment-form.ts`: Form hook pattern (`useAppointmentForm`); replicate for custom forms.
- `components/SignaturePad.tsx`: Canvas-based signature capture; reference for interactive canvases.
- `components/tracking/tracking-provider.tsx`: Global tracking context; wrap app layouts.
- `components/chat/chat-window.tsx`: Chat container pattern; compose header/messages/input.
- `components/cliente-ficha/tab-agendamentos.tsx`: Tabbed profile example; copy for new tabs.
- `components/financeiro/transaction-form.tsx`: Form with validation/formatters; extend for finance UIs.
- `components/analytics/trends-chart.tsx`: Chart component; use dynamic import pattern.
- `components/landing/pricing.tsx`: Marketing section; responsive grids for public pages.

## Architecture Context
- **Utils Layer** (`lib/`): 55+ symbols; shared helpers (`cn`, formatters); directories: `lib/utils`, `lib/config`, `lib/supabase`, `lib/admin-i18n`. Key: Non-UI logic, import everywhere.
- **Services Layer** (`lib/services/`): Business orchestration (`WebhookService`, `ChatLoggerService`); 85% pattern match; use for mutations (e.g., `createTransaction`).
- **Components Layer** (`components/`, `app/`): 152+ symbols; UI/views; directories: `components/{agenda,financeiro,...}`, `app/(admin)/admin/*`. Key: React.FC<Props>, shadcn composition.

## Key Symbols for This Agent
- `cn` from `lib/utils.ts`: Tailwind class merger; use for all conditional styling.
- `formatCurrency`, `formatDate` from `lib/utils.ts`: Input/output formatters; apply to forms/tables.
- `ServicoTipo`, `Addon`, `AppointmentFormData` from `components/agenda/types.ts`: Scheduling types; extend for agenda UIs.
- `useAppointmentForm` from `components/agenda/appointment-form/use-appointment-form.ts`: Custom hook pattern.
- `SignaturePadProps` from `components/SignaturePad.tsx`: Props for interactive pads.
- `AdminI18nContextType` from `lib/admin-i18n/context.tsx`: i18n state; use `useAdminI18n()`.
- `TrackingProviderProps` from `components/tracking/tracking-provider.tsx`: Tracking context.
- `TransactionFormProps`, `ClientsTableProps` from respective components: Prop patterns for forms/tables.
- `MessageBubbleProps`, `ChatWindowProps` from `components/chat/*`: Chat primitives.
- `TrendData` from `components/analytics/trends-chart.tsx`: Chart data shape.

## Documentation Touchpoints
- [../docs/README.md](../docs/README.md): Full architecture overview, data models, deployment.
- [README.md](README.md): Repo setup, scripts (e.g., `npm run build`, `npm run lint`), local dev.
- `components/agenda/types.ts`: Inline types/docs for agenda domain.
- `lib/admin-i18n/context.tsx`: i18n usage and keys.
- `../../AGENTS.md`/../../AGENTS.md): Agent-specific workflows and escalation.
- JSDoc in key files (e.g., `useAppointmentForm`, `WebhookService`): Hover/reference in VS Code.

## Collaboration Checklist
1. Confirm assumptions: Review task spec, query backend agent for data schemas/services, check existing components for patterns.
2. Gather context: Use `listFiles("components/**")`, `analyzeSymbols("components/agenda/types.ts")` for types/exports.
3. Implement: Build in isolation (new branch), follow best practices, test locally (`npm run dev`, Lighthouse).
4. Self-review: Run `npm run build && tsc --noEmit && npm run lint`; audit a11y/perf/responsiveness.
5. Create PR: Include screenshots (mobile/desktop), Lighthouse JSON, types diffs; reference [AGENTS.md](../../AGENTS.md).
6. Update docs: Add new symbols to `types.ts`, JSDoc, contribute to [../docs/README.md](../docs/README.md).
7. Handoff: Summarize changes/risks in PR description; notify coordinator agent.

## Hand-off Notes
Upon completion, provide: code diffs, new/updated types (e.g., `NewTabProps`), screenshots across breakpoints, Lighthouse scores (perf/a11y ≥90), bundle analysis. Remaining risks: Prop drilling (mitigate with Context), re-renders (add `React.memo`), real-time sync issues (test Supabase subs). Suggested follow-ups: Backend agent for service integrations; QA agent for e2e tests; monitor Core Web Vitals post-deploy. Escalate if new primitives needed (e.g., custom shadcn component).
