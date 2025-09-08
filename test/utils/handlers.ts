import { http, HttpResponse } from "msw";

// Handlers por defecto; se pueden extender por prueba
export const handlers = [
  // Ejemplo: mock de productos más vendidos
  http.get("/api/reportes/productos-mas-vendidos", () => {
    // Respuesta mínima para UI
    return HttpResponse.json([
      {
        productoId: 1,
        nombre: "Producto A",
        precio: 10,
        cantidadVendida: 5,
        ingresos: 50,
      },
      {
        productoId: 2,
        nombre: "Producto B",
        precio: 8,
        cantidadVendida: 3,
        ingresos: 24,
      },
    ]);
  }),
];
