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
    <div className="flex -space-x-2" aria-hidden="true">
      {SWATCHES.map((color, i) => (
        <span
          key={color}
          className="h-6 w-6 rounded-full border-2 border-soft-white shadow-sm"
          style={{ backgroundColor: color, zIndex: SWATCHES.length - i }}
        />
      ))}
    </div>
  );
}
