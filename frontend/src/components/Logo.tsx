import { useId } from "react";

/**
 * Monograma + wordmark de la marca — tratamiento tipo "sello" de casa de
 * belleza (doble anillo + marcas cardinales + "MC" en ligadura itálica con
 * un trazo ornamental debajo), no un logo ilustrado. `id` único evita que
 * dos instancias del mismo SVG en la misma página compartan el gradiente.
 */
export function Monogram({ className = "" }: { className?: string }) {
  const gradientId = useId();

  return (
    <svg viewBox="0 0 44 44" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-champagne)" />
          <stop offset="100%" stopColor="var(--color-baby-pink)" />
        </linearGradient>
      </defs>

      <circle cx="22" cy="22" r="20.5" fill="none" stroke={`url(#${gradientId})`} strokeWidth="0.75" />
      <circle cx="22" cy="22" r="17" fill="none" stroke="var(--color-baby-pink)" strokeWidth="0.5" />

      {/* Marcas cardinales: el detalle que hace sentir "sello grabado" en vez de un círculo genérico. */}
      <g stroke="var(--color-champagne)" strokeWidth="0.6" strokeLinecap="round">
        <line x1="22" y1="1.8" x2="22" y2="4.6" />
        <line x1="22" y1="39.4" x2="22" y2="42.2" />
        <line x1="1.8" y1="22" x2="4.6" y2="22" />
        <line x1="39.4" y1="22" x2="42.2" y2="22" />
      </g>

      <text
        x="22"
        y="27.5"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontStyle="italic"
        fontWeight="600"
        fontSize="16.5"
        letterSpacing="-0.4"
        fill="var(--color-charcoal)"
      >
        MC
      </text>
      <path
        d="M13.5 31.5 Q22 34.5 30.5 31.5"
        stroke="var(--color-champagne)"
        strokeWidth="0.7"
        fill="none"
        strokeLinecap="round"
      />
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
