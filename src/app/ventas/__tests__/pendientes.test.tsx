import React from "react";
import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils/render";
import PendientesPage from "../pendientes/page";

// Mock del wrapper de roles para permitir render directo
vi.mock("../../components/withRole", () => ({
  withRole: (Comp: unknown) => Comp as React.ComponentType,
}));

// Mock de next/navigation hooks usados en la página
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));
// Mock de SucursalSelector dentro de layout si llegara a montarse
vi.mock("../../components/SucursalSelector", () => ({ default: () => null }));

// Mock del contexto de sesión
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: 1, rol: "admin" } } }),
}));

// Mock de useAuthFetch para forzar datos
vi.mock("@/lib/useAuthFetch", () => ({
  useAuthFetch: () => ({
    swrFetcher: async () => [
      {
        id: 101,
        fecha: "2025-09-07T00:00:00.000Z",
        total: 100,
        pagado: 20,
        saldo: 80,
      },
    ],
  }),
}));

describe("Ventas pendientes", () => {
  it("muestra la tabla con una venta pendiente", async () => {
    renderWithProviders(<PendientesPage />);
    await waitFor(() =>
      expect(screen.getByText("Ventas pendientes")).toBeInTheDocument()
    );
    expect(screen.getByText("101")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });
});
