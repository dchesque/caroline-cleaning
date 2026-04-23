'use client';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BeforeAfterSlider } from './before-after-slider';
import type { BeforeAfterItem } from '@/types/before-after';

export function BeforeAfterCarousel({ items }: { items: BeforeAfterItem[] }) {
  const [emblaRef, embla] = useEmblaCarousel({
    align: 'start',
    loop: false,
    watchDrag: (_api, evt) => {
      const target = evt.target as Element | null;
      return !target?.closest('[data-slider]');
    },
  });
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
    return () => {
      embla.off('select', onSelect);
      embla.off('reInit', onSelect);
    };
  }, [embla, onSelect]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {items.map(it => (
            <div key={it.id} className="min-w-0 shrink-0 grow-0 basis-full md:basis-[62%] lg:basis-1/2">
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
                  className={`h-2 rounded-full transition-all ${i === selected ? 'w-6 bg-brandy-rose-500' : 'w-2 bg-neutral-300'}`} />
        ))}
      </div>
    </div>
  );
}
