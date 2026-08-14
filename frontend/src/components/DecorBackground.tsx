/**
 * Composición asimétrica de dos manchas grandes y muy suaves — profundidad
 * de fondo sin ruido visual. `aria-hidden` + `pointer-events-none`: nunca
 * deben interceptar foco ni clicks. Requiere un contenedor `relative
 * overflow-hidden`.
 */
export function DecorBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="decor-blob -right-32 -top-40 h-[26rem] w-[26rem] bg-baby-pink" />
      <div
        className="decor-blob -bottom-32 -left-24 h-96 w-96 bg-champagne/70"
        style={{ animationDelay: "-9s" }}
      />
    </div>
  );
}
