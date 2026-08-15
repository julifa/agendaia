const ITEMS = ["Manicura", "Pedicura", "Nail Art", "Spa de manos", "Cuidado profesional"];

/**
 * Cinta de texto en loop infinito — el mismo recurso que usan Chillhouse o
 * Paintbox para reforzar marca sin depender de fotografía. El contenido se
 * duplica; la animación desliza exactamente la mitad del ancho total, así
 * el loop no se nota. Separador: un punto discreto, no un sparkle — repetido
 * cada palabra el motivo de estrella lee "recargado" en vez de editorial.
 */
export function Marquee() {
  const content = (
    <span className="flex shrink-0 items-center gap-3 pr-3">
      {ITEMS.map((item) => (
        <span key={item} className="flex items-center gap-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-charcoal/45">
            {item}
          </span>
          <span className="h-[3px] w-[3px] rounded-full bg-champagne/60" />
        </span>
      ))}
    </span>
  );

  return (
    <div className="overflow-hidden border-y border-charcoal/8 py-2.5" aria-hidden="true">
      <div className="marquee-track">
        {content}
        {content}
      </div>
    </div>
  );
}
