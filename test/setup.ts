import "@testing-library/jest-dom/vitest";
import { server } from "./server.js";
import { vi, beforeAll, afterEach, afterAll } from "vitest";

// Inicia MSW antes de todas las pruebas
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Resetea handlers entre pruebas
afterEach(() => server.resetHandlers());

// Cierra MSW al terminar
afterAll(() => server.close());

// Mocks de módulos usados en exportaciones para que no fallen en pruebas
vi.mock("xlsx", () => ({
  default: {},
  utils: {
    json_to_sheet: () => ({}),
    book_new: () => ({}),
    book_append_sheet: () => {},
  },
  writeFile: () => {},
}));
vi.mock("jspdf", () => ({
  default: class JsPDF {
    save() {}
  },
}));
vi.mock("jspdf-autotable", () => ({
  default: () => {},
}));
