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
           loading="lazy" decoding="async" draggable={false} />
      <img src={antes} alt={`${titulo} — before`}
           className="absolute inset-0 h-full w-full object-cover"
           style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
           loading="lazy" decoding="async" draggable={false} />
      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur">Before</span>
      <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur">After</span>
      <div className="absolute inset-y-0 pointer-events-none" style={{ left: `${pos}%` }}>
        <div className="h-full w-0.5 -translate-x-1/2 bg-white/90 shadow" />
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow w-10 h-10 flex items-center justify-center">
          <span className="text-neutral-700 text-sm">↔</span>
        </div>
      </div>
    </div>
  );
}
