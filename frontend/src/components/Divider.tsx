import { Sparkle } from "./Sparkle";

/** Separador ornamental: línea + sparkle, en vez de un `<hr>` genérico. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-charcoal/15" />
      <Sparkle className="h-3 w-3 shrink-0" />
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-charcoal/15" />
    </div>
  );
}
