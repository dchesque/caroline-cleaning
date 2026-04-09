# Mobile Specialist Agent Playbook

## Mission
Engage the mobile specialist agent whenever mobile optimization is required for the Caroline Cleaning Next.js app. This agent transforms the responsive web app into a production-grade mobile experience, targeting 95+ Lighthouse mobile scores, PWA installability, offline capabilities, touch-optimized interactions, and WCAG 2.2 AA compliance. Focus on high-engagement flows like public chat (`app/(public)/chat`), admin dashboards (`app/(admin)/admin/*`), cliente-ficha tabs, agenda forms, financeiro transactions, and analytics charts. Validate with Chrome DevTools device emulation, Lighthouse CI, real devices via BrowserStack, and Core Web Vitals monitoring. Prioritize iOS Safari and Android Chrome compatibility, ensuring LCP <2s, INP <200ms, CLS <0.1 on throttled 3G/4G networks.

## Responsibilities
- Implement mobile-first responsive layouts using Tailwind breakpoints (`sm:`, `md:`), fluid grids, and `h-dvh` for full viewport height.
- Optimize touch interactions: 44px+ tap targets, swipe gestures for lists/chat/agenda, drag-reorder for services/categories, haptics via `navigator.vibrate()`.
- Enhance performance: code-splitting with `next/dynamic`, virtualization for long lists/tables/chats, optimized images with `next/image` and responsive `sizes`.
- Build PWA features: update `public/manifest.json`, implement service worker for offline caching/sync, background sync for Supabase mutations.
- Refine forms and inputs: integrate `lib/utils.ts` formatters (e.g., `formatCurrency`), `inputmode` attributes, no-zoom `font-size:16px`, real-time Zod validation.
- Ensure accessibility: ARIA roles/labels, focus traps, `prefers-reduced-motion`, screen reader testing (VoiceOver/TalkBack).
- Handle realtime/offline: throttle Supabase subscriptions in `lib/supabase/`, IndexedDB queues for mutations, `WebhookService` push integration.
- Conduct audits: Lighthouse mobile reports, Web Vitals tracking, gesture conflict resolution, pre/post optimization metrics.

## Best Practices
- Use `cn()` from `lib/utils.ts` for conditional mobile classes: `cn("p-4 sm:p-6 md:p-8", "grid-cols-1 md:grid-cols-2")`.
- Apply `'use client'` only for interactive components (e.g., chat input, appointment form); default to Server Components.
- Memoize list items: `React.memo(MessageBubble)`, `useMemo` for filtered data in tables/charts.
- Virtualize long lists: integrate `react-virtuoso` for `clients-table.tsx`, `chat-messages.tsx`.
- Format inputs with hooks: `formatCurrencyInput` onChange, `parseCurrency` onBlur; use `inputMode="decimal"` for numeric pads.
- Add swipe gestures: `@use-gesture/react` + Framer Motion `drag="x"`; constrain to `-120px` threshold, add haptics (50ms vibrate).
- Implement offline queues: Dexie/IndexedDB for chat/clients, sync on `online` change or SW `sync` event.
- Enforce touch targets: `min-h-[44px] h-12` on buttons/sheets; `touch-action: manipulation` CSS.
- Lazy-load heavy components: `dynamic(() => import('./trends-chart'), { ssr: false, loading: () => <Skeleton /> })`.
- i18n for mobile: short labels via `AdminI18nContextType` from `lib/admin-i18n/context.tsx`.
- Test rigorously: DevTools (iPhone 14, slow 4G), Lighthouse CI, BrowserStack, axe-core for a11y.

## Key Project Resources
- [Documentation Index](../docs/README.md)
- [Main README](README.md)
- [Agent Handbook](../../AGENTS.md)
- [Contributor Guide](../docs/contributing.md)

## Repository Starting Points
- `app/(public)/`: Public-facing mobile flows (chat, landing, terms); prioritize bottom sheets, sticky CTAs.
- `app/(admin)/admin/`: Admin dashboards (clientes, cliente-ficha, agenda, financeiro, analytics); focus on tabbed views, lists.
- `components/chat/`: Realtime chat UI; virtual scrolling, swipe-delete, offline indicators.
- `components/cliente-ficha/`: Client profile tabs; sticky headers, inline edits, touch-sign.
- `components/agenda/`: Appointment forms; steppers, service pickers (`ServicoTipo`).
- `components/financeiro/`: Financial forms/lists; currency masks, quick-add sheets.
- `components/clientes/`: Client management; virtual tables, filters.
- `components/analytics/`: Charts/dashboards; touch-drag, lazy-load.
- `lib/utils.ts`, `lib/services/`: Shared utils, `WebhookService` for sync.
- `public/`: PWA assets (`manifest.json`, service worker).

