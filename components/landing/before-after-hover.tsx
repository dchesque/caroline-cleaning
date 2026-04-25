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
