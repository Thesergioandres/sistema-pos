import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

import SessionTimeoutProvider from "../components/SessionTimeoutProvider";
import SessionWrapper from "./components/SessionWrapper";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import PushNotificationRegister from "./components/PushNotificationRegister";
import OfflineBanner from "./components/OfflineBanner";
import SucursalBanner from "./components/SucursalBanner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POS Bebidas",
  description: "Sistema de Punto de Venta para Bebidas",
};

const menu = [
  {
    href: "/insumos",
    label: "Insumos",
    icon: (
      <svg
        className="w-5 h-5 mr-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    href: "/productos",
    label: "Productos",
    icon: (
      <svg
        className="w-5 h-5 mr-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M16 3v4M8 3v4" />
      </svg>
    ),
  },
  {
    href: "/recetas",
    label: "Recetas",
    icon: (
      <svg
        className="w-5 h-5 mr-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    ),
  },
  {
    href: "/ventas",
    label: "Ventas",
    icon: (
      <svg
        className="w-5 h-5 mr-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M3 3h18v18H3V3z" />
        <path d="M16 8a4 4 0 11-8 0" />
      </svg>
    ),
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    icon: (
      <svg
        className="w-5 h-5 mr-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 21a7.5 7.5 0 0113 0" />
      </svg>
    ),
  },
  {
    href: "/reportes/diario",
    label: "Reportes",
    icon: (
      <svg
        className="w-5 h-5 mr-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M9 17v-2a4 4 0 018 0v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

function Sidebar() {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  return (
    <aside className="w-56 bg-zinc-100 dark:bg-zinc-900 p-6 flex flex-col gap-4 min-h-screen border-r">
      <h2 className="text-lg font-bold mb-4">POS Bebidas</h2>
      <nav className="flex flex-col gap-2">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-2 rounded transition-colors ${
              pathname.startsWith(item.href)
                ? "bg-blue-600 text-white"
                : "hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} antialiased flex min-h-screen bg-background text-foreground`}
      >
        <SessionWrapper>
          <SessionTimeoutProvider>
            <ServiceWorkerRegister />
            <PushNotificationRegister />
            <OfflineBanner />
            <SucursalBanner />
            <Sidebar />
            <main className="flex-1">{children}</main>
          </SessionTimeoutProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
