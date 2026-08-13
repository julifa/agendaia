import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Sin `globals: true` en vite.config.ts, Testing Library no detecta un
// `afterEach` global y no desmonta el DOM entre tests: sin este cleanup
// explícito, el segundo `render()` de un archivo pisa contra los nodos que
// dejó el primero (falsos "multiple elements found").
afterEach(() => {
  cleanup();
});
