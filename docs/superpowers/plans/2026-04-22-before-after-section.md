# Before & After Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public landing "Before & After" showcase (embla carousel with drag-to-reveal cards) plus an admin CRUD module to manage items.

**Architecture:** New Supabase table `before_after` + public storage bucket `before-after`. Admin follows the Clientes pattern (client list page + modal). Landing section is a server component that fetches active items and passes them to a client-side embla carousel; each card is a custom pointer-drag before/after slider (~80 LOC, no extra library).

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui, Supabase (Postgres + Storage), `embla-carousel-react` (new).

**Spec reference:** [docs/superpowers/specs/2026-04-22-before-after-section-design.md](../specs/2026-04-22-before-after-section-design.md)

**Testing note:** This project has no automated test suite. Each task ends with a manual verification step (run dev server, exercise the feature in the browser). Do not invent a test harness.

**File Structure**

| Path | Role |
|------|------|
| `supabase/migrations/29_before_after.sql` (new) | Table, index, RLS, bucket |
| `types/supabase.ts` (regenerate) | Typed DB access |
| `types/before-after.ts` (new) | Domain type re-export + helpers |
| `components/admin/sidebar.tsx` (modify) | Add nav entry |
| `lib/admin-i18n/translations.ts` (modify) | pt/en strings |
| `app/(admin)/admin/before-after/page.tsx` (new) | Admin list page |
| `components/before-after/before-after-table.tsx` (new) | List table |
| `components/before-after/before-after-modal.tsx` (new) | Create/edit modal + image upload |
| `components/landing/before-after.tsx` (new) | Server comp: fetch + render section shell |
| `components/landing/before-after-carousel.tsx` (new) | Client comp: embla carousel |
| `components/landing/before-after-slider.tsx` (new) | Client comp: drag reveal card |
| `app/(public)/page.tsx` (modify) | Mount section between AboutUs and Testimonials |
| `package.json` (modify) | Add `embla-carousel-react` |

**Commit convention:** Use the repo's existing prefix style (`feat(...)`, `fix(...)`, `docs(...)`). Keep the Co-Authored-By trailer already used in recent commits.

---

### Task 1: Database migration + storage bucket

**Files:**
- Create: `supabase/migrations/29_before_after.sql`

- [ ] **Step 1: Inspect an existing migration for conventions (trigger for `updated_at`, comment style).** Read `supabase/migrations/01_phase5_tables.sql` and one recent one (e.g., `supabase/migrations/27_tracking_events_unique_event_id.sql`) to match style.

- [ ] **Step 2: Write `29_before_after.sql`**

```sql
-- Migration: before_after showcase (landing + admin)

create table public.before_after (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  imagem_antes  text not null,
  imagem_depois text not null,
  ordem         int  not null default 0,
  ativo         bool not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index before_after_active_order_idx
  on public.before_after (ativo, ordem);

-- Reuse the project's trigger function if it exists (e.g. handle_updated_at),
-- otherwise create a local one. Check prior migrations for the canonical name.
create trigger before_after_set_updated_at
  before update on public.before_after
  for each row execute function public.handle_updated_at();

alter table public.before_after enable row level security;

create policy "before_after public read active"
  on public.before_after for select
  to anon, authenticated
  using (ativo = true);

-- Admin writes go through service role, which bypasses RLS. No write policies here.

-- Storage bucket (public read)
insert into storage.buckets (id, name, public)
values ('before-after', 'before-after', true)
on conflict (id) do nothing;

-- Storage policies: public read; authenticated users cannot write (service role only)
create policy "before_after bucket public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'before-after');
```

If `handle_updated_at` is named differently in earlier migrations, rename the trigger function reference to match.

- [ ] **Step 3: Apply migration**

