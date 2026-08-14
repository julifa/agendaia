/**
 * Monograma + wordmark de la marca. Reemplaza el texto plano que había en
 * el header/footer por un tratamiento propio (anillo fino + "MC" en serif),
 * el mismo lenguaje visual que usan las casas de belleza de nivel (un
 * monograma discreto, no un logo ilustrado).
 */
export function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="none" stroke="var(--color-champagne)" strokeWidth="0.75" />
      <circle cx="20" cy="20" r="15.5" fill="none" stroke="var(--color-baby-pink)" strokeWidth="1" />
      <text
        x="20"
        y="26"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fontSize="16"
        fill="var(--color-charcoal)"
      >
        MC
      </text>
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Monogram className="h-8 w-8 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.95rem] font-semibold tracking-[0.01em] text-charcoal">
          MC Nails
        </span>
        <span className="text-[9px] font-medium uppercase tracking-[0.4em] text-champagne">
          Studio
        </span>
      </span>
    </div>
  );
}
