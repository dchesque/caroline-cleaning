# Before & After Section — Design Spec

**Date:** 2026-04-22
**Status:** Approved (pending implementation plan)
**Author:** Driano (with Claude)

## Summary

Add a "Before & After" showcase section to the public landing page. Each item is a card displaying two photos (before/after) with a draggable vertical divider that reveals one image over the other. The landing shows a carousel with 2 cards visible on desktop, responsive down to 1 on mobile. An admin module under `/admin/before-after` supports basic CRUD (title, two images, display order, active toggle).

## Motivation

The current landing has textual and testimonial proof (TrustBadges, AboutUs, Testimonials) but no visual proof of service quality. Before/after images are strong conversion signals for cleaning services — prospects want to see the transformation. Grouping this section with other credibility blocks (between AboutUs and Testimonials) reinforces social proof.

## Scope

### In scope
- Public landing section with carousel (2 slides desktop / 1.5 tablet / 1 mobile) and custom drag-to-reveal before/after slider per card.
- Admin CRUD module following the existing Clientes pattern (list page + modal).
- Supabase table `before_after` + dedicated storage bucket `before-after`.
- Sidebar navigation entry with i18n (pt-BR / en-US).

### Out of scope
- Drag-and-drop reordering in admin (manual integer `ordem` field).
- Filtering/grouping by service type.
- Long descriptions per item.
- Lightbox / fullscreen view.
- Auto-animation of the slider.
- Aspect-ratio validation on upload (visual guidance only, `object-cover` handles mismatch).
- Automated tests (project has none).

## Architecture

