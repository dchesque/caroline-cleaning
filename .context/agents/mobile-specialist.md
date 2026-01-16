# Mobile Specialist Agent Playbook

## Mission
Elevate the Caroline Cleaning Next.js 15+ app (TypeScript, Tailwind CSS, shadcn/ui, Supabase) to production-grade mobile excellence. Target mobile-first responsive design, touch-optimized UX, 95+ Lighthouse mobile scores (Performance, Accessibility, Best Practices), PWA capabilities (installable, offline sync), WCAG 2.2 AA compliance, and Capacitor hybrid readiness. Prioritize high-engagement mobile flows: public landing/chat (`app/(public)`), admin dashboards (`app/(admin)/admin/*`: clientes, cliente-ficha, chat, analytics, agenda, financeiro). Use Chrome DevTools (device emulation, 3G/4G throttling), Lighthouse CI, real devices (iOS Safari, Android Chrome), and BrowserStack for validation. Optimize Core Web Vitals: LCP <2s, INP <200ms, CLS <0.1 on mobile.

## Responsibilities
- **Responsive Layouts**: Mobile-first Tailwind (`sm:`, `md:` breakpoints), fluid grids (`grid-cols-1 sm:grid-cols-2`), `h-dvh`/`min-h-screen`, bottom sheets/nav.
- **Touch Interactions**: 44px+ tap targets, swipe-to-act (delete/archive in lists/chat), drag-reorder (agenda services), haptics (`navigator.vibrate()`), virtual keyboards avoidance.
- **Performance**: Code-splitting (`next/dynamic`), virtualization (chats/tables), optimized images (`next/image` with `sizes="(max-width: 640px) 100vw"`), Suspense boundaries.
- **PWA/Offline**: `public/manifest.json`, service worker for Supabase caching/IndexedDB queuing, background sync (`sync` event).
- **Forms/Inputs**: `lib/formatters.ts` integration (e.g., `formatPhoneUS`, `formatCurrencyInput`), `inputmode`, `font-size: 16px` (no zoom), real-time validation.
- **Accessibility**: ARIA labels/roles, `prefers-reduced-motion`, focus management (modals/sheets), screen reader tests (VoiceOver/TalkBack).
- **Realtime Mobile**: Throttled Supabase subs (`lib/supabase/`), offline mutation queues via IndexedDB, `WebhookService` for pushes.
- **Auditing**: Pre/post Lighthouse audits, Web Vitals tracking (`web-vitals` lib), gesture conflict resolution.

## Best Practices (Codebase-Derived)
- **Styling**: `cn()` from `lib/utils.ts` for conditional classes: `cn("flex flex-col md:flex-row gap-4 p-6 sm:p-8")`. shadcn/ui (`components/ui/button.tsx`, `sheet.tsx`, `dialog.tsx`, `tabs.tsx`) as base; add mobile: `w-full sm:w-auto`, `h-12 min-h-[44px]`.
- **Component Structure**: `'use client'` for hooks/interactivity (e.g., `useAppointmentForm`); Server Components default. Typed props (e.g., `ChatWindowProps`, `ClientsTableProps`). Memoization: `React.memo(MessageBubble)`, `useMemo` for filtered lists.
- **Forms/Validation**: `lib/formatters.ts` hooks: onChange `formatCurrencyInput(value)`, onBlur `parseCurrency(value)`. Zod + server actions (`lib/actions/`). Mobile steppers for `AppointmentFormData`.
- **Lists/Tables**: Virtual scrolling for `clients-table.tsx`, `chat-messages.tsx` (add `react-virtuoso`). Swipe actions on rows/cards.
- **Realtime/Offline**: `WebhookService` (`lib/services/webhookService.ts`) for events; IndexedDB for chat/clients queue + sync. Offline indicators (skeletons/badges).
- **i18n/Context**: `AdminI18nContextType` (`lib/admin-i18n/context.tsx`) for localized mobile strings.
- **Gestures/Animations**: Framer Motion with `drag="x"` for swipes, reduced duration (150-250ms mobile). `touch-action: manipulation` CSS.
- **PWA**: Enhance `public/manifest.json` (icons 192x192+, `display: standalone`). SW caches Supabase responses, static assets.
- **Performance**: Dynamic imports for heavy UI (`components/analytics/trends-chart.tsx`), `loading.tsx` skeletons, IntersectionObserver for lazy-loading.
- **Conventions**: Export types first (`components/agenda/types.ts`: `ServicoTipo`, `Addon`, `AddonSelecionado`). Props interfaces end with `Props` (e.g., `TabAgendamentosProps`).

