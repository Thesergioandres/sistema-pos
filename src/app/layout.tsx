import SessionWrapper from "./components/SessionWrapper";
import AppShell from "./components/AppShell";
import "./globals.css";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { SucursalProvider } from "@/contexts/sucursal/Provider";
import { UsuarioProvider } from "@/contexts/usuario/Provider";
import SessionContextBridge from "@/app/components/SessionContextBridge";
import ServiceWorkerRegister from "@/app/components/ServiceWorkerRegister";
import PreloadAppData from "@/app/components/PreloadAppData";
import ServiceWorkerKiller from "@/app/components/ServiceWorkerKiller";
import RouteLoadingBar from "./components/RouteLoadingBar";
import ConsoleNoiseFilter from "@/app/components/ConsoleNoiseFilter";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-sans min-h-screen">
        <SessionWrapper>
          <UsuarioProvider>
            <SucursalProvider>
              <ToastProvider>
                <SessionContextBridge />
                <PreloadAppData />
                {/* En dev, limpia SW y caches para evitar chunks antiguos */}
                <ServiceWorkerKiller />
                {/* Silencia ruido de extensiones en dev */}
                <ConsoleNoiseFilter />
                <ServiceWorkerRegister />
                <RouteLoadingBar />
                <AppShell>{children}</AppShell>
              </ToastProvider>
            </SucursalProvider>
          </UsuarioProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