Run: `npx supabase db push` (or the project's equivalent — check `package.json` scripts).
Expected: "Applied migration 29_before_after".

- [ ] **Step 4: Regenerate types**

Run: `npm run db:generate`
Expected: `types/supabase.ts` updated; `before_after` row/insert/update types present.

- [ ] **Step 5: Verify table + bucket in Supabase dashboard** (or via SQL): `select * from before_after limit 1;` → empty set, no error. Bucket `before-after` visible under Storage.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/29_before_after.sql types/supabase.ts
git commit -m "feat(db): before_after table + storage bucket"
```

---

### Task 2: Install embla-carousel-react

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install**

Run: `npm install embla-carousel-react`
Expected: installed without peer warnings.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add embla-carousel-react for before/after carousel"
```

---

### Task 3: Domain type

**Files:**
- Create: `types/before-after.ts`

- [ ] **Step 1: Write the type file**

```ts
import type { Database } from './supabase';

export type BeforeAfterRow = Database['public']['Tables']['before_after']['Row'];
export type BeforeAfterInsert = Database['public']['Tables']['before_after']['Insert'];
export type BeforeAfterUpdate = Database['public']['Tables']['before_after']['Update'];

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

- [ ] **Step 2: Commit**

```bash
git add types/before-after.ts
git commit -m "feat(types): BeforeAfter domain types"
```

---

### Task 4: i18n strings

**Files:**
- Modify: `lib/admin-i18n/translations.ts`

- [ ] **Step 1: Read the file structure** — find the `sidebar` block and a reference module block (e.g., `clientes`) to mirror keys.

- [ ] **Step 2: Add `sidebar.beforeAfter`** key with values `"Antes e Depois"` (pt) and `"Before & After"` (en).

- [ ] **Step 3: Add a new top-level block `beforeAfter`** (both pt and en) with keys:

```
title, subtitle, newItem, editItem, deleteItem, deleteConfirmTitle, deleteConfirmBody,
fieldTitle, fieldOrder, fieldActive, fieldImageBefore, fieldImageAfter, imageHint,
uploadBefore, uploadAfter, saveButton, cancelButton, saveSuccess, saveError,
deleteSuccess, deleteError, emptyState, loading
```

Provide concise strings in both locales. Keep tone consistent with existing admin copy.

- [ ] **Step 4: Commit**

```bash
git add lib/admin-i18n/translations.ts
git commit -m "feat(i18n): admin strings for Before & After module"
```

---

### Task 5: Sidebar entry

**Files:**
- Modify: `components/admin/sidebar.tsx`

- [ ] **Step 1: Read the file** and locate the `navigation[]` array (around lines 62–102 per CLAUDE.md notes).

- [ ] **Step 2: Insert a new entry** near the `servicos` entry:

```ts
{ key: 'beforeAfter', href: '/admin/before-after', icon: ImageIcon }
```

Add `ImageIcon` to the lucide-react import if absent.

- [ ] **Step 3: Verify visually** — start dev server, log in to admin, confirm the new entry renders with correct label (pt + en) and icon.

- [ ] **Step 4: Commit**

```bash
git add components/admin/sidebar.tsx
git commit -m "feat(admin): sidebar entry for Before & After"
```

---

### Task 6: Admin list page (skeleton)

**Files:**
- Create: `app/(admin)/admin/before-after/page.tsx`
- Create: `components/before-after/before-after-table.tsx`

- [ ] **Step 1: Write the list page** — client component. Fetch items via the project's `createClient()` (client) from `@/lib/supabase/client`. State: `items`, `loading`, `modalOpen`, `editingItem`. Header with title + "New" button. Render `<BeforeAfterTable>`. Handle refresh after modal save/delete.

```tsx
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAdminI18n } from '@/lib/admin-i18n/context';
import { Button } from '@/components/ui/button';
import { BeforeAfterTable } from '@/components/before-after/before-after-table';
import { BeforeAfterModal } from '@/components/before-after/before-after-modal';
import type { BeforeAfterItem } from '@/types/before-after';

