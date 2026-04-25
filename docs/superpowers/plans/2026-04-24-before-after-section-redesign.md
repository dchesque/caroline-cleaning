# Before & After Section Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the landing "Real Results" section into a single-card showcase with side arrows, thumb strip, configurable display mode (slider/hover), per-item metadata, and a closing stat + CTA block.

**Architecture:** Data layer (Supabase migration + business-config keys) → admin UI (modal fields + settings tab block) → landing layer (server fetch in `before-after.tsx` → carousel client component drives a single card chosen between `BeforeAfterSlider` (existing, refined) and `BeforeAfterHover` (new), with shared `BeforeAfterCaption`). Embla is removed from the carousel; index state replaces it.

**Tech Stack:** Next.js 14 (App Router, RSC + client components), TypeScript, Tailwind, Supabase (Postgres + RLS), shadcn/ui primitives, sonner toasts.

**Spec:** [docs/superpowers/specs/2026-04-24-before-after-section-redesign-design.md](../specs/2026-04-24-before-after-section-redesign-design.md)

**Testing model:** No automated test infra exists for landing components or admin pages in this repo. Verification is done via `npm run lint` + `npm run build` (type check + bundle), plus manual smoke checks against the dev server (`npm run dev`). Each task that touches code includes a verification step.

---

## File map

**Create:**
- `supabase/migrations/31_before_after_metadata_and_settings.sql`
- `components/landing/before-after-caption.tsx`
- `components/landing/before-after-hover.tsx`

**Modify:**
- `types/before-after.ts` — extend `BeforeAfterItem`
- `lib/business-config.ts` — interface, `DEFAULT_SETTINGS`, `CONFIG_METADATA`
- `components/before-after/before-after-modal.tsx` — add tipo_servico + cidade fields
- `app/(admin)/admin/configuracoes/pagina-inicial/page.tsx` — add Before & After accordion
- `components/landing/contact-form.tsx` — add `id="contact"` to outer section
- `components/landing/before-after-slider.tsx` — caption overlay + new props
- `components/landing/before-after-carousel.tsx` — full refactor (drop embla, add arrows/thumbs/stat/CTA, mode switching)
- `components/landing/before-after.tsx` — fetch settings, pass props

**Regenerate after migration:**
- `types/supabase.ts` via `npm run db:generate`

---

## Task 1: SQL migration for `before_after` columns + settings seed

**Files:**
- Create: `supabase/migrations/31_before_after_metadata_and_settings.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/31_before_after_metadata_and_settings.sql`:

```sql
-- supabase/migrations/31_before_after_metadata_and_settings.sql
-- Adds optional metadata to before_after items + seeds display settings.

alter table public.before_after
  add column if not exists tipo_servico text,
  add column if not exists cidade       text;

-- Seed display settings into the configuracoes KV table so defaults exist in DB.
-- Existing rows are left alone (on conflict do nothing) — admin can edit freely.
insert into public.configuracoes (chave, valor, grupo, categoria)
values
  ('before_after_display_mode', 'slider',     'pagina_inicial', 'before_after'),
  ('before_after_stat_count',   '500',        'pagina_inicial', 'before_after'),
  ('before_after_stat_region',  'Tampa Bay',  'pagina_inicial', 'before_after')
on conflict (chave) do nothing;
```

- [ ] **Step 2: Verify SQL compiles against the live schema**

Run via Supabase MCP:
```
mcp__supabase__apply_migration name=before_after_metadata_and_settings query=<file contents>
```
Expected: success. If `configuracoes` has a different unique-key constraint than `chave`, adjust the `on conflict` target accordingly — inspect with `mcp__supabase__list_tables` first if unsure.

- [ ] **Step 3: Sanity-check via SQL**

Run:
```
mcp__supabase__execute_sql query="select column_name from information_schema.columns where table_name='before_after' and column_name in ('tipo_servico','cidade');"
```
Expected: 2 rows.

```
mcp__supabase__execute_sql query="select chave, valor from public.configuracoes where chave like 'before_after_%' order by chave;"
```
Expected: 3 rows with the seeded values.

