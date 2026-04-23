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
    <section id="before-after" className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading text-3xl md:text-4xl text-foreground mb-4">Real Results</h2>
          <p className="text-muted-foreground">Drag the slider to see the transformation.</p>
        </div>
        <BeforeAfterCarousel items={items} />
      </div>
    </section>
  );
}