export default function BeforeAfterPage() {
  const { t } = useAdminI18n();
  const supabase = createClient();
  const [items, setItems] = useState<BeforeAfterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BeforeAfterItem | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('before_after')
      .select('*')
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false });
    setItems((data ?? []) as BeforeAfterItem[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('beforeAfter').title}</h1>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          {t('beforeAfter').newItem}
        </Button>
      </div>

      <BeforeAfterTable
        items={items}
        loading={loading}
        onEdit={(item) => { setEditing(item); setModalOpen(true); }}
        onRefresh={load}
      />

      <BeforeAfterModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={editing}
        onSaved={load}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write `BeforeAfterTable` stub** — renders empty state or a simple table (columns: antes thumb, depois thumb, título, ordem, ativo switch, ações). Use shadcn Table primitives from `@/components/ui/table`. Delete handler calls `supabase.from('before_after').delete().eq('id', ...)` then removes files from bucket (use `storage.from('before-after').list(item.id)` + `remove(paths)`). Toggle ativo: `update({ ativo: !item.ativo })` + `onRefresh()`.

- [ ] **Step 3: Verify** — navigate to `/admin/before-after`. Page renders with header, "New" button, empty table. No console errors.

- [ ] **Step 4: Commit**

```bash
git add app/(admin)/admin/before-after/page.tsx components/before-after/before-after-table.tsx
git commit -m "feat(admin): before/after list page + table"
```

---

### Task 7: Admin modal with image upload

**Files:**
- Create: `components/before-after/before-after-modal.tsx`

- [ ] **Step 1: Inspect the upload pattern** in `app/(admin)/admin/configuracoes/empresa/page.tsx` (around line 81 per CLAUDE.md) to mirror conventions (`supabase.storage.from(...).upload()`, `getPublicUrl`, toast calls, error handling).

- [ ] **Step 2: Write the modal**

Key decisions (locked in per spec reviewer):
- Pre-generate `id = crypto.randomUUID()` in component state for create mode → upload path matches final row id from the start.
- File constraints: `image/jpeg|png|webp`, max 5 MB (client-side check).
- Two separate upload handlers, one per field.
- On save: upsert row with both URLs, close modal, call `onSaved`.
- On delete of a previously-uploaded file before save (user picks new one), overwrite via `upload(..., { upsert: true })`. Don't worry about orphan cleanup within the same session.
- `object-fit: contain` on previews.

Sketch:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { useAdminI18n } from '@/lib/admin-i18n/context';
import { toast } from 'sonner'; // or whatever the project uses — check other modals
import type { BeforeAfterItem } from '@/types/before-after';

const MAX_MB = 5;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export function BeforeAfterModal({ open, onOpenChange, item, onSaved }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: BeforeAfterItem | null;
  onSaved: () => void;
}) {
  const { t } = useAdminI18n();
  const supabase = createClient();
  const [id, setId] = useState<string>('');
  const [titulo, setTitulo] = useState('');
  const [ordem, setOrdem] = useState(0);
  const [ativo, setAtivo] = useState(true);
  const [imgAntes, setImgAntes] = useState('');
  const [imgDepois, setImgDepois] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (item) {
      setId(item.id); setTitulo(item.titulo); setOrdem(item.ordem);
      setAtivo(item.ativo); setImgAntes(item.imagem_antes); setImgDepois(item.imagem_depois);
    } else {
      setId(crypto.randomUUID()); setTitulo(''); setOrdem(0);
      setAtivo(true); setImgAntes(''); setImgDepois('');
    }
  }, [open, item]);

  async function handleUpload(kind: 'antes' | 'depois', file: File) {
    if (!ALLOWED.includes(file.type)) { toast.error('Invalid file type'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { toast.error(`Max ${MAX_MB} MB`); return; }
    const ext = file.name.split('.').pop();
    const path = `${id}/${kind}.${ext}`;
    const { error } = await supabase.storage.from('before-after')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from('before-after').getPublicUrl(path);
    if (kind === 'antes') setImgAntes(data.publicUrl);
    else setImgDepois(data.publicUrl);
  }

  async function handleSave() {
    if (!titulo || !imgAntes || !imgDepois) { toast.error('Fill all fields'); return; }
    setSaving(true);
    const payload = { id, titulo, ordem, ativo, imagem_antes: imgAntes, imagem_depois: imgDepois };
    const { error } = await supabase.from('before_after').upsert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t('beforeAfter').saveSuccess);
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? t('beforeAfter').editItem : t('beforeAfter').newItem}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label>{t('beforeAfter').fieldTitle}</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={120} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('beforeAfter').fieldOrder}</Label>
              <Input type="number" value={ordem} onChange={e => setOrdem(Number(e.target.value))} />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={ativo} onCheckedChange={setAtivo} />
              <Label>{t('beforeAfter').fieldActive}</Label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('beforeAfter').imageHint}</p>
          <div className="grid grid-cols-2 gap-4">
            {/* Each side: preview (or placeholder) + file input labeled upload */}
            {/* Implement a small inline uploader with preview for antes and depois */}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('beforeAfter').cancelButton}</Button>
          <Button onClick={handleSave} disabled={saving}>{t('beforeAfter').saveButton}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

