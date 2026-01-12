# Mobile Specialist Agent Playbook

## Mission
The Mobile Specialist Agent optimizes the Carolinas Premium Next.js application (TypeScript, Tailwind CSS, shadcn/ui) for superior mobile experiences. Focus on responsive layouts, touch interactions, performance for low-bandwidth/mobile hardware, PWA features (manifest, service worker, offline caching), accessibility (a11y), and hybrid app readiness (e.g., Capacitor). Prioritize high-traffic mobile areas: public chat, admin dashboard (clientes ficha, analytics, agenda, financeiro), and landing pages. Use tools like Lighthouse, Chrome DevTools (Device Mode, throttling), and real-device testing for audits.

## Responsibilities
- Implement/enhance responsive design with Tailwind mobile-first breakpoints (`sm:`, `md:`) in `app/` routes and `components/`.
- Optimize loading/performance: dynamic imports, Next.js Image, code splitting for mobile data/battery constraints.
- Build PWA: `public/manifest.json`, service worker for caching Supabase queries, web push via VAPID/Supabase Realtime.
- Add mobile UX: swipe gestures (chat messages, agenda views), haptic feedback (Vibration API), bottom sheets (`<Sheet>` from shadcn), virtualized lists (`react-window` for long chats/client lists).
- Ensure offline support: IndexedDB for chat history/client data, sync with `lib/supabase/`.
- Audit accessibility/performance: Lighthouse >90 (mobile preset), touch targets ≥48px, reduced motion.
- Test: Emulate Slow 3G/4G, real iOS/Android via BrowserStack/Xcode Simulator.

## Best Practices (Derived from Codebase)
- **Responsive Design**: Mobile-first Tailwind (`cn` from `lib/utils.ts` for conditional classes). shadcn/ui primitives (`components/ui/`) are responsive by default; extend with `sm:flex-row md:grid-cols-3`. Examples: `components/chat/chat-window.tsx` (bottom-fixed input), `components/cliente-ficha/tab-*.tsx` (swipeable tabs).
- **Performance**: Dynamic imports for charts (`components/analytics/trends-chart.tsx`), `useMemo`/`useCallback` in hooks. Next.js Server Components default; `'use client'` only for interactivity. Minimize re-renders in lists (e.g., `components/chat/chat-messages.tsx`).
- **Touch UX**: Bottom nav/actions (chat input, quick-actions). Swipe for delete/archive (agenda `week-view.tsx`, chat bubbles). Use Framer Motion for smooth animations (reduce on `prefers-reduced-motion`).
- **Forms/Inputs**: `lib/formatters.ts` (formatPhoneUS, formatCurrencyInput, isValidPhoneUS/isValidEmail) for mobile keyboards. Currency/phone masks prevent zoom.
- **Offline/Push**: Cache with Service Worker (Supabase responses via `lib/supabase/`). Webhooks (`lib/services/webhookService.ts`) for push payloads.
- **Conventions**: Typed props interfaces (e.g., `ChatWindowProps`, `TrendsChartProps`). Export components/functions. Server Actions (`lib/actions/`) for mobile-safe mutations.
- **PWA**: Icons in `public/` (192x192, 512x512). Register SW in `app/layout.tsx`. Standalone display, theme_color matching brand.
- **Testing**: Lighthouse CI (`npx @lhci/cli`), real-device via Chrome Remote Debugging. Check battery drain (reduce polling in Realtime subs).

## Key Areas and Files
Focus on mobile-heavy zones: `app/(public)/chat`, `app/(admin)/admin/*` (dynamic `[id]` routes), `components/chat/`, `components/cliente-ficha/`, `components/analytics/`, `components/agenda/`, `components/financeiro/`.

### Core Directories
| Directory | Focus | Mobile Priority |
|-----------|--------|-----------------|
| `app/(public)/chat/` | Standalone chat page | Bottom input, infinite scroll, offline messages. |
| `app/(admin)/admin/clientes/[id]/` | Client ficha tabs | Swipe tabs, sticky header (`client-header.tsx`). |
| `app/(admin)/admin/analytics/` | Dashboards/charts | Pinch-zoom charts, responsive legends. |
| `app/(admin)/admin/agenda/` | Calendars | Swipe week/month views, touch event creation. |
| `app/(admin)/admin/financeiro/` | Transactions/expenses | Mobile forms (`transaction-form.tsx`), recent lists. |
| `components/chat/` | Reusable chat UI | Typing indicators, bubble notifications, gestures. |
| `components/ui/` | shadcn primitives | Sheets/modals for mobile drawers. |
| `lib/utils.ts` & `lib/formatters.ts` | Styling/input helpers | `cn()`, phone/currency formatters. |
| `lib/services/` | Business logic | `WebhookService` for mobile notifications. |

