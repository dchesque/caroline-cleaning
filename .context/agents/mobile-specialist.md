# Mobile Specialist Agent Playbook

## Mission
Specialize in elevating the Carolinas Premium Next.js 15+ app (TypeScript, Tailwind CSS, shadcn/ui, Supabase) to world-class mobile experiences. Focus on responsive design (mobile-first), touch-optimized interactions, performance (Lighthouse mobile >95), PWA features (installable, offline-first), accessibility (WCAG 2.2 AA), and hybrid app readiness (Capacitor). Prioritize high-traffic mobile paths: public landing/chat (`app/(public)`), admin dashboards (clientes, cliente-ficha, analytics, agenda, financeiro). Use tools like Chrome DevTools (device emulation, throttled 3G/4G), Lighthouse CI, WebPageTest, and real devices (iPhone Safari, Android Chrome/Samsung Internet). Track Web Vitals: LCP <2s, FID <100ms, CLS <0.1 on mobile.

## Responsibilities
- **Responsive Design**: Mobile-first Tailwind breakpoints (`sm:`, `md:`, `lg:`), vertical stacking, viewport-safe units (`h-screen`, `min-h-dvh`), bottom navigation/sheets.
- **Touch & Gestures**: 48dp+ tap targets, swipe actions (delete/archive), drag-to-reorder (agenda/services), haptics (`navigator.vibrate`), keyboard avoidance.
- **Performance**: Lazy-load heavy components (`next/dynamic`), virtual scrolling (chats/tables), image optimization (`next/image` with `sizes`), Suspense/Streaming.
- **PWA/Offline**: Manifest, service worker (caching Supabase, IndexedDB sync), background sync for chat/mutations.
- **Forms & Inputs**: Masks/formatters (`lib/formatters.ts`), `inputmode="tel|numeric"`, no-zoom (`font-size: 16px` min), validation feedback.
- **Accessibility**: Semantic elements, ARIA roles, screen reader testing (VoiceOver/TalkBack), `prefers-reduced-motion`, focus traps in modals.
- **Realtime Mobile**: Supabase subscriptions with mobile throttling, offline queuing via `idb`, push notifications via `WebhookService`.
- **Testing/Auditing**: Emulated devices, real-device farms (BrowserStack), Lighthouse audits pre/post, Core Web Vitals integration.

## Best Practices (Codebase-Derived)
- **Styling Conventions**: `cn()` utility (`lib/utils.ts`) for responsive classes: `cn("flex flex-col lg:flex-row gap-2 sm:gap-4")`. shadcn/ui primitives (`components/ui/button.tsx`, `sheet.tsx`, `dialog.tsx`, `tabs.tsx`) are baseline responsive; extend with `sticky top-0 z-50 backdrop-blur-sm`.
- **Component Patterns**: Typed props/interfaces (e.g., `ChatWindowProps`, `TabAgendamentosProps`). `'use client'` only for interactivity; prefer Server Components. Memoize renders: `React.memo` for `MessageBubble`, `useMemo` for lists/filters.
- **Forms & Validation**: Leverage `lib/formatters.ts` (`formatPhoneUS`, `formatCurrencyInput`, `isValidPhoneUS`, `isValidEmail`, `parseCurrency`). On-blur formatting, server actions (`lib/actions/`), Zod schemas in hooks like `useAppointmentForm`.
- **Lists & Tables**: Virtualize (`react-virtuoso` or `react-window`) for `clients-table.tsx`, `chat-messages.tsx`. Swipe rows for actions (e.g., archive client/appointment).
- **Realtime/Offline**: Supabase in `lib/supabase/`; queue in IndexedDB, sync via `WebhookService` (`lib/services/webhookService.ts`). Offline badges/skeletons.
- **i18n & Context**: `lib/admin-i18n/context.tsx` (`AdminI18nContextType`) for admin mobile labels.
- **Animations/Gestures**: Framer Motion (`@framer-motion`) with reduced mobile duration (0.2s), swipe via `react-use-gesture`. Haptics on confirmations.
- **PWA Setup**: `public/manifest.json` (theme_color from brand, 192x192+ icons, `display: standalone`). Service worker caches static/API.
- **Performance Patterns**: Dynamic imports for charts (`components/analytics/trends-chart.tsx`), `loading.tsx` skeletons, `IntersectionObserver` for lazy lists.

