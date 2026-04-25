# Before & After Section — Redesign

**Date:** 2026-04-24
**Author:** Driano (with Claude)
**Status:** Approved (pending spec review)
**Supersedes:** 2026-04-22-before-after-section-design.md (initial implementation)

## Goal

Replace the current "Real Results" carousel with a focused, single-card showcase that converts. The section should feel like a "key turning" moment — the visitor sees a real cleaning job and pictures themselves on the receiving end. Tone: confident, minimal, American (Apple/Tesla, not infomercial).

## Scope

In scope:
- Landing section visual redesign (single visible card + side arrows + thumb strip + closing stat/CTA).
- Globally configurable display mode for the antes/depois card: `slider` (current drag) or `hover` (default = depois, hover/tap reveals antes).
- New optional metadata per item: `tipo_servico` and `cidade`, surfaced in card caption.
- Editable copy/stats via `business_settings`.
- Admin UI to manage the new fields and display mode.

Out of scope:
- Touching other landing sections.
- New analytics events (existing tracking layer untouched).
- Localisation beyond English (landing is en-only today).

## User-facing design

### Header
- Eyebrow: `OUR WORK` (uppercase, tracking-wide, muted).
- H2: **`This Is Clean.`** Standalone, no subtitle.

### Card area (single visible card)
- 1 card centered, max-width ~720px desktop, full-bleed mobile (with horizontal padding from container).
- Aspect ratio 4:3.
- Always-visible navigation arrows (`◀`/`▶`) on left/right edges, including mobile. Disabled state at boundaries.
- Bottom-left caption overlay (gradient mask): `titulo` (large) + secondary line `tipo_servico · cidade`. Caption hidden if both metadata fields are empty.
- Display mode (controlled by `business_settings.before_after_display_mode`):
  - **`slider`** — current draggable handle, retains `Before`/`After` pill labels.
  - **`hover`** — base image is `imagem_depois`. On desktop hover, fades/wipes to `imagem_antes`. On mobile, tap toggles. Pill badge: `Hover to see before` (desktop) / `Tap to see before` (mobile). When the antes image is shown, the badge text inverts to `Show after`.

### Thumb strip
- Below the card: horizontal row of square thumbs (~64px), each previewing `imagem_depois`.
- Active thumb: ring + opacity 100; inactive: opacity ~60%.
- Mobile: horizontally scrollable, snap to thumb. Desktop: centered if total width < container, else scrollable.
- Existing dot pagination is removed (thumbs replace it).

### Closing block (below thumbs)
- Big stat line: `{count}+ homes transformed in {region}` — both values from `business_settings`.
- Primary CTA button: `Book yours →` linking to `#contact` anchor.
- Centered, generous vertical spacing.

## Data model changes

### `before_after` table (migration)
Add nullable columns:
- `tipo_servico text` — free text. Admin form provides a non-restrictive datalist with suggestions: Deep Clean, Move-Out, Recurring, Post-Construction.
- `cidade text` — free text (e.g. "Tampa, FL").

No backfill required (both nullable). Existing rows continue to work; caption simply hides when empty.

### `configuracoes` table (KV store backing `business_settings`)
The settings layer is a row-per-key table (`chave`/`valor`/`grupo`/`categoria`), not column-per-key. Adding a new setting requires three coordinated edits in [lib/business-config.ts](lib/business-config.ts):

1. **Extend `BusinessSettings` interface** with:
   - `before_after_display_mode: 'slider' | 'hover'`
   - `before_after_stat_count: number`
   - `before_after_stat_region: string`
2. **Extend `DEFAULT_SETTINGS`** with defaults: `'slider'`, `500`, `'Tampa Bay'`.
3. **Extend `CONFIG_METADATA`** with `{ grupo: 'pagina_inicial', categoria: 'before_after' }` for each new key.

No SQL migration needed — `configuracoes` already accepts arbitrary keys; rows are upserted on first save through the existing settings flow. If we want the defaults present in DB on first deploy, include a one-time seed (insert/upsert) in a new migration file under `supabase/migrations/` for the three keys; otherwise rely on `DEFAULT_SETTINGS` fallback.

### `BeforeAfterItem` (hand-written interface)
[types/before-after.ts](types/before-after.ts) holds a hand-written `BeforeAfterItem` interface (not derived from the Supabase types). Add:
- `tipo_servico?: string | null`
- `cidade?: string | null`

### Generated types
After the `before_after` column migration, regenerate `types/supabase.ts` with `npm run db:generate`.

## Component architecture

### Files to modify

- **[components/landing/before-after.tsx](components/landing/before-after.tsx)**
  Server component. Fetches `before_after` items via `createClient()` and reads settings via `getBusinessSettingsServer()` from [lib/business-config-server.ts](lib/business-config-server.ts) (already used by `app/(public)/layout.tsx` and `components/landing/footer.tsx`). Pulls `before_after_display_mode`, `before_after_stat_count`, `before_after_stat_region`. Passes everything to the carousel client component. Returns `null` when items are empty (current behaviour).

- **[components/landing/before-after-carousel.tsx](components/landing/before-after-carousel.tsx)**
  Refactor. Owns: selected index, prev/next handlers, keyboard navigation (`←`/`→`). Renders:
  1. Single card (chooses between `BeforeAfterSlider` and `BeforeAfterHover` based on `displayMode` prop).
  2. Side arrow buttons (always visible, sm+ and mobile).
  3. Thumb strip.
  4. Closing stat + CTA block.
  Drops embla — single-visible-card with index state is simpler than carousel paging here. Drops dot pagination.