Fill in the two upload+preview slots inline (a `<img>` if URL set, a `<Input type="file" />` below). Match the toast library used elsewhere (likely `sonner` — verify by grepping existing modals).

- [ ] **Step 3: Verify** — open dev server, create a new item with title + both images, save, confirm the row appears in the table and in Supabase dashboard. Edit it, change the title and one image, save, confirm update. Toggle `ativo`. Delete it, confirm row and files removed from bucket.

- [ ] **Step 4: Commit**

```bash
git add components/before-after/before-after-modal.tsx
git commit -m "feat(admin): before/after create-edit modal with image upload"
```

---

### Task 8: Landing — drag-to-reveal card

**Files:**
- Create: `components/landing/before-after-slider.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';
import { useRef, useState, PointerEvent } from 'react';

export function BeforeAfterSlider({ antes, depois, titulo }: {
  antes: string; depois: string; titulo: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  function updateFromClientX(clientX: number) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragging(true);
    updateFromClientX(e.clientX);
    e.stopPropagation();
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateFromClientX(e.clientX);
    e.stopPropagation();
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      ref={ref}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100 select-none touch-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <img src={depois} alt={`${titulo} — after`}
           className="absolute inset-0 h-full w-full object-cover"
           loading="lazy" decoding="async" />
      <img src={antes} alt={`${titulo} — before`}
           className="absolute inset-0 h-full w-full object-cover"
           style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
           loading="lazy" decoding="async" />
      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur">Before</span>
      <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur">After</span>
      <div className="absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="h-full w-0.5 -translate-x-1/2 bg-white/90 shadow" />
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow w-10 h-10 flex items-center justify-center">
          <span className="text-neutral-700 text-sm">↔</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Sanity-render** — temporarily mount `<BeforeAfterSlider antes="..." depois="..." titulo="test" />` in a throwaway test page or the landing itself with two sample URLs; verify drag works on desktop (mouse) and mobile (touch via devtools emulation).

- [ ] **Step 3: Commit**

```bash
git add components/landing/before-after-slider.tsx
git commit -m "feat(landing): drag-to-reveal before/after slider card"
```

---

### Task 9: Landing — embla carousel wrapper

**Files:**
- Create: `components/landing/before-after-carousel.tsx`

- [ ] **Step 1: Write the client carousel**

```tsx
'use client';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BeforeAfterSlider } from './before-after-slider';
import type { BeforeAfterItem } from '@/types/before-after';