- [ ] **Step 4: Regenerate Supabase types**

Run: `npm run db:generate`
Expected: `types/supabase.ts` updated; `before_after` row type now includes `tipo_servico: string | null` and `cidade: string | null`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/31_before_after_metadata_and_settings.sql types/supabase.ts
git commit -m "feat(db): before_after metadata columns + display settings seed"
```

---

## Task 2: Extend `BeforeAfterItem` interface

**Files:**
- Modify: `types/before-after.ts`

- [ ] **Step 1: Add fields**

In `types/before-after.ts`, extend `BeforeAfterItem`:

```ts
export interface BeforeAfterItem {
  id: string;
  titulo: string;
  imagem_antes: string;
  imagem_depois: string;
  tipo_servico?: string | null;
  cidade?: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: passes (no new errors). Existing call sites that don't reference the new fields keep working because they're optional.

- [ ] **Step 3: Commit**

```bash
git add types/before-after.ts
git commit -m "types(before-after): add optional tipo_servico and cidade"
```

---

## Task 3: Add display settings to `business-config.ts`

**Files:**
- Modify: `lib/business-config.ts`

- [ ] **Step 1: Extend `BusinessSettings` interface**

Locate the interface (starts ~line 3, ends ~line 168 with `[key: string]: any;`). Add a new section before the legacy index signature:

```ts
    // Página Inicial - Before & After
    before_after_display_mode: 'slider' | 'hover';
    before_after_stat_count: number;
    before_after_stat_region: string;
```

- [ ] **Step 2: Extend `DEFAULT_SETTINGS`**

In the `DEFAULT_SETTINGS` object (starts ~line 170), add:

```ts
    before_after_display_mode: 'slider',
    before_after_stat_count: 500,
    before_after_stat_region: 'Tampa Bay',
```

Place near the badges block to keep the file grouped by section.

- [ ] **Step 3: Extend `CONFIG_METADATA`**

In the `CONFIG_METADATA` map (~line 408), add (in the `Página Inicial` block):

```ts
    before_after_display_mode: { grupo: 'pagina_inicial', categoria: 'before_after' },
    before_after_stat_count:   { grupo: 'pagina_inicial', categoria: 'before_after' },
    before_after_stat_region:  { grupo: 'pagina_inicial', categoria: 'before_after' },
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add lib/business-config.ts
git commit -m "feat(config): before_after display mode + stat settings"
```

---

## Task 4: Admin modal — `tipo_servico` and `cidade` fields

**Files:**
- Modify: `components/before-after/before-after-modal.tsx`

- [ ] **Step 1: Add state hooks**

After `const [imgDepois, setImgDepois] = useState('')` (~line 47), add:

```tsx
    const [tipoServico, setTipoServico] = useState('')
    const [cidade, setCidade] = useState('')
```

- [ ] **Step 2: Wire into reset effect**

In the `useEffect` that resets state on `open`/`item` change (~line 56), add inside `if (item)`:

```tsx
            setTipoServico(item.tipo_servico ?? '')
            setCidade(item.cidade ?? '')
```

And inside the `else` branch:

```tsx
            setTipoServico('')
            setCidade('')
```

- [ ] **Step 3: Wire into save payload**

In `handleSave` (~line 118), extend `payload`:

```ts
            const payload = {
                id,
                titulo: titulo.trim(),
                ordem,
                ativo,
                imagem_antes: imgAntes,
                imagem_depois: imgDepois,
                tipo_servico: tipoServico.trim() || null,
                cidade:        cidade.trim() || null,
            }
```

- [ ] **Step 4: Add form inputs**

After the Ordem/Ativo grid (closing `</div>` of the `grid grid-cols-2 gap-4` block, ~line 195), and before the image hint paragraph, insert:

```tsx
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ba-tipo-servico">Service type</Label>
                            <Input
                                id="ba-tipo-servico"
                                value={tipoServico}
                                onChange={(e) => setTipoServico(e.target.value)}
                                list="ba-service-types"
                                maxLength={60}
                                placeholder="Deep Clean"
                                className={inputClasses}
                            />
                            <datalist id="ba-service-types">
                                <option value="Deep Clean" />
                                <option value="Move-Out" />
                                <option value="Recurring" />
                                <option value="Post-Construction" />
                            </datalist>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ba-cidade">City</Label>
                            <Input
                                id="ba-cidade"
                                value={cidade}
                                onChange={(e) => setCidade(e.target.value)}
                                maxLength={80}
                                placeholder="Tampa, FL"
                                className={inputClasses}
                            />
                        </div>
                    </div>
```

(Plain English labels are intentional — these are optional fields without i18n keys yet. Keep consistent with the existing `ba.fieldTitle` style if i18n keys are added later.)

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: passes.

Manual smoke (later, after the dev server is up): open admin → Before & After → "New item" → confirm the two new fields render between Ordem/Ativo and the image hint, save with values, reopen edit, values persist.

- [ ] **Step 6: Commit**

```bash
git add components/before-after/before-after-modal.tsx
git commit -m "feat(admin): tipo_servico and cidade fields in before-after modal"
```

---

## Task 5: Admin landing settings — Before & After accordion section

**Files:**
- Modify: `app/(admin)/admin/configuracoes/pagina-inicial/page.tsx`

- [ ] **Step 1: Find an icon and a slot**

Open the file. Locate the Trust Badges `AccordionItem` (`value="badges"`, ~line 282, `bg-white`); the next item (Services, ~line 346) is `bg-gray-50/50`. Inserting between them breaks zebra (would yield two adjacent rows of the same color either way). Insert the new "Before & After" accordion **after the Services accordion** with `bg-white` to preserve alternation (services gray → before-after white → next item should already be gray; verify by reading the file). Use the `Sparkles` icon (already imported).

- [ ] **Step 2: Insert the accordion item**

After the `</AccordionItem>` closing the **Services** block (find its closing tag — the trigger is at ~line 346), insert:

```tsx
                    {/* Before & After Section */}
                    <AccordionItem value="before_after" className="border-b-2 border-gray-200 bg-white">
                        <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-brandy-rose-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-brandy-rose-50">
                                    <Sparkles className="w-5 h-5 text-brandy-rose-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-foreground">Before &amp; After</h3>
                                    <p className="text-sm text-muted-foreground">Display mode and closing stat for the showcase section</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="ba-display-mode">Display mode</Label>
                                    <select
                                        id="ba-display-mode"
                                        value={config.before_after_display_mode ?? 'slider'}
                                        onChange={(e) => setConfig({ ...config, before_after_display_mode: e.target.value })}
                                        className={cn(inputClasses, 'h-10 rounded-md px-3 w-full')}
                                    >
                                        <option value="slider">Drag slider (current)</option>
                                        <option value="hover">Hover / tap to reveal before</option>
                                    </select>
                                    <p className="text-xs text-muted-foreground">Slider lets visitors drag a handle. Hover shows the after first and reveals the before on hover (desktop) or tap (mobile).</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ba-stat-count">Stat count</Label>
                                        <Input
                                            id="ba-stat-count"
                                            type="number"
                                            min={0}
                                            value={config.before_after_stat_count ?? 0}
                                            onChange={(e) => setConfig({ ...config, before_after_stat_count: Number(e.target.value) })}
                                            placeholder="500"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ba-stat-region">Stat region</Label>
                                        <Input
                                            id="ba-stat-region"
                                            value={config.before_after_stat_region ?? ''}
                                            onChange={(e) => setConfig({ ...config, before_after_stat_region: e.target.value })}
                                            placeholder="Tampa Bay"
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">Renders as: <span className="font-medium">{`${config.before_after_stat_count ?? 0}+ homes transformed in ${config.before_after_stat_region ?? ''}`}</span></p>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add app/(admin)/admin/configuracoes/pagina-inicial/page.tsx
git commit -m "feat(admin): before & after display settings panel"
```

---

## Task 6: Add `id="contact"` anchor to contact form section

**Files:**
- Modify: `components/landing/contact-form.tsx:80`

- [ ] **Step 1: Edit**

In `components/landing/contact-form.tsx`, change the outer section opening tag (line 80):

From:
```tsx
        <section className="py-16 bg-pot-pourri/30">
```
To:
```tsx
        <section id="contact" className="py-16 bg-pot-pourri/30">
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add components/landing/contact-form.tsx
git commit -m "feat(landing): id=\"contact\" anchor on contact section"
```

---

## Task 7: Shared `BeforeAfterCaption` component

**Files:**
- Create: `components/landing/before-after-caption.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';

interface Props {
  titulo: string;
  tipoServico?: string | null;
  cidade?: string | null;
}

export function BeforeAfterCaption({ titulo, tipoServico, cidade }: Props) {
  const meta = [tipoServico, cidade].filter(Boolean).join(' · ');
  if (!titulo && !meta) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pt-10 pb-4 text-white">
      {titulo ? <h3 className="text-lg font-semibold leading-tight">{titulo}</h3> : null}
      {meta ? <p className="mt-0.5 text-sm text-white/80">{meta}</p> : null}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add components/landing/before-after-caption.tsx
git commit -m "feat(landing): shared before-after caption component"
```

---

## Task 8: Update `BeforeAfterSlider` — caption + new props

**Files:**
- Modify: `components/landing/before-after-slider.tsx`

- [ ] **Step 1: Update props and import caption**

Replace the props signature and add the caption import:

```tsx
'use client';
import { useRef, useState, PointerEvent } from 'react';
import { BeforeAfterCaption } from './before-after-caption';

export function BeforeAfterSlider({ antes, depois, titulo, tipoServico, cidade }: {
  antes: string; depois: string; titulo: string;
  tipoServico?: string | null; cidade?: string | null;
}) {
```

- [ ] **Step 2: Render caption inside the slider container**

Inside the outer `<div ref={ref} ...>`, after the closing `</div>` of the handle indicator block (just before the container's closing `</div>`), insert:

```tsx
      <BeforeAfterCaption titulo={titulo} tipoServico={tipoServico} cidade={cidade} />
```

The caption uses absolute positioning so it sits above both images and the handle. Confirm z-stacking works — if the handle visibly overlaps the caption text, increase caption `z-10` or set an appropriate z-index. (Default stacking should be fine since caption is rendered last.)

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add components/landing/before-after-slider.tsx
git commit -m "feat(landing): caption overlay on before-after slider"
```

---

## Task 9: New `BeforeAfterHover` component

**Files:**
- Create: `components/landing/before-after-hover.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { BeforeAfterCaption } from './before-after-caption';

interface Props {
  antes: string;
  depois: string;
  titulo: string;
  tipoServico?: string | null;
  cidade?: string | null;
}

export function BeforeAfterHover({ antes, depois, titulo, tipoServico, cidade }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: none)');
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const onEnter = () => { if (!isTouch) setRevealed(true); };
  const onLeave = () => { if (!isTouch) setRevealed(false); };
  const onClick = () => { if (isTouch) setRevealed(v => !v); };

  const badge = revealed
    ? 'Show after'
    : isTouch ? 'Tap to see before' : 'Hover to see before';

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100 select-none cursor-pointer"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* Antes underneath */}
      <img src={antes} alt={`${titulo} — before`}
           className="absolute inset-0 h-full w-full object-cover"
           loading="lazy" decoding="async" draggable={false} />
      {/* Depois on top, fades out when revealed */}
      <img src={depois} alt={`${titulo} — after`}
           className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[250ms]"
           style={{ opacity: revealed ? 0 : 1 }}
           loading="lazy" decoding="async" draggable={false} />
      <span className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur">
        {badge}
      </span>
      <BeforeAfterCaption titulo={titulo} tipoServico={tipoServico} cidade={cidade} />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add components/landing/before-after-hover.tsx
git commit -m "feat(landing): hover-reveal before/after card variant"
```

---

## Task 10: Refactor `BeforeAfterCarousel`

This is the biggest change. Drops embla, replaces dot pagination with a thumb strip, adds always-visible side arrows, switches between slider/hover, renders the closing stat + CTA.

**Files:**
- Modify: `components/landing/before-after-carousel.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `components/landing/before-after-carousel.tsx`:

```tsx
'use client';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BeforeAfterSlider } from './before-after-slider';
import { BeforeAfterHover } from './before-after-hover';
import type { BeforeAfterItem } from '@/types/before-after';

type DisplayMode = 'slider' | 'hover';

interface Props {
  items: BeforeAfterItem[];
  displayMode: DisplayMode;
  statCount: number;
  statRegion: string;
}

export function BeforeAfterCarousel({ items, displayMode, statCount, statRegion }: Props) {
  const [index, setIndex] = useState(0);
  const total = items.length;
  const canPrev = index > 0;
  const canNext = index < total - 1;
  const showNav = total > 1;
  const current = items[index];

  const goPrev = useCallback(() => setIndex(i => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setIndex(i => Math.min(total - 1, i + 1)), [total]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext]);

  const Card = displayMode === 'hover' ? BeforeAfterHover : BeforeAfterSlider;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Card area */}
      <div className="relative">
        <Card
          antes={current.imagem_antes}
          depois={current.imagem_depois}
          titulo={current.titulo}
          tipoServico={current.tipo_servico}
          cidade={current.cidade}
        />

        {showNav && (
          <>
            <button
              type="button"
              aria-label="Previous result"
              onClick={goPrev}
              disabled={!canPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-md hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next result"
              onClick={goNext}
              disabled={!canNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-md hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumb strip */}
      {showNav && (
        <div className="mt-6 flex justify-center gap-3 overflow-x-auto pb-1">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              aria-label={`Show ${it.titulo}`}
              onClick={() => setIndex(i)}
              className={`relative shrink-0 overflow-hidden rounded-md transition ${
                i === index
                  ? 'ring-2 ring-brandy-rose-500 opacity-100'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={it.imagem_depois}
                alt={`${it.titulo} thumbnail`}
                className="h-16 w-16 object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}

      {/* Closing block */}
      <div className="mt-12 text-center">
        <p className="text-2xl md:text-3xl font-heading text-foreground">
          {statCount}+ homes transformed in {statRegion}
        </p>
        <a
          href="#contact"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brandy-rose-500 px-6 py-3 text-sm font-medium text-white shadow hover:bg-brandy-rose-600 transition-colors"
        >
          Book yours <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add components/landing/before-after-carousel.tsx
git commit -m "feat(landing): redesigned before-after carousel (single card, arrows, thumbs, CTA)"
```

---

## Task 11: Wire server component to settings + new copy

**Files:**
- Modify: `components/landing/before-after.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire contents of `components/landing/before-after.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server';
import { getBusinessSettingsServer } from '@/lib/business-config-server';
import { BeforeAfterCarousel } from './before-after-carousel';
import type { BeforeAfterItem } from '@/types/before-after';

export async function BeforeAfter() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('before_after')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true });
  if (error) console.error('[BeforeAfter] fetch error', error);

  const items = (data ?? []) as BeforeAfterItem[];
  if (items.length === 0) return null;

  const settings = await getBusinessSettingsServer();
  const displayMode = settings.before_after_display_mode === 'hover' ? 'hover' : 'slider';
  const statCount = Number(settings.before_after_stat_count ?? 500) || 500;
  const statRegion = settings.before_after_stat_region || 'Tampa Bay';

  return (
    <section id="before-after" className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Our Work</p>
          <h2 className="font-heading text-4xl md:text-5xl text-foreground">This Is Clean.</h2>
        </div>
        <BeforeAfterCarousel
          items={items}
          displayMode={displayMode}
          statCount={statCount}
          statRegion={statRegion}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify type check + build**

Run: `npx tsc --noEmit`
Expected: passes.

Run: `npm run build`
Expected: build succeeds; the landing route renders without runtime errors during prerender.

- [ ] **Step 3: Commit**

```bash
git add components/landing/before-after.tsx
git commit -m "feat(landing): wire before-after section to display settings + new copy"
```

---

## Task 12: Manual verification against dev server

This is the smoke pass that proves the whole flow works. No code changes — only checks. If anything fails, branch back to the relevant task.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server up on http://localhost:3000.

- [ ] **Step 2: Landing — slider mode (default)**

Visit `/`. Scroll to the Before & After section.

Verify:
- Eyebrow "OUR WORK" + headline "This Is Clean." render.
- One card visible at a time, max-width ~720px.
- Side arrows visible on left/right; left arrow disabled when index=0.
- Drag handle works (slider mode is default per migration seed).
- Caption overlay shows titulo (and `tipo_servico · cidade` if filled).
- Below the card: thumb strip; clicking a thumb switches the card.
- If only one item exists: arrows + thumbs hidden; card stands alone.
- Below thumbs: stat line "500+ homes transformed in Tampa Bay" + "Book yours →" button.
- Click "Book yours →" — page jumps to the contact form section.

- [ ] **Step 3: Landing — keyboard nav**

Focus the page. Press `←` and `→`. Index should advance/retreat (clamped at boundaries).

- [ ] **Step 4: Landing — mobile viewport**

In DevTools, switch to a mobile preset (e.g. iPhone 12). Reload.

Verify:
- Card fills container width minus padding.
- Arrows still visible at left/right edges and tappable.
- Thumb strip is horizontally scrollable.
- Caption text is readable.

- [ ] **Step 5: Admin — create item with metadata**

Visit `/admin` → Before & After → New item. Upload images, set titulo, set Service type to "Deep Clean" (datalist suggestion), city "Tampa, FL". Save.

Reload admin list — record present. Reopen modal — fields persisted.

Reload landing — caption now shows `Deep Clean · Tampa, FL` under the title.

- [ ] **Step 6: Admin — switch to hover mode**

Visit `/admin/configuracoes/pagina-inicial` → Before & After section. Set display mode to "Hover / tap to reveal before". Save. Reload landing.

Verify:
- Card opens showing `imagem_depois`.
- Pill badge top-right says "Hover to see before" (desktop).
- Hover the card — image fades to `imagem_antes`. Badge updates to "Show after".
- Mouse out — back to depois.
- In mobile preset (touch emulation): badge says "Tap to see before"; tapping toggles.

- [ ] **Step 7: Admin — edit stats**

In the same settings panel, change stat count to a different value (e.g. 750) and region (e.g. "Charlotte, NC"). Save. Reload landing — closing line reflects the new values.

- [ ] **Step 8: Switch back + verify slider still works**

Set display mode back to slider. Save. Reload. Slider drag works unchanged.

- [ ] **Step 9: Lint pass**

Run: `npm run lint`
Expected: no new errors. Fix any issues introduced by the changes.

- [ ] **Step 10: Final commit (if any fixes were needed)**

If lint or smoke testing surfaced issues, fix them in scope and commit:
```bash
git add -A
git commit -m "fix(before-after): smoke test corrections"
```

If everything passed without changes, skip this step.

---

## Task 13 (optional): Cleanup — drop unused embla import

Embla was used in the old carousel. After Task 10, the carousel no longer uses `embla-carousel-react`. If no other component on the landing imports it, the dependency is now unused. Do NOT remove it from `package.json` in this plan unless verified — admin or another landing component may still use it.

- [ ] **Step 1: Check usage**

Run: `npx grep -r "embla-carousel" --exclude-dir=node_modules .` (or the equivalent ripgrep call).
Expected: see whether any other file imports it.

- [ ] **Step 2: If unused, remove**

If no remaining imports:
```bash
npm uninstall embla-carousel-react
```
Then commit:
```bash
git add package.json package-lock.json
git commit -m "chore: drop unused embla-carousel-react"
```

If still used elsewhere: skip this task entirely.

---

## Done

After Task 12 (and optionally 13) the section is shipped. The user requested visual changes only — no analytics or new tests needed beyond manual verification.
