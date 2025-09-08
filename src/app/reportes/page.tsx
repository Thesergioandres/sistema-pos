"use client";
import Link from "next/link";
import { withRole } from "../components/withRole";
import { withPermission } from "../components/withPermission";

function ReportesIndex() {
  const tiles = [
    { href: "/reportes/diario", title: "Diario", desc: "Ventas del día" },
    {
      href: "/reportes/semanal",
      title: "Semanal",
      desc: "Resumen de la semana",
    },
    {
      href: "/reportes/mensual",
      title: "Mensual",
      desc: "Tendencias del mes",
    },
    {
      href: "/reportes/personalizado",
      title: "Personalizado",
      desc: "Rango de fechas y filtros",
    },
    {
      href: "/reportes/pagos-divididos",
      title: "Pagos divididos",
      desc: "Detalle por métodos de pago",
    },
    {
      href: "/reportes/productos-mas-vendidos",
      title: "Productos más vendidos",
      desc: "Ranking por periodo o personalizado",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Reportes</h1>
      <p className="mb-6 text-sm md:text-base text-zinc-600 dark:text-zinc-300">
        Elige el reporte que quieres consultar.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group block rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold">{t.title}</h2>
              <span className="text-blue-600 group-hover:underline text-sm">
                Abrir
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 break-anywhere">
              {t.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default withPermission(
  withRole(ReportesIndex, ["admin", "supervisor"]),
  ["reportes.ver"]
);
