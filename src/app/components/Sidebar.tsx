"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CerrarSesionButton from "./CerrarSesionButton";
import { useAuthFetch } from "@/lib/useAuthFetch";
import useSWR from "swr";

const links = [
  { href: "/login", label: "Login" },
  { href: "/ventas", label: "Registrar venta" },
  { href: "/ventas/listado", label: "Listado de ventas" },
  { href: "/productos", label: "Productos" },
  { href: "/clientes", label: "Clientes" },
  { href: "/insumos", label: "Insumos" },
  { href: "/recetas", label: "Recetas" },
  { href: "/reportes/diario", label: "Reporte Diario" },
  { href: "/reportes/semanal", label: "Reporte Semanal" },
  { href: "/reportes/mensual", label: "Reporte Mensual" },
  { href: "/reportes/personalizado", label: "Reporte Personalizado" },
  { href: "/reportes/productos-mas-vendidos", label: "Productos Más Vendidos" },
  { href: "/reportes/pagos-divididos", label: "Pagos Divididos" },
  { href: "/sucursales", label: "Sucursales" },
  { href: "/usuarios", label: "Usuarios" },
  { href: "/combos", label: "Combos" },
  { href: "/combos/nuevo", label: "Nuevo Combo" },
  { href: "/negocio", label: "Resumen del negocio" },
  // La edición requiere un id dinámico, se accede desde la lista de combos
  // o desde acciones de cada fila. Evitamos hrefs dinámicos inválidos en App Router.
];

export default function Sidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const { swrFetcher } = useAuthFetch();
  const userObj: Record<string, unknown> | undefined =
    session?.user && typeof session.user === "object"
      ? (session.user as unknown as Record<string, unknown>)
      : undefined;
  const permisos: Record<string, boolean> =
    (userObj?.permisos as Record<string, boolean>) || {};
  const rol =
    typeof userObj?.rol === "string" ? (userObj.rol as string) : undefined;
  const canNegocios = rol === "admin" || permisos["usuarios.gestion"] === true;
  const { data: negocios = [] } = useSWR<{ id: number; nombre: string }[]>(
    session?.user && canNegocios ? "/api/negocios" : null,
    (url: string) => swrFetcher(url)
  );
  return (
    <nav className="bg-white dark:bg-zinc-900 shadow rounded-lg p-3 flex flex-col gap-2 w-full lg:w-60">
      <div className="mb-1 text-xs text-center px-2">
        {session?.user ? (
          <span className="text-green-700">
            ¡Has iniciado sesión como{" "}
            <b>{session.user.nombre || session.user.email}</b>!
          </span>
        ) : (
          <span className="text-blue-700">
            Inicia sesión o regístrate para acceder a todas las funciones.
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-1">
        {session?.user && Array.isArray(negocios) && negocios.length > 1 && (
          <div className="px-2 py-1 mb-2 border rounded">
            <div className="text-xs font-semibold mb-1">Negocio</div>
            <select
              className="w-full border p-1 rounded text-sm"
              onChange={(e) => {
                // Nota: se puede persistir negocioId en localStorage para filtrar reportes y listados
                try {
                  localStorage.setItem("negocioId", e.target.value);
                } catch {}
              }}
              defaultValue={
                typeof window !== "undefined"
                  ? localStorage.getItem("negocioId") || String(negocios[0]?.id)
                  : String(negocios[0]?.id)
              }
            >
              {negocios.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        {links.map((link) => (
          <Link
            prefetch={false}
            onMouseEnter={() => {
              // Prefetch por interacción
              try {
                void router.prefetch(link.href);
              } catch {}
            }}
            onFocus={() => {
              try {
                void router.prefetch(link.href);
              } catch {}
            }}
            onClick={() => {
              try {
                localStorage.setItem("last_view", link.href);
              } catch {}
            }}
            key={link.href}
            href={link.href}
            className="px-3 py-2 rounded border border-transparent hover:border-blue-200 dark:hover:border-zinc-700 hover:bg-blue-50/60 dark:hover:bg-zinc-800/60 text-blue-700 dark:text-blue-200 font-medium transition-colors truncate"
            title={link.label}
          >
            {link.label}
          </Link>
        ))}
      </div>
      {session?.user && <CerrarSesionButton />}
    </nav>
  );
}
