"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// sin tipos adicionales

function friendlyLabel(pathname: string): string {
  const p = pathname.split("?")[0];
  const map: Array<{ test: (p: string) => boolean; label: string }> = [
    { test: (x) => x === "/", label: "Inicio" },
    { test: (x) => x.startsWith("/login"), label: "Inicio de sesión" },
    { test: (x) => x.startsWith("/register"), label: "Registro" },
    {
      test: (x) => x.startsWith("/onboarding/negocio"),
      label: "Crear negocio",
    },
    {
      test: (x) => x.startsWith("/ventas/pendientes"),
      label: "Ventas pendientes",
    },
    {
      test: (x) => x.startsWith("/ventas/listado"),
      label: "Listado de ventas",
    },
    { test: (x) => x.startsWith("/ventas"), label: "Ventas" },
    { test: (x) => x.startsWith("/productos"), label: "Catálogo de productos" },
    { test: (x) => x.startsWith("/insumos"), label: "Catálogo de insumos" },
    { test: (x) => x.startsWith("/clientes"), label: "Clientes" },
    { test: (x) => x.startsWith("/usuarios"), label: "Usuarios" },
    { test: (x) => x.startsWith("/sucursales"), label: "Sucursales" },
    { test: (x) => x.startsWith("/combos"), label: "Combos" },
    {
      test: (x) => x.startsWith("/reportes/pagos-divididos"),
      label: "Reportes de pagos divididos",
    },
    {
      test: (x) => x.startsWith("/reportes/productos-mas-vendidos"),
      label: "Reportes de productos más vendidos",
    },
    {
      test: (x) => x.startsWith("/reportes/personalizado"),
      label: "Reportes personalizados",
    },
    {
      test: (x) => x.startsWith("/reportes/mensual"),
      label: "Reportes mensuales",
    },
    {
      test: (x) => x.startsWith("/reportes/semanal"),
      label: "Reportes semanales",
    },
    {
      test: (x) => x.startsWith("/reportes/diario"),
      label: "Reportes diarios",
    },
    { test: (x) => x.startsWith("/reportes"), label: "Reportes" },
  ];
  for (const it of map) if (it.test(p)) return it.label;
  // Fallback legible a partir del path
  const parts = p
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/[-_]/g, " "));
  return parts.length ? parts.join(" — ") : "Cargando";
}

export default function RouteLoadingBar() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [percent, setPercent] = useState(0);
  const [target, setTarget] = useState<string>("");
  const timerRef = useRef<number | null>(null);
  const navStartHrefRef = useRef<string | null>(null);

  // Inicia el progreso
  const startRef = useRef<(href: string) => void>(() => {});
  const finishRef = useRef<() => void>(() => {});
  const start = useCallback(
    (href: string) => {
      if (active) return; // ya en progreso
      navStartHrefRef.current = href;
      setTarget(friendlyLabel(href));
      setActive(true);
      setPercent(8);
      // Simular avance hasta 90%
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setPercent((p) => {
          const next = p < 70 ? p + 5 : p < 90 ? p + 2 : p + 0.5;
          return next >= 90 ? 90 : next;
        });
      }, 120);
    },
    [active]
  );

  // Finaliza el progreso
  const finish = useCallback(() => {
    if (!active) return;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPercent(100);
    window.setTimeout(() => {
      setActive(false);
      setPercent(0);
      setTarget("");
      navStartHrefRef.current = null;
    }, 250);
  }, [active]);

  // Mantener refs actualizadas para evitar dependencias de hooks
  useEffect(() => {
    startRef.current = start;
    finishRef.current = finish;
  }, [start, finish]);

  // Detectar inicio de navegación (clicks en links internos y popstate)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const a = el?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const targetAttr = a.getAttribute("target");
      const ctrl = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;
      if (href.startsWith("/") && !ctrl && !targetAttr) startRef.current(href);
    };
    window.addEventListener("click", onClick, true);

    const onPop = () =>
      startRef.current(window.location.pathname + window.location.search);
    window.addEventListener("popstate", onPop);

    // Inicio de navegación programática (emitido por la app)
    const onAppNav = (e: Event) => {
      const ce = e as CustomEvent<{ href?: string }>;
      const href = ce.detail?.href || window.location.pathname;
      if (href) startRef.current(href);
    };
    window.addEventListener("app:navigation", onAppNav as EventListener);

    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("app:navigation", onAppNav as EventListener);
    };
  }, []);

  // Completar al cambiar el pathname (navegación efectuada)
  const pathMemo = useMemo(() => pathname, [pathname]);
  useEffect(() => {
    if (!active) return;
    // Si el path actual coincide con el destino empezado, finalizar
    const dest = navStartHrefRef.current;
    if (!dest) return finishRef.current();
    const destPath = dest.split("?")[0];
    if (pathMemo === destPath) finishRef.current();
  }, [active, pathMemo]);

  if (!active) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[1000] pointer-events-none"
    >
      <div className="bg-black/80 text-white rounded-full shadow-lg px-4 py-2 flex items-center gap-3 min-w-[300px] max-w-[90vw] justify-center">
        <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-[width] duration-100 ease-linear"
            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          />
        </div>
        <div className="text-sm">
          <span className="font-semibold">{Math.floor(percent)}%</span>
          <span className="opacity-80">
            {" "}
            • Cargando {target || "contenido"}
          </span>
        </div>
      </div>
    </div>
  );
}