## Key Areas and Files
Focus on mobile hotspots: chat (scrolling/input), cliente-ficha (tabs/headers), analytics (charts), agenda (forms/calendar), financeiro/clientes (lists/forms). Use `getFileStructure(app/(admin))` and `searchCode(/mobile|sm:|sheet|swipe/)` for audits.

### Core Directories
| Directory/Path | Mobile Focus | Priority Tasks |
|----------------|--------------|---------------|
| `app/(public)/chat` & `components/chat/` | Infinite scroll, bottom input, offline | Virtualize messages, swipe-delete, voice/emoji. |
| `app/(admin)/admin/clientes/[id]` & `components/cliente-ficha/` | Tabbed profile, sticky elements | Swipe tabs, compact `client-header.tsx`, touch-edit fields. |
| `app/(admin)/admin/analytics/` & `components/analytics/` | Responsive charts/metrics | Touch pan/zoom (`TrendData`), lazy-load. |
| `app/(admin)/admin/agenda/` & `components/agenda/` | Calendar/forms | Drag events, `useAppointmentForm` stepper, `ServicoTipo` selectors. |
| `app/(admin)/admin/financeiro/` & `components/financeiro/` | Forms/lists | Pull-to-refresh, currency masks, quick-add. |
| `app/(admin)/admin/clientes/` & `components/clientes/` | Tables/filters/modals | Searchable/virtual table, fullscreen edit modal. |
| `app/(public)` & `components/landing/` | Hero/FAQ/pricing | Swipe carousels, accordions, sticky CTAs. |
| `components/ui/` | Primitives | Large buttons, mobile sheets/drawers. |
| `lib/utils.ts`, `lib/formatters.ts` | Shared helpers | Responsive utils, input masks. |
| `lib/services/` | Orchestration | Webhook push/offline sync. |

### Key Files and Purposes
| File | Purpose | Key Symbols/Props | Mobile Optimizations Needed |
|------|---------|-------------------|-----------------------------|
| `components/chat/chat-window.tsx` | Full chat UI container | `ChatWindowProps` | Keyboard-avoid view (`react-remove-scroll`), virtual height. |
| `components/chat/chat-messages.tsx` | Scrollable messages | `ChatMessagesProps` | Infinite scroll up, swipe left/right actions. |
| `components/chat/chat-input.tsx` | Composer/input | `ChatInputProps` | Fixed bottom, auto-focus, emoji/attach swipe. |
| `components/chat/message-bubble.tsx` | Individual message | `MessageBubbleProps` | Long-press context menu, read receipts. |
| `components/chat/chat-header.tsx` | Chat top bar | `ChatHeaderProps` | Back button haptic, avatar tap. |
| `components/cliente-ficha/client-header.tsx` | Client profile summary | `ClientHeaderProps` | Sticky scroll, edit chevron touch. |
| `components/cliente-ficha/tab-agendamentos.tsx` | Appointments list | `TabAgendamentosProps` | Compact cards, swipe-complete. |
| `components/cliente-ficha/tab-financeiro.tsx` | Transaction history | `TabFinanceiroProps` | Recent summaries, filter dropdowns. |
| `components/cliente-ficha/tab-info.tsx` | Client details | `TabInfoProps` | Inline edits, phone/email formatters. |
| `components/cliente-ficha/tab-notas.tsx` | Notes tab | `TabNotasProps` | Rich text mobile, timestamp format. |
| `components/cliente-ficha/tab-contrato.tsx` | Contract view | `TabContratoProps` | PDF embed zoom, sign touch. |
| `components/analytics/trends-chart.tsx` | Trend visualizations | `TrendData` | Recharts responsive, pinch-zoom. |
| `components/agenda/appointment-form/use-appointment-form.ts` | Form logic | `useAppointmentForm`, `AppointmentFormData` | Multi-step mobile, `ServicoTipo/Addon` pickers. |
| `components/agenda/types.ts` | Shared types | `ServicoTipo`, `Addon`, `AddonSelecionado` | Dropdowns with search. |
| `components/financeiro/transaction-form.tsx` | Add/edit transaction | `TransactionFormProps` | Numeric input, date wheel picker. |
| `components/financeiro/expense-categories.tsx` | Category list | `ExpenseCategoryProps` | Drag-reorder, quick form. |
| `components/financeiro/category-quick-form.tsx` | Fast category add | `CategoryQuickFormProps` | Bottom sheet trigger. |
| `components/clientes/clients-table.tsx` | Client listing | `ClientsTableProps`, `Client` | Virtual rows, swipe-actions, sticky filters. |
| `components/clientes/clients-filters.tsx` | Search/filters | `ClientsFiltersProps` | Collapsible mobile, debounce search. |
| `components/clientes/edit-client-modal.tsx` | Client editor | `EditClientModalProps`, `ServicoTipo`, `Addon`, `DiaServico` | Fullscreen sheet, validation. |
| `lib/utils.ts` | Class merging, formatters | `cn`, `formatCurrency`, `formatDate` | Responsive flex/grid helpers. |
| `lib/formatters.ts` | Input sanitizers | `formatPhoneUS`, `formatCurrencyInput`, `isValidPhoneUS`, `isValidEmail` | On-blur hooks. |
| `lib/services/webhookService.ts` | Event handling | `WebhookService` | Mobile push parsing, offline queue. |
| `lib/admin-i18n/context.tsx` | Admin translations | `AdminI18nContextType` | Compact labels. |

