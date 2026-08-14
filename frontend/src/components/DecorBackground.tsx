import { Monogram } from "./Logo";
import { Sparkle } from "./Sparkle";

/**
 * Composición asimétrica de dos manchas grandes y muy suaves — profundidad
 * de fondo sin ruido visual — más un monograma gigante casi invisible como
 * marca de agua (motivo que usan Dior/Chanel para dar peso de marca sin
 * fotografía) y un puñado de sparkles estáticos. `aria-hidden` +
 * `pointer-events-none`: nunca deben interceptar foco ni clicks. Requiere un
 * contenedor `relative overflow-hidden`.
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

      <Sparkle className="absolute left-[8%] top-[16%] h-4 w-4 opacity-40" />
      <Sparkle className="absolute right-[16%] top-[42%] h-3 w-3 opacity-30" />
      <Sparkle className="absolute left-[22%] bottom-[14%] h-5 w-5 opacity-[0.22]" />
    </div>
  );
}