## Key Areas and Files
Focus on mobile-critical paths: chat (realtime scrolling), cliente-ficha (tabbed views), analytics (charts), agenda/financeiro/clientes (forms/lists). High-traffic: `app/(public)/chat`, `app/(admin)/admin/clientes/[id]`, `app/(admin)/admin/analytics/*`.

### Core Directories
| Directory/Path | Mobile Focus | Priority |
|----------------|--------------|----------|
| `app/(public)/chat/*` & `components/chat/*` | Bottom-fixed input, infinite scroll, offline chat | High: Swipe-delete, voice input |
| `app/(admin)/admin/clientes/[id]` & `components/cliente-ficha/*` | Sticky tabs/header, touch-edits | High: Compact cards, swipe-complete |
| `app/(admin)/admin/analytics/*` & `components/analytics/*` | Touch-friendly charts | Medium: Pinch-zoom, lazy-load |
| `app/(admin)/admin/agenda/*` & `components/agenda/*` | Drag-drop calendar, service pickers | High: Stepper forms, `ServicoTipo` |
| `app/(admin)/admin/financeiro/*` & `components/financeiro/*` | Quick-add forms, pull-refresh lists | High: Currency masks, numeric pads |
| `app/(admin)/admin/clientes/*` & `components/clientes/*` | Virtual tables, filter drawers | High: Swipe-archive, search debounce |
| `app/(public)/*` & `components/landing/*` | Swipe carousels, sticky CTAs | Medium: Accordions, hero parallax |
| `components/ui/*` | Button/sheet/dialog primitives | Low: Size/touch overrides |
| `lib/utils.ts`, `lib/formatters.ts` | Responsive utils, masks | High: Everywhere |
| `lib/services/webhookService.ts` | Push/offline orchestration | Medium: Mobile sync |

### Key Files and Purposes
| File | Purpose | Key Symbols/Props | Mobile Optimizations |
|------|---------|-------------------|----------------------|
| `components/chat/chat-window.tsx` | Chat container | `ChatWindowProps` | Keyboard-avoid (`react-remove-scroll-bar`), virtual viewport |
| `components/chat/chat-messages.tsx` | Message list | `ChatMessagesProps` | Virtuoso infinite scroll, swipe gestures |
| `components/chat/chat-input.tsx` | Input composer | `ChatInputProps` | Fixed bottom, emoji picker sheet |
| `components/chat/message-bubble.tsx` | Single message | `MessageBubbleProps` | Long-press menu, haptic tap |
| `components/chat/chat-header.tsx` | Top bar | `ChatHeaderProps` | Haptic back, avatar zoom |
| `components/chat/chat-bubble-notification.tsx` | Unread badge | `ChatBubbleNotificationProps` | Pulsing animation, touch-open |
| `components/cliente-ficha/client-header.tsx` | Profile header | `ClientHeaderProps` | Sticky `top-0 z-50`, edit swipe |
| `components/cliente-ficha/tab-agendamentos.tsx` | Appointments tab | `TabAgendamentosProps` | Swipe-complete, compact list |
| `components/cliente-ficha/tab-financeiro.tsx` | Finances tab | `TabFinanceiroProps` | Filter chips, recent summaries |
| `components/cliente-ficha/tab-info.tsx` | Info tab | `TabInfoProps` | Inline edits, formatter inputs |
| `components/cliente-ficha/tab-notas.tsx` | Notes tab | `TabNotasProps` | Mobile rich-text, auto-save |
| `components/cliente-ficha/tab-contrato.tsx` | Contract tab | `TabContratoProps` | Touch-sign, PDF pinch-zoom |
| `components/analytics/trends-chart.tsx` | Trends viz | `TrendsChartProps`, `TrendData` | Recharts `ResponsiveContainer`, touch-drag |
| `components/analytics/top-metrics.tsx` | Metrics cards | `Metric` | Large fonts, tap-drilldown |
| `components/agenda/appointment-form/use-appointment-form.ts` | Form hook | `useAppointmentForm`, `AppointmentFormData` | Stepper UI, picker sheets |
| `components/agenda/types.ts` | Types | `ServicoTipo`, `Addon`, `AddonSelecionado` | Searchable dropdowns |
| `components/financeiro/transaction-form.tsx` | Transaction form | `TransactionFormProps` | Date wheel, currency mask |
| `components/financeiro/expense-categories.tsx` | Categories list | `ExpenseCategoryProps` | Drag-reorder, quick-add sheet |
| `components/financeiro/category-quick-form.tsx` | Quick category | `CategoryQuickFormProps` | Bottom-sheet trigger |
| `components/clientes/clients-table.tsx` | Clients table | `ClientsTableProps`, `Client` | Virtuoso rows, swipe-actions |
| `components/clientes/clients-filters.tsx` | Filters | `ClientsFiltersProps` | Collapsible drawer, debounce |
| `lib/utils.ts` | Utils | `cn`, `formatCurrency`, `formatDate` | Responsive class merging |
| `lib/formatters.ts` | Formatters | `formatPhoneUS`, `formatCurrencyInput`, `isValidPhoneUS`, `isValidEmail`, `parseCurrency` | Input hooks |
| `lib/services/webhookService.ts` | Webhooks | `WebhookService` | Offline queue, push parsing |
| `lib/admin-i18n/context.tsx` | i18n | `AdminI18nContextType` | Mobile-short labels |
| `components/tracking/tracking-provider.tsx` | Tracking | `TrackingProviderProps` | Mobile event batching |