export function BeforeAfterCarousel({ items }: { items: BeforeAfterItem[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ align: 'start', loop: false });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
    setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    setSnaps(embla.scrollSnapList());
    onSelect();
    embla.on('select', onSelect);
    embla.on('reInit', onSelect);
  }, [embla, onSelect]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {items.map(it => (
            <div key={it.id}
                 className="min-w-0 shrink-0 grow-0 basis-full md:basis-2/3 lg:basis-1/2">
              <BeforeAfterSlider antes={it.imagem_antes} depois={it.imagem_depois} titulo={it.titulo} />
              <h3 className="mt-3 text-lg font-semibold">{it.titulo}</h3>
            </div>
          ))}
        </div>
      </div>

      <button
        aria-label="Previous"
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:grid h-10 w-10 place-items-center rounded-full bg-white shadow disabled:opacity-40"
        onClick={() => embla?.scrollPrev()} disabled={!canPrev}>
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Next"
        className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 hidden md:grid h-10 w-10 place-items-center rounded-full bg-white shadow disabled:opacity-40"
        onClick={() => embla?.scrollNext()} disabled={!canNext}>
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="mt-6 flex justify-center gap-2">
        {snaps.map((_, i) => (
          <button key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => embla?.scrollTo(i)}
                  className={`h-2 rounded-full transition-all ${i === selected ? 'w-6 bg-neutral-800' : 'w-2 bg-neutral-300'}`} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/before-after-carousel.tsx
git commit -m "feat(landing): embla carousel wrapper for before/after"
```

---

### Task 10: Landing — section wrapper (server) + mount

**Files:**
- Create: `components/landing/before-after.tsx`
- Modify: `app/(public)/page.tsx`

- [ ] **Step 1: Write the server component**

```tsx
import { createClient } from '@/lib/supabase/server';
import { BeforeAfterCarousel } from './before-after-carousel';
import type { BeforeAfterItem } from '@/types/before-after';

export async function BeforeAfter() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('before_after')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });

  const items = (data ?? []) as BeforeAfterItem[];
  if (items.length === 0) return null;

  return (
    <section id="before-after" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Real Results</h2>
          <p className="mt-3 text-neutral-600">Drag the slider to see the transformation.</p>
        </div>
        <BeforeAfterCarousel items={items} />
      </div>
    </section>
  );
}
```

Match the exact wrapper class/pattern used by other landing sections (e.g., `Testimonials`) for consistent spacing/background — read `components/landing/testimonials.tsx` or similar first and adjust.

- [ ] **Step 2: Mount in `app/(public)/page.tsx`** between `<AboutUs />` and `<Testimonials />`:

```tsx
<AboutUs />
<BeforeAfter />
<Testimonials />
```

Add the import at the top.

- [ ] **Step 3: Verify** — load landing in the browser. Without items in DB the section must not render. Add 3 items via admin, reload landing, confirm:
  - Desktop ≥1024px: 2 cards visible side-by-side.
  - Tablet (768px): ~1.5 cards with peek.
  - Mobile (375px): 1 card, swipe changes slides.
  - Drag slider inside a card works, does NOT trigger carousel swipe.
  - Dot pagination reflects current slide.
  - No console errors.

- [ ] **Step 4: Commit**

```bash
git add components/landing/before-after.tsx app/(public)/page.tsx
git commit -m "feat(landing): mount Before & After section"
```

---

### Task 11: Final verification pass

- [ ] **Step 1: Full flow** — as admin: create, edit, toggle active, delete. As visitor: view landing, drag cards, navigate carousel on desktop and mobile widths.

- [ ] **Step 2: Lint**

Run: `npm run lint:fix`
Expected: no errors.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds (warnings okay if pre-existing).

- [ ] **Step 4: Confirm bucket cleanup on delete** — delete an item, verify via Supabase Storage dashboard that its folder is gone.

- [ ] **Step 5: Final commit if any lint/format changes**

```bash
git add -A
git commit -m "chore: lint pass for before/after module"
```

---

## Notes for the implementer

- **Toast library**: confirm by grepping (`grep -r "from 'sonner'" components/` or similar) before importing — use whatever other admin modals use.
- **Supabase client imports**: client components use `@/lib/supabase/client`; server components use `@/lib/supabase/server` (await required).
- **Trigger function for `updated_at`**: if `public.handle_updated_at()` doesn't exist in the project, either create it in the same migration or manually update the column in code. Check earlier migrations.
- **Delete cleanup**: when deleting a row, also `supabase.storage.from('before-after').list(item.id)` then `.remove(paths)`. If either fails, surface a toast but still refresh the list.
- **Image URL failures on landing**: leave default browser behavior for now (broken image icon). Tracked as out-of-scope in spec.
- **Section copy** ("Real Results" / "Drag the slider to see the transformation."): finalize with Driano if he has better copy; otherwise ship these strings.
