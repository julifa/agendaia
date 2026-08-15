import { Monogram } from "./Logo";

/**
 * Composición asimétrica de dos manchas grandes y muy suaves — profundidad
 * de fondo sin ruido visual — más un monograma gigante casi invisible como
 * marca de agua (motivo que usan Dior/Chanel para dar peso de marca sin
 * fotografía). Sin sparkles dispersos a propósito: ese recurso lee más
 * "simpático" que "atelier" cuando se repite por el fondo — el peso de marca
 * lo da la marca de agua, no el confeti. `aria-hidden` + `pointer-events-none`:
 * nunca deben interceptar foco ni clicks. Requiere un contenedor
 * `relative overflow-hidden`.
 */
export function DecorBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="decor-blob -right-32 -top-40 h-[26rem] w-[26rem] bg-baby-pink" />
      <div
        className="decor-blob -bottom-32 -left-24 h-96 w-96 bg-champagne/70"
        style={{ animationDelay: "-9s" }}
      />

      <Monogram className="absolute -right-14 top-20 h-72 w-72 -rotate-6 opacity-[0.05] sm:h-[26rem] sm:w-[26rem]" />
    </div>
  );
}