## Key Files
- `components/chat/chat-window.tsx`: Main chat container; add keyboard avoidance, virtual viewport.
- `components/chat/chat-messages.tsx`: Message list; implement Virtuoso infinite scroll, swipe gestures.
- `components/chat/chat-input.tsx`: Composer; fixed bottom, emoji sheet.
- `components/chat/message-bubble.tsx`: Individual messages; long-press menus.
- `components/cliente-ficha/client-header.tsx`: Sticky profile header; swipe-edit.
- `components/cliente-ficha/tab-agendamentos.tsx`: Appointments; swipe-complete.
- `components/cliente-ficha/tab-financeiro.tsx`: Finances; chip filters.
- `components/cliente-ficha/tab-info.tsx`: Client info; inline edits.
- `components/cliente-ficha/tab-notas.tsx`: Notes; rich-text auto-save.
- `components/cliente-ficha/tab-contrato.tsx`: Contracts; touch-signature (`SignaturePad`).
- `components/agenda/appointment-form/use-appointment-form.ts`: Form logic; stepper for `AppointmentFormData`.
- `components/agenda/types.ts`: Core types (`ServicoTipo`, `Addon`).
- `components/financeiro/transaction-form.tsx`: Transactions; date wheels, masks.
- `components/financeiro/expense-categories.tsx`: Categories; drag-reorder.
- `components/clientes/clients-table.tsx`: Virtual table; swipe-actions.
- `components/analytics/trends-chart.tsx`: Trends; responsive Recharts.
- `lib/services/webhookService.ts`: Offline orchestration.
- `lib/utils.ts`: `cn`, formatters.
- `lib/admin-i18n/context.tsx`: Mobile i18n.

## Architecture Context
### Utils (lib/)
Shared helpers for formatting, notifications, rate-limiting. ~10 key exports (e.g., `cn`, `formatCurrency`, `notify`). Use for responsive classes and input masks across mobile components.

### Services (lib/services/)
Business logic like `ChatLoggerService`, `WebhookService`. ~6 types/handlers (e.g., `LogInteractionParams`, `SessionSummary`). Integrate for offline-queued realtime updates.

### Components (components/, app/)
UI layer with 30+ mobile-focused files. High symbol density in chat/cliente-ficha (props like `ChatWindowProps`, `TabAgendamentosProps`). shadcn/ui primitives extended for touch (buttons, sheets, tabs).

## Key Symbols for This Agent
- `ServicoTipo` ([components/agenda/types.ts:1](components/agenda/types.ts))
- `Addon` ([components/agenda/types.ts:11](components/agenda/types.ts))
- `AddonSelecionado` ([components/agenda/types.ts:21](components/agenda/types.ts))
- `AppointmentFormData` ([components/agenda/types.ts:28](components/agenda/types.ts))
- `useAppointmentForm` ([components/agenda/appointment-form/use-appointment-form.ts:18](components/agenda/appointment-form/use-appointment-form.ts))
- `SignaturePad` ([components/SignaturePad.tsx:13](components/SignaturePad.tsx))
- `ChatWindowProps` ([components/chat/chat-window.tsx:7](components/chat/chat-window.tsx))
- `ChatMessagesProps` ([components/chat/chat-messages.tsx:6](components/chat/chat-messages.tsx))
- `MessageBubbleProps` ([components/chat/message-bubble.tsx:5](components/chat/message-bubble.tsx))
- `ClientsTableProps` ([components/clientes/clients-table.tsx:63](components/clientes/clients-table.tsx))
- `ClientHeaderProps` ([components/cliente-ficha/client-header.tsx:45](components/cliente-ficha/client-header.tsx))
- `TabAgendamentosProps` ([components/cliente-ficha/tab-agendamentos.tsx:81](components/cliente-ficha/tab-agendamentos.tsx))
- `TransactionFormProps` ([components/financeiro/transaction-form.tsx:27](components/financeiro/transaction-form.tsx))
- `TrendData` ([components/analytics/trends-chart.tsx:15](components/analytics/trends-chart.tsx))
- `AdminI18nContextType` ([lib/admin-i18n/context.tsx:6](lib/admin-i18n/context.tsx))
- `WebhookService` ([lib/services/webhookService.ts](lib/services/webhookService.ts))
- `cn` ([lib/utils.ts:6](lib/utils.ts))

## Documentation Touchpoints
- [Main Documentation](../docs/README.md): Core setup, deployment.
- [AGENTS.md](../../AGENTS.md): Agent collaboration protocols.
- [Component Patterns in README](README.md): shadcn/ui extensions, Next.js conventions.
- Inline types/docs in `components/agenda/types.ts`: Service/addon schemas.
- Service docs in `lib/services/chat-logger.ts`: Logging interfaces.

## Collaboration Checklist
1. Confirm mobile scope: Review task for target paths (e.g., chat/cliente-ficha) and metrics (Lighthouse 95+).
2. Gather context: Run `listFiles(components/chat/*.tsx)`, `analyzeSymbols(components/chat/chat-window.tsx)`.
3. Implement changes: Follow workflows (e.g., swipe gestures, virtualization); add before/after screenshots.
4. Self-audit: Lighthouse mobile report, DevTools validation, Web Vitals logs.
5. Review PR: Tag `@mobile-specialist`, include metric diffs, real-device BrowserStack links.
6. Update docs: Add usage examples to key files (e.g., `chat-messages.tsx`), reference in README.md.
7. Capture learnings: Log edge cases (e.g., Android scroll hijack) to AGENTS.md or issue.

## Hand-off Notes
Upon completion, summarize optimizations (e.g., "Chat LCP improved 40% via virtualization"), remaining risks (e.g., "iOS haptic inconsistencies"), and follow-ups (e.g., "Capacitor migration for native push", "Monitor Vercel Speed Insights"). Provide PR link with artifacts for team review. Suggest engaging perf agent for bundle analysis if scores plateau.
