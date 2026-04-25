'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const total = items.length;
  const showNav = total > 1;

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);

    const cards = el.querySelectorAll<HTMLElement>('[data-card]');
    let nearest = 0;
    let nearestDist = Infinity;
    cards.forEach((c, i) => {
      const dist = Math.abs(c.offsetLeft - el.scrollLeft);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setActiveIndex(nearest);
  }, []);

  const scrollByOne = useCallback((direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    if (!card) return;
    const step = card.offsetWidth + 16;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  }, []);

  const scrollToIndex = useCallback((idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelectorAll<HTMLElement>('[data-card]')[idx];
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft') scrollByOne(-1);
      else if (e.key === 'ArrowRight') scrollByOne(1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scrollByOne]);

  const Card = displayMode === 'hover' ? BeforeAfterHover : BeforeAfterSlider;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="relative">
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {items.map(it => (
            <div
              key={it.id}
              data-card
              className="snap-start shrink-0 basis-full md:basis-1/2 lg:basis-1/3"
            >
              <Card
                antes={it.imagem_antes}
                depois={it.imagem_depois}
                titulo={it.titulo}
                tipoServico={it.tipo_servico}
                cidade={it.cidade}
              />
            </div>
          ))}
        </div>

        {showNav && (
          <>
            <button
              type="button"
              aria-label="Previous result"
              onClick={() => scrollByOne(-1)}
              disabled={!canPrev}
              className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white shadow-md hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed z-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next result"
              onClick={() => scrollByOne(1)}
              disabled={!canNext}
              className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white shadow-md hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed z-10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {showNav && (
        <div className="mt-6 flex justify-center gap-3 overflow-x-auto pb-1">
          {items.map((it, i) => (
            <button
              key={it.id}
              type="button"
              aria-label={`Show ${it.titulo}`}
              onClick={() => scrollToIndex(i)}
              className={`relative shrink-0 overflow-hidden rounded-md transition ${
                i === activeIndex
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

      <div className="mt-12 text-center">
        <p className="text-2xl md:text-3xl font-heading text-foreground">
          {statCount}+ homes transformed in {statRegion}
        </p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brandy-rose-500 px-6 py-3 text-sm font-medium text-white shadow hover:bg-brandy-rose-600 transition-colors"
        >
          Book yours <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}