- **[components/landing/before-after-slider.tsx](components/landing/before-after-slider.tsx)**
  Adds caption overlay (gradient + titulo + meta line). Accepts `tipoServico?` and `cidade?` props. Existing drag behaviour and `data-slider` opt-out unchanged (still used to block parent drag if any wrapper drags in the future).

- **[components/before-after/before-after-modal.tsx](components/before-after/before-after-modal.tsx)**
  Add two text inputs: `tipo_servico` (with datalist suggestions), `cidade`. Both optional. Wire into existing form schema and persistence.

- **[components/before-after/before-after-table.tsx](components/before-after/before-after-table.tsx)**
  Optional: surface the new fields as small badges under the title for at-a-glance inspection. Lightweight — skip if it complicates the table.

- **[components/landing/contact-form.tsx](components/landing/contact-form.tsx)**
  Add `id="contact"` to the outer `<section>` (line 80 — `<section className="py-16 bg-pot-pourri/30">`). `<ContactForm />` is mounted in [app/(public)/page.tsx](app/(public)/page.tsx); no wrapper to edit, the section in `contact-form.tsx` IS the anchor target.

- **Admin settings page**: [app/(admin)/admin/configuracoes/pagina-inicial/page.tsx](app/(admin)/admin/configuracoes/pagina-inicial/page.tsx). Add a "Before & After display" group with:
  - Select: display mode (slider / hover).
  - Number input: stat count.
  - Text input: stat region.
  Match the existing form patterns in that file (Field components, save flow through `saveBusinessSetting` or equivalent already wired up in this tab).

### Files to create

- **`components/landing/before-after-hover.tsx`** (new client component)
  Renders the hover-reveal variant. Prop signature must match the slider exactly so the carousel can switch between them with the same props:
  ```ts
  type BeforeAfterCardProps = {
    antes: string;
    depois: string;
    titulo: string;
    tipoServico?: string | null;
    cidade?: string | null;
  };
  ```
  - Two stacked `<img>` (depois on top by default, antes underneath).
  - Desktop: `onMouseEnter` / `onMouseLeave` toggles state; CSS transition (opacity 250ms) on the top image.
  - Mobile / touch: detects via `window.matchMedia('(hover: none)')` after mount; tap toggles `revealed` state. Before the media query resolves, render desktop-mode label to avoid hydration mismatch.
  - Pill badge updates label per state (`Hover/Tap to see before` ↔ `Show after`).

- **`components/landing/before-after-caption.tsx`** (new shared component)
  Both `BeforeAfterSlider` and `BeforeAfterHover` use this. Renders the gradient overlay + titulo + `tipoServico · cidade` line. Hides itself if titulo + both meta fields are empty. Locks the visual treatment in one place.

- **Migration** in `supabase/migrations/` adding `tipo_servico` and `cidade` columns plus the three `business_settings` keys (matching existing settings pattern — likely a row insert/update, not column add).

## Behaviour details

### Display mode swap
Setting reads at request time on the server component; no realtime refresh. Changing mode in admin requires a page reload to take effect on the public landing.

### Thumb sync
Clicking a thumb sets index directly. Arrow buttons advance/retreat by 1, no wrap.

### Hover mode on touch
Detected with `window.matchMedia('(hover: none)')` (client-side after mount). Before mount, default to "tap mode" badge text to avoid hydration mismatch — render the desktop label only after the media query resolves.

### Empty caption
If both `tipo_servico` and `cidade` are null/empty, omit the secondary line. If `titulo` is also missing the entire overlay is hidden (the current schema makes titulo non-null, so this is defensive only).

### Single-item edge case
If `items.length === 1`: hide both arrow buttons and the thumb strip (single card stands alone). The closing stat/CTA block still renders.

### CTA anchor
`Book yours →` is an `<a href="#contact">`. Native browser jump is acceptable — no new smooth-scroll handler is added for this section.

## Error handling

- Supabase fetch error in `before-after.tsx`: log and render `null` (current behaviour preserved).
- Missing `business_settings` keys: fall back to defaults (`slider`, `500`, `Tampa Bay`).
- Image load failure: native `<img>` broken-icon — acceptable, admin should validate uploads (existing flow).

## Testing

Manual verification (no automated test infra exists for landing components):
1. Admin: create item with full metadata → caption shows on landing.
2. Admin: create item with only titulo → caption shows only titulo.
3. Admin: switch display mode to `hover`, reload landing → card opens showing `depois`, hover/tap reveals `antes`.
4. Admin: switch display mode to `slider`, reload → drag works, no hover behaviour.
5. Mobile (DevTools touch emulation + real device): arrows visible, thumbs scroll, tap-to-reveal works.
6. Keyboard: focus card → `←`/`→` navigates.
7. Stat block: edit count and region in admin → values reflect after refresh.
8. CTA: `Book yours →` scrolls/jumps to the contact form section.

## Open questions resolved

- Mobile layout: 1 card visible + side arrows + thumb strip below.
- Mode config: global only, not per item.
- Hover direction: depois → antes (resultado primeiro).
- Headline: `This Is Clean.` standalone, no sub.
- Stats: editable via `business_settings` (not hardcoded).
- Hover on touch: tap toggles.

## Risks / non-goals

- **Risk:** removing embla means losing momentum-scroll feel. Mitigation: with arrows + thumbs the interaction model changes intentionally — no swipe-to-page. If user feedback wants swipe back, reintroduce embla as an enhancement layer.
- **Risk:** hover mode on iOS Safari sometimes triggers a hover state on first tap. Mitigation: explicit tap toggle via pointer events, not `:hover` CSS alone.
- **Non-goal:** no per-item analytics on which result was viewed/which mode was preferred. Add later if conversion-driven.
