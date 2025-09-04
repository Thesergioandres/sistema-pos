import * as XLSX from "xlsx";

interface Venta {
  id: number;
  producto: string;
  cantidad: number;
  total: number;
  // Add or modify properties as needed to match your data structure
}

export function exportarVentasExcel(
  ventas: Venta[],
  nombreArchivo = "reporte.xlsx"
) {
  const ws = XLSX.utils.json_to_sheet(ventas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ventas");
  XLSX.writeFile(wb, nombreArchivo);
}