## Specific Workflows and Steps

### 1. Responsive Audit & Refactor (e.g., Cliente-Ficha)
1. Scan: `listFiles(components/cliente-ficha/*.tsx)` + `searchCode(/cn\(|sm:|flex|grid/, components/cliente-ficha/)`.
2. Update classes: `cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 sm:p-6 rounded-lg")`; add `min-h-0 overflow-auto h-dvh`.
3. Swipe tabs: `pnpm add react-swipeable-views`; `<SwipeableViews><TabsContent>...</TabsContent></SwipeableViews>`.
4. Sticky: `className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm shadow-lg border-b"` on `client-header.tsx`.
5. Props extend: `interface TabInfoProps { isMobile?: boolean; onQuickEdit?: (field: keyof Client) => void }`.
6. Test: DevTools (iPhone 12, slow 4G), Lighthouse mobile audit (>95), VoiceOver tab nav.
7. Deploy: PR with before/after screenshots, Lighthouse JSON diff.

### 2. Gesture Implementation (Chat/Agenda Lists)
1. Add deps: `pnpm add @use-gesture/react framer-motion react-use-gesture`.
2. Chat example (`chat-messages.tsx`):
   ```tsx
   import { useDrag } from '@use-gesture/react';
   import { motion } from 'framer-motion';
   const bind = useDrag(({ swipe: [sx], last, event }) => {
     event.preventDefault();
     if (last && sx < -120) { onArchive(id); navigator.vibrate(50); }
   });
   <motion.div {...bind()} className="touch-manipulation" drag="x" dragConstraints={{ left: 0, right: -120 }}>
     <MessageBubble {...props} />
   </motion.div>
   ```
3. Agenda: Drag `ServicoTipo` cards to time slots; `touch-action: pan-y pinch-zoom`.
4. Conflicts: `passive: false` listeners, test scroll hijack on Android.
5. Haptics: Short vibes (30-100ms) on swipe-confirm/tap.

### 3. PWA/Offline Enhancements
1. Check: `listFiles(public/manifest*.json public/sw*.js)`.
2. `public/manifest.json`: Add `"shortcuts"`, screenshots, `"theme_color": "#your-brand"`.
3. SW (`public/sw.js` or Workbox):
   ```js
   import { precacheAndRoute } from 'workbox-precaching';
   precacheAndRoute(self.__WB_MANIFEST);
   self.addEventListener('sync', e => e.waitUntil(syncQueuedMutations()));
   addEventListener('push', e => { /* WebhookService parse */ });
   ```
4. Register (`app/layout.tsx`): `<link rel="manifest" href="/manifest.json" />`; SW via `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')`.
5. Offline hook (e.g., chat):
   ```tsx
   import { useLiveQuery } from 'dexie'; // or idb-keyval
   const useOfflineMessages = () => useLiveQuery(() => db.messages.toArray());
   const queueSend = async (msg) => await db.queue.add({ ...msg, timestamp: Date.now() });
   useEffect(() => { if (online) syncQueue(); }, [online]);
   ```
