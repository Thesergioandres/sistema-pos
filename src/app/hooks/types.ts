// Tipos para ventas offline y sincronización
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
