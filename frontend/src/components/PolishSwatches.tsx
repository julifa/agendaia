/**
 * Fila de pastillas de color estilo "rack de esmaltes" — un motivo gráfico
 * característico de nail studios que no depende de fotografía. Los tonos
 * son variaciones puramente decorativas alrededor de la paleta de marca,
 * nunca se reutilizan como color funcional en la UI.
 */
const SWATCHES = [
  "#f8c8dc", // baby-pink
  "#d4af37", // champagne
  "#e8b4bc", // rosa mauve, variación
  "#fff5f7", // soft-white
  "#c9a0a8", // taupe rosado
];

export function PolishSwatches() {
  return (
    <div className="flex -space-x-2.5" aria-hidden="true">
      {SWATCHES.map((color, i) => (
        <span
          key={color}
          className="h-7 w-7 rounded-full border-2 border-soft-white transition-transform duration-300 hover:-translate-y-1"
          style={{
            backgroundColor: color,
            zIndex: SWATCHES.length - i,
            boxShadow: "0 3px 8px -2px rgba(74, 74, 74, 0.25)",
          }}
        />
      ))}
    </div>
  );
}
