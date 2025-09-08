import React from "react";
import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils/render";
import ProductosMasVendidosPage from "../productos-mas-vendidos/page";

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: 1, rol: "admin", sucursalId: 1 } },
  }),
}));

describe("Productos más vendidos", () => {
  it("cambia de preset a personalizado y habilita inputs", async () => {
    renderWithProviders(<ProductosMasVendidosPage />);
    const personalizado = screen.getByText("Personalizado");
    fireEvent.click(personalizado);
    // page usa <input type="date"> (role no es textbox en jsdom), buscamos por atributo
    const dates = document.querySelectorAll(
      'input[type="date"]'
    ) as NodeListOf<HTMLInputElement>;
    expect(dates[0].disabled).toBe(false);
  });

  it("renderiza la tabla de ranking", async () => {
    renderWithProviders(<ProductosMasVendidosPage />);
    await waitFor(() =>
      expect(screen.getByText("Productos más vendidos")).toBeInTheDocument()
    );
    // Espera a que termine el debounce/fetch y se pinte el nombre
    await waitFor(() =>
      expect(screen.getByText("Producto A")).toBeInTheDocument()
    );
  });
});
