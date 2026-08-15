/**
 * Fila de pastillas de color estilo "rack de esmaltes" — un motivo gráfico
 * característico de nail studios que no depende de fotografía. Los tonos
 * son variaciones puramente decorativas alrededor de la paleta de marca,
 * nunca se reutilizan como color funcional en la UI.
 */
const SWATCHES = [
  "#ddb2b9", // baby-pink
  "#bd9a56", // champagne
  "#a97e83", // mauve profundo
  "#faf6f1", // soft-white
  "#8f7768", // taupe cálido
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
            boxShadow: "0 3px 8px -2px rgba(58, 51, 46, 0.28)",
          }}
        />
      ))}
    </div>
  );
}
