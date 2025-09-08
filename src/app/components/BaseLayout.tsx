"use client";
import React, { Suspense, lazy, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const SidebarLazy = lazy(() => import("./Sidebar"));
import OfflineBanner from "./OfflineBanner";
import SyncVentasBanner from "./SyncVentasBanner";
import SucursalBanner from "./SucursalBanner";
import Spinner from "./Spinner";
import ReloadDataButton from "./ReloadDataButton";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  // Persistir última vista (ruta actual) para sugerir prefetch tras login
  useEffect(() => {
    try {
      const path = window.location.pathname;
      localStorage.setItem("last_view", path);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      const last = localStorage.getItem("last_view");
      if (last) void router.prefetch(last);
    } catch {}
  }, [router]);
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 py-2">
          <button
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 className="text-xl font-semibold">POS Bebidas</h1>
          <div className="ml-auto flex items-center gap-2">
            <SucursalBanner />
            <ReloadDataButton />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <OfflineBanner />
          <SyncVentasBanner />
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* Static sidebar in desktop */}
        <aside className="hidden lg:block w-60 p-4 border-r border-zinc-200 dark:border-zinc-800">
          <Suspense fallback={<Spinner label="Cargando menú" />}>
            <SidebarLazy />
          </Suspense>
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-zinc-900 shadow-xl p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Menú</span>
                <button
                  className="inline-flex w-9 h-9 items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menú"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <Suspense fallback={<Spinner label="Cargando menú" />}>
                <SidebarLazy />
              </Suspense>
            </div>
          </div>
        )}

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