### Key Files and Purposes
| File | Purpose | Props/Symbols | Mobile Optimizations |
|------|---------|---------------|----------------------|
| `components/chat/chat-window.tsx` | Full chat container | `ChatWindowProps` | Virtualized messages, swipe-to-reply, keyboard avoidance. |
| `components/chat/chat-messages.tsx` | Message list | `ChatMessagesProps` | Infinite scroll, unread bubbles. |
| `components/chat/chat-input.tsx` | Composer bar | `ChatInputProps` | Emoji/voice, fixed bottom, formatters integration. |
| `components/chat/chat-header.tsx` | Chat top bar | `ChatHeaderProps` | Back button, typing indicator. |
| `components/chat/message-bubble.tsx` | Individual message | `MessageBubbleProps` | Long-press menu, swipe delete. |
| `components/chat/chat-bubble-notification.tsx` | Unread notifier | `ChatBubbleNotificationProps` | FAB-style for mobile home. |
| `components/cliente-ficha/client-header.tsx` | Client profile | `ClientHeaderProps` | Sticky scroll, tap actions. |
| `components/cliente-ficha/tab-agendamentos.tsx` | Appointments tab | `TabAgendamentosProps` | Swipe carousel on mobile. |
| `components/cliente-ficha/tab-financeiro.tsx` | Finances tab | `TabFinanceiroProps` | Compact transactions. |
| `components/analytics/trends-chart.tsx` | Revenue trends | `TrendsChartProps` | Responsive Recharts, touch pan/zoom. |
| `components/analytics/top-metrics.tsx` | KPI cards | `Metric` | 1-col mobile grid. |
| `components/agenda/week-view.tsx` | Weekly calendar | `WeekViewProps` | Horizontal swipe days. |
| `components/financeiro/transaction-form.tsx` | Add/edit transaction | `TransactionFormProps` | Currency formatter, mobile keyboard. |
| `components/financeiro/recent-transactions.tsx` | Transaction list | `RecentTransactions` | Pull-to-refresh. |
| `lib/utils.ts` | Tailwind helpers | `cn`, `formatCurrency` | Conditional responsive classes. |
| `lib/services/webhookService.ts` | Webhook handler | `WebhookService` | Push notification processing. |

## Specific Workflows and Steps

### 1. Responsive Audit & Fix (e.g., Client Ficha Page)
1. `getFileStructure(app/(admin)/admin/clientes/[id]/)` & `readFile(components/cliente-ficha/tab-*.tsx)`.
2. `searchCode(/className=|"cn"|sm:|md:/)` to audit Tailwind.
3. Add mobile classes: `className={cn("flex-col sm:flex-row")}`.
4. Use `<Sheet>` for tabs/modals on small screens.
5. Dynamic import charts: `const TrendsChart = dynamic(() => import('components/analytics/trends-chart'), { ssr: false });`.
6. Test: DevTools Device Mode (iPhone), Lighthouse mobile audit.
7. Update props (e.g., add `isMobile?: boolean` to `TabAgendamentosProps`).

### 2. Implement PWA (Manifest + SW)
1. `listFiles(public/*.json)` – Create/update `public/manifest.json`:
   ```json
   {
     "name": "Carolinas Premium",
     "short_name": "Carolinas",
     "start_url": "/",
     "display": "standalone",
     "theme_color": "#000",
     "background_color": "#fff",
     "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"}]
   }
   ```
2. Create `public/sw.js`: Cache `/api/*`, images, fonts; precache `app/(public)/chat/page.tsx`.
3. In `app/layout.tsx`: Add `<link rel="manifest" href="/manifest.json">` & SW script:
   ```tsx
   useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js'); }, []);
   ```
4. Test: DevTools > Application > Manifest/Service Workers > Installable.

### 3. Add Swipe Gestures (e.g., Chat Messages)
1. Install `react-use-gesture` (if absent: `pnpm add react-use-gesture`).
2. In `components/chat/chat-messages.tsx`: Wrap `<div data-gesture>` with `useGesture({ onDrag: ({ swipe }) => { if (swipe[0] > 0) archiveMessage(); } })`.
3. Animate with Framer Motion: `<motion.div drag="x" whileDrag={{ scale: 0.95 }} />`.
4. Extend `ChatMessagesProps`: `onSwipe?: (direction: 'left'|'right', id: string) => void`.
5. Test: Touch emulation, prevent scroll conflicts.

### 4. Offline Chat Sync
1. `readFile(lib/supabase/client.ts)` – Extend with offline queue.
2. Hook: `useSupabaseSubscription` + IndexedDB (idb-keyval) for messages/clients.
3. Cache: SW precache `app/api/chat/route.ts`.
4. Queue mutations: Store in IndexedDB, sync on reconnect (`navigator.onLine`).
5. UI: Skeleton (`components/ui/skeleton.tsx`) + offline badge.

### 5. Performance Optimization (Analytics/Dashboard)
1. `analyzeSymbols(components/analytics/trends-chart.tsx)` – Memoize `TrendData`.
2. `searchCode(/Suspense|dynamic|Image/)` – Add to heavy components.
3. Reduce polls: Throttle Realtime subs (500ms mobile).
4. Lighthouse: `npx lighthouse app/(admin)/admin/analytics/page --preset=mobile --output=html`.
5. Fix: `next/link prefetch={false}`, virtualize lists.

### 6. Mobile Form Enhancements (Financeiro)
1. Integrate `lib/formatters.ts`: `<Input onChange={formatCurrencyInput} />`.
2. Add `inputmode="tel" pattern="[0-9]*"` for phone/currency.
3. Validation: `isValidPhoneUS`, `isValidEmail` on blur.

## Key Symbols for Quick Reference
- **Props**: `ChatWindowProps`, `ChatInputProps`, `ClientHeaderProps`, `TrendsChartProps`, `WeekViewProps`, `TransactionFormProps`.
- **Utils**: `cn` (`lib/utils.ts`), `formatPhoneUS`, `formatCurrencyInput` (`lib/formatters.ts`).
- **Services**: `WebhookService` (`lib/services/webhookService.ts`).
- **Types**: `MessageBubbleProps`, `TabAgendamentosProps`, `TrendData`.

## Collaboration & Documentation
- Update `docs/mobile-optimization.md` with before/after Lighthouse scores.
- PR checklist: Mobile screenshots, Lighthouse JSON, real-device video.
- Risks: SW caching auth tokens (use runtime caching), gesture scroll conflicts.
- Hand-off: List optimized files, metrics (e.g., FCP <2s mobile), follow-ups (Capacitor POC).