## Specific Workflows and Steps

### 1. Mobile-Responsive Audit & Fix (e.g., Cliente-Ficha Tabs)
1. Gather: `listFiles(components/cliente-ficha/*.tsx)` + `searchCode(/flex|grid|sm:|cn\(/, components/cliente-ficha/)`.
2. Refactor classes: `cn("grid grid-cols-1 md:grid-cols-2 gap-4 p-4")`; add `overflow-auto h-dvh`.
3. Implement swipe tabs: `pnpm add react-swipeable-views`; wrap shadcn `Tabs`.
4. Sticky elements: `className="sticky top-0 z-50 bg-background shadow-sm"` on `client-header.tsx`.
5. Extend props: `interface TabAgendamentosProps { compact?: boolean; onSwipe?: (id: string) => void }`.
6. Test: DevTools > iPhone SE (slow 4G), Lighthouse >95, VoiceOver navigation.
7. Commit: Before/after screenshots.

### 2. Touch Gestures Implementation (Chat Messages/Agenda)
1. Install: `pnpm add @use-gesture/react framer-motion`.
2. In `chat-messages.tsx`: 
   ```tsx
   import { useDrag } from '@use-gesture/react';
   const bind = useDrag(({ swipe: [sx], last }) => {
     if (last && sx > 100) onDelete(id); navigator.vibrate(30);
   });
   <motion.div {...bind()} drag="x" dragConstraints={{ left: 0, right: 100 }}>
   ```
3. Agenda: Drag `ServicoTipo` to slots in calendar view.
4. Conflicts: `touch-action: pan-y` CSS, pointer-events.
5. Test: Android Chrome gestures, prevent scroll hijack.

### 3. PWA & Offline Setup
1. Verify: `listFiles(public/manifest.json public/sw*.js)`.
2. Enhance `public/manifest.json`: Add `categories: ["business"]`, brand icons/screenshots.
3. Service Worker (`public/sw.js`):
   ```js
   const CACHE = 'v1';
   self.addEventListener('install', e => e.waitUntil(caches.open(CACHE)));
   self.addEventListener('fetch', e => {
     e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => caches.open(CACHE).then(c => c.put(e.request, res.clone())))));
   });
   self.addEventListener('sync', e => e.waitUntil(syncOfflineData()));
   ```
