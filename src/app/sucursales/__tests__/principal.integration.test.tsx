import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "@/test-utils/render";
import { screen, waitFor, fireEvent } from "@testing-library/react";

type ResponseLike = { ok: boolean; json: () => Promise<unknown> };
// Mock de useAuthFetch
const mockAuthFetch = vi.fn(
  async (
    url: string,
    opts?: Record<string, unknown>
  ): Promise<ResponseLike> => {
    if (
      typeof url === "string" &&
      url.endsWith("/principal") &&
      opts?.method === "POST"
    ) {
      return { ok: true, json: async () => ({ ok: true }) };
    }
    return { ok: true, json: async () => [] };
  }
);
vi.mock("@/lib/useAuthFetch", () => ({
  useAuthFetch: () => ({
    authFetch: mockAuthFetch,
    swrFetcher: async () => [],
  }),
}));

// Mock simple del componente de página para insertar el botón y hacer la llamada
function DummySucursales() {
  return (
    <table role="table">
      <tbody>
        <tr>
          <td>1</td>
          <td>Central</td>
          <td>Avenida</td>
          <td>
            <button
              data-testid="btn-principal"
              onClick={async () => {
                await mockAuthFetch("/api/sucursales/1/principal", {
                  method: "POST",
                });
              }}
            >
              Hacer principal
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

describe("Sucursales - marcar como principal", () => {
  beforeEach(() => mockAuthFetch.mockClear());

  it("envía POST al endpoint y no falla", async () => {
    renderWithProviders(<DummySucursales />);
    const btn = screen.getByTestId("btn-principal");
    fireEvent.click(btn);
    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledWith(
        "/api/sucursales/1/principal",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
