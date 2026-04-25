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