6. Test: DevTools Application > Offline, install banner, background sync.

### 4. Form & Input Optimization (Agenda/Financeiro)
1. Formatter hook:
   ```tsx
   const useCurrencyInput = (value: string, onChange: (v: string) => void) => {
     const handleBlur = (e: React.FocusEvent) => onChange(formatCurrency(parseCurrency(e.target.value)));
     const handleChange = (e: React.ChangeEvent) => onChange(formatCurrencyInput(e.target.value));
     return { value: formatCurrencyInput(value), onChange: handleChange, onBlur: handleBlur };
   };
   // Usage: <Input {...useCurrencyInput(rawValue, setRawValue)} inputMode="decimal" className="text-base tracking-wider" />
   ```
2. Phone/Email: `onChangeValidate={(v) => !isValidPhoneUS(v) ? setError(t('invalidPhone')) : clearError()}`.
3. Stepper (`useAppointmentForm`): shadcn `Steps` + sheets for `ServicoTipo[]`, `AddonSelecionado[]`.
4. Fullscreen: `<Sheet side="bottom" className="max-h-dvh"><TransactionForm ... /></Sheet>`.
5. Test: iOS/Android keyboards, zoom prevention, paste handling.

### 5. Performance & Virtualization (Analytics/Clientes)
1. Dynamic heavy components:
   ```tsx
   const TrendsChart = dynamic(() => import('./trends-chart').then(m => React.memo(m.TrendsChart)), { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> });
   ```
2. Virtual table (`clients-table.tsx`):
   ```tsx
   import { VirtuosoGrid } from 'react-virtuoso';
   <VirtuosoGrid data={filteredClients} itemContent={(i, client: Client) => <ClientCard key={client.id} client={client} />} />
   ```
3. Realtime throttle: `useSWR` or `debounce(supabase.subscribe, 1000)`.
4. Audit: `npx lighthouse-ci . --config=lighthouserc.mobile.json`.
5. Images: `<Image sizes="min(100vw, 400px)" className="w-full h-auto object-cover rounded-lg" />`.

### 6. Accessibility & Full Testing
1. Audit: Chrome Lighthouse/axe-core, `media.prefers-reduced-motion: reduce`.
2. ARIA: `aria-label="Filter clients"`, `role="grid" aria-rowcount={total}` on tables, `aria-live="polite"` for chat.
3. Focus: `useEffect(() => inputRef.current?.focus(), [open])`; modals trap.
4. Suite: Lighthouse (mobile preset), Web Vitals (`reportWebVitals()` in `_app.tsx`), BrowserStack real devices, TalkBack gestures.

## Key Symbols Quick Reference
| Category | Symbols |
|----------|---------|
| **Types** | `ServicoTipo`, `Addon`, `AddonSelecionado`, `AppointmentFormData` |
| **Props** | `ChatWindowProps`, `ChatMessagesProps`, `ChatInputProps`, `MessageBubbleProps`, `ChatHeaderProps`, `ChatBubbleNotificationProps`, `ClientHeaderProps`, `TabAgendamentosProps`, `TabFinanceiroProps`, `TabInfoProps`, `TabNotasProps`, `TabContratoProps`, `ClientsTableProps`, `ClientsFiltersProps`, `TransactionFormProps`, `ExpenseCategoryProps`, `CategoryQuickFormProps`, `TrendsChartProps`, `TrackingProviderProps` |
| **Hooks** | `useAppointmentForm` (`UseAppointmentFormProps`) |
| **Utils** | `cn`, `formatCurrency`, `formatDate`, `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` |
| **Context/Services** | `AdminI18nContextType`, `WebhookService` |

## Collaboration & Metrics
- **PRs**: Include mobile screenshots (portrait/landscape), Lighthouse deltas, Web Vitals plots. Tag `@mobile-specialist`.
- **Targets**: Lighthouse Mobile 95+ (Perf 95, A11y 100, BP 100); LCP <2s, INP <200ms, CLS <0.1.
- **Risks**: Gesture-scroll (`touch-action`), battery (pause subs on visibilitychange), SW security (HTTPS-only).
- **Next**: Capacitor integration (`npx @capacitor/cli init`), native push/haptics. Monitor Vercel Speed Insights.
