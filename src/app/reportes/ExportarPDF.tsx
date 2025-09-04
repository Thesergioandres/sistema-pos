import jsPDF from "jspdf";
import "jspdf-autotable";

interface Venta {
  id: number | string;
  fecha?: string;
  usuarioNombre?: string;
  usuarioId?: number | string;
  total?: number;
}

export function exportarVentasPDF(
  ventas: Venta[],
  nombreArchivo = "reporte.pdf"
) {
  const doc = new jsPDF();
  const columns = [
    { header: "ID", dataKey: "id" },
    { header: "Fecha", dataKey: "fecha" },
    { header: "Usuario", dataKey: "usuario" },
    { header: "Total", dataKey: "total" },
  ];
  const rows = ventas.map((v) => ({
    id: v.id,
    fecha: v.fecha?.slice(0, 10),
    usuario: v.usuarioNombre || v.usuarioId,
    total: v.total?.toFixed(2),
  }));
  // @ts-expect-error: autoTable is not typed in jsPDF types
  doc.autoTable({ columns, body: rows });
  doc.save(nombreArchivo);
}
