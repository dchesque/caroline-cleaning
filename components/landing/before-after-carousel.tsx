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