```
┌────────────────────────── Landing (public) ──────────────────────────┐
│  app/(public)/page.tsx                                               │
│    ...                                                               │
│    <AboutUs />                                                       │
│    <BeforeAfter />   ← NEW (server comp fetches active items)        │
│    <Testimonials />                                                  │
│                                                                      │
│  components/landing/before-after.tsx          (server)               │
│    └─ components/landing/before-after-carousel.tsx  (client, embla)  │
│         └─ components/landing/before-after-slider.tsx (client, card) │
└──────────────────────────────────────────────────────────────────────┘

┌────────────────────────── Admin ─────────────────────────────────────┐
│  app/(admin)/admin/before-after/page.tsx  (client, list view)        │
│  components/before-after/                                            │
│    ├─ before-after-table.tsx                                         │
│    └─ before-after-modal.tsx                                         │
│  components/admin/sidebar.tsx  ← new nav entry                       │
│  lib/admin-i18n/translations.ts ← new strings                        │
└──────────────────────────────────────────────────────────────────────┘

┌────────────────────────── Data ──────────────────────────────────────┐
│  Supabase                                                            │
│    Table: before_after                                               │
│    Bucket: before-after (public, cached)                             │
│    RLS: public read when ativo=true; writes via service role         │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Model

### Table: `before_after`

```sql
create table public.before_after (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  imagem_antes  text not null,       -- public URL (storage)
  imagem_depois text not null,       -- public URL (storage)
  ordem         int  not null default 0,
  ativo         bool not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index before_after_active_order_idx
  on public.before_after (ativo, ordem);

alter table public.before_after enable row level security;

-- Public can read active items only
create policy "before_after public read active"
  on public.before_after for select
  using (ativo = true);

-- No public write policies — admin writes go through service role
```

Trigger `updated_at` follows the project convention used in existing migrations.

### Storage bucket: `before-after`

- Public read (`public = true`).
- Write via service role only.
- Path convention: `{item_id}/antes.{ext}` and `{item_id}/depois.{ext}`.
- On delete of a row, also remove the `{item_id}/` prefix from the bucket.

### Types

Regenerate `types/supabase.ts` via `npm run db:generate`. Domain type:

```ts
// types/before-after.ts
export interface BeforeAfterItem {
  id: string;
  titulo: string;
  imagem_antes: string;
  imagem_depois: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}
```

## Admin Module

### Route
`app/(admin)/admin/before-after/page.tsx` — client component following the Clientes pattern.

### Sidebar entry
Add to `components/admin/sidebar.tsx` `navigation[]`:
```ts
{ key: 'beforeAfter', href: '/admin/before-after', icon: ImageIcon }
```
Positioned between `servicos` and another content-management entry (final placement to be decided during implementation, close to `servicos`).

### Listagem (`before-after/page.tsx`)
- Fetches `select *` from `before_after` ordered by `ordem asc, created_at desc`.
- Renders `<BeforeAfterTable>` with columns: thumb antes | thumb depois | título | ordem | ativo (switch inline) | ações.
- "Novo" button opens `<BeforeAfterModal>` in create mode.
- Row click or edit icon opens the modal in edit mode.
- Delete confirmation uses the existing confirm dialog pattern.

### `BeforeAfterModal`
- Shadcn `Dialog` + `Form`.
- Fields:
  - `titulo` (Input, required, max 120 chars).
  - `ordem` (Input type number, default 0).
  - `ativo` (Switch, default true).
  - `imagem_antes` (custom ImageUpload with preview).
  - `imagem_depois` (custom ImageUpload with preview).
- Helper text under uploads: "Use images with the same aspect ratio for best results."
- Upload flow:
  1. On file select, upload to `before-after/{tempId}/antes.{ext}` (generate `tempId` for create, use row `id` for edit).
  2. Obtain public URL via `getPublicUrl`.
  3. On "Save", `upsert` the row with both URLs.
  4. On create, after DB insert succeeds, if path used `tempId`, move files to final `{id}/...` path (or just keep `tempId` as the permanent id — simpler: pre-generate `id = uuid()` client-side so upload path matches from the start).
- Delete flow: delete DB row, then `storage.remove()` on the two file paths; if storage delete fails, log but don't block UI.
- Max file size: 5 MB per image (enforced client-side before upload).

### i18n
Add to `lib/admin-i18n/translations.ts` under existing structure:
- `sidebar.beforeAfter` → "Antes e Depois" / "Before & After"
- `beforeAfter.*` block for: title, newItem, editItem, titleField, orderField, activeField, imageBefore, imageAfter, imageHint, deleteConfirm, saveSuccess, deleteSuccess, etc.

## Landing Section

### `components/landing/before-after.tsx` (server component)
- Fetches active items from Supabase server-side:
  ```ts
  const { data } = await supabase
    .from('before_after')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });
  ```
- If `data.length === 0`, returns `null` (section hidden).
- Renders section wrapper (heading + subheading, hardcoded English to match landing convention) and passes items to the client carousel.

### `components/landing/before-after-carousel.tsx` (client)
- Uses `embla-carousel-react` with:
  - `align: 'start'`
  - `slidesToScroll: 1`
  - `loop: false`
  - Responsive slides-per-view via the Embla Tailwind/CSS approach: each slide has `flex: 0 0 100%` on mobile, `0 0 66.66%` on md (tablet, 1.5 visible peek), `0 0 50%` on lg+ (2 visible).
- Prev/next buttons (shadcn-style), hidden on mobile, keyboard accessible.
- Dot indicators below the carousel.

### `components/landing/before-after-slider.tsx` (client, the card)
Custom pointer-drag comparison component (~80 LOC):
- Container `relative` with `aspect-[4/3]`, rounded, overflow-hidden.
- `<img>` "depois" is the base layer (full).
- `<img>` "antes" is overlaid, clipped via inline style `clipPath: inset(0 ${100-position}% 0 0)`.
- Vertical handle at `left: ${position}%` with a grabbable circle in the middle and a 2px white line.
- State: `position` (0–100), default 50.
- Pointer events on the handle (and on the whole card for easier UX):
  - `onPointerDown` → `setPointerCapture`, set `isDragging = true`, `stopPropagation` (prevents embla swipe).
  - `onPointerMove` → if dragging, compute `position` from `(e.clientX - rect.left) / rect.width * 100`, clamp 0–100.
  - `onPointerUp/Cancel` → release capture, `isDragging = false`.
- Touch behavior: same pointer events handle touch (pointer events API). `touch-action: none` on the slider so vertical scroll still works outside the card but horizontal drag inside is captured.
- Labels "Before" top-left, "After" top-right, small pill with backdrop blur.
- Both `<img>` use `object-cover` to handle mismatched aspect ratios gracefully.
- `loading="lazy"` + `decoding="async"`.

### Section heading
Hardcoded English, consistent with rest of landing:
- Title: "Real Results" (or similar — finalize during implementation).
- Subtitle: one short line, e.g., "Drag the slider to see the difference."

## Dependencies

New: `embla-carousel-react` (~5 KB gzipped, headless carousel used by shadcn/ui).

## Error Handling

- Admin: upload failures show toast with retry; DB write failures roll back by deleting any orphan uploaded files.
- Landing: if Supabase query fails, section renders `null` (fail-silent — don't break the landing for a marketing section).
- Broken image URLs: `<img>` `onError` could hide the card; acceptable to leave as default browser behavior initially.

## Security

- RLS ensures public only sees `ativo=true` items.
- Bucket is public-read; writes require service role (admin API route or server action).
- File size cap (5 MB) enforced client-side + should also be a safety check in any server-side upload helper.
- File type allow-list: `image/jpeg`, `image/png`, `image/webp`.

## Verification (manual)

After implementation, verify via local dev server (preview_start):

**Admin**
- Create 3 items with distinct orders and images.
- Edit an item's title, swap one image, save — listagem reflects change.
- Toggle `ativo` off on one item — it disappears from landing.
- Delete an item — row gone, storage files gone.

**Landing**
- Desktop: 2 cards visible, prev/next works, dots reflect position.
- Tablet: 1.5 cards visible (peek).
- Mobile: 1 card, swipe changes slide.
- Drag slider inside a card: reveals before/after smoothly; does not trigger carousel swipe.
- Touch drag works on mobile.
- Section hidden when no active items.

## Open questions

None blocking. Minor decisions deferred to implementation:
- Exact sidebar position of the new entry (near `servicos`).
- Final copy for section heading/subheading.
