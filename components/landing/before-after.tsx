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