4. Register: In root `layout.tsx` – `<link rel="manifest" href="/manifest.json" />` + SW script.
5. IndexedDB Hook (chat/clients):
   ```tsx
   import { get, set } from 'idb-keyval';
   const useOfflineChat = () => {
     const [data, setData] = useState([]);
     useEffect(() => { get('chat').then(setData); }, []);
     const queueMutation = async (msg) => { const offline = await get('queue') || []; set('queue', [...offline, msg]); };
   };
   ```
6. Test: DevTools > Application > Offline mode, install prompt.

### 4. Form Optimization (Agenda/Financeiro/Clientes)
1. Integrate formatters: 
   ```tsx
   <Input
     value={formatCurrencyInput(value)}
     onBlur={e => setValue(formatCurrency(parseCurrency(e.target.value)))}
     inputMode="decimal"
     type="text"
     className="text-lg" // Prevent zoom
   />
   ```
2. Validation: `onChange={e => if (!isValidPhoneUS(e.target.value)) setError('Invalid')}`.
3. Stepper for `useAppointmentForm`: shadcn Steps + `ServicoTipo[]`, `AddonSelecionado[]`.
4. Fullscreen modals: `Sheet` variant="full` for `edit-client-modal.tsx`.
5. Test: iOS numeric keyboard, auto-correct off.

### 5. Performance Boost (Analytics/Lists)
1. Dynamic: `const TrendsChart = dynamic(() => import('./trends-chart').then(mod => mod.TrendsChart), { ssr: false, loading: () => <Skeleton /> });`.
2. Virtualize `clients-table.tsx`:
   ```tsx
   import { Virtuoso } from 'react-virtuoso';
   <Virtuoso data={clients} itemContent={(i, client) => <ClientRow client={client} />} />
   ```
3. Throttle realtime: `useEffect(() => { const sub = supabase.channel().subscribe(debounce(handleUpdate, 500)); return () => sub.unsubscribe(); }, []);`.
4. Audit: `npx @lhci/cli autorun --preset=mobile --urls=/admin/analytics`.
5. Images: `<Image src={...} sizes="100vw" style={{ width: '100%', height: 'auto' }} />`.

### 6. Accessibility & Testing Workflow
1. Audit: `axe DevTools` + `prefers-reduced-motion: reduce`.
2. ARIA: `role="tablist"`, `aria-label="Chat input"`, `aria-invalid` on errors.
3. Focus: `autoFocus` on modals, `trapFocus` in sheets.
4. Full suite: Lighthouse (perf/a11y), Web Vitals (`web-vitals` npm), real-device via Expo Go/Capacitor preview.

## Key Symbols Quick Reference
| Category | Symbols |
|----------|---------|
| **Types/Props** | `AppointmentFormData`, `ServicoTipo`, `Addon`, `AddonSelecionado`, `ChatWindowProps`, `ChatMessagesProps`, `ChatInputProps`, `MessageBubbleProps`, `ClientHeaderProps`, `TabAgendamentosProps`, `TabFinanceiroProps`, `TabInfoProps`, `TabNotasProps`, `TabContratoProps`, `ClientsTableProps`, `ClientsFiltersProps`, `EditClientModalProps`, `TransactionFormProps`, `ExpenseCategoryProps`, `CategoryQuickFormProps`, `TrendData`, `AdminI18nContextType` |
| **Hooks** | `useAppointmentForm` (`UseAppointmentFormProps`) |
| **Utils** | `cn`, `formatCurrency`, `formatDate`, `formatPhoneUS`, `unformatPhone`, `isValidPhoneUS`, `isValidEmail`, `formatCurrencyUSD`, `formatCurrencyInput`, `parseCurrency` |
| **Services** | `WebhookService` |

## Collaboration Notes
- **Docs/PRs**: Embed Lighthouse JSON, mobile screenshots (iOS/Android portrait/landscape), delta metrics. Tag `@mobile-specialist`.
- **Metrics Targets**: Mobile Lighthouse 95+ (Perf/A11y/BP), FCP <1.2s, LCP <2s, TTI <3s.
- **Risks/Mitigations**: Gesture-scroll conflicts (`passive: false`), SW auth (runtime cache), battery drain (throttle subs).
- **Next Steps**: Capacitor POC (`npx cap init`), native haptics/push. Monitor via Vercel Analytics.
