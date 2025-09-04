// Utilidad para registrar una venta desde el frontend
export interface ProductoVenta {
  productoId: number;
  cantidad: number;
}
export interface PagoVenta {
  tipo: string;
  monto: number;
}
export interface VentaPayload {
  usuarioId: number;
  productos: ProductoVenta[];
  total: number;
  pagos: PagoVenta[];
  cambio: number;
}

export async function registrarVenta(payload: VentaPayload) {
  const res = await fetch("/api/ventas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || "Error al registrar venta");
  }
  return res.json();
}
