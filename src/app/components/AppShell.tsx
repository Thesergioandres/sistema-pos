"use client";
import { usePathname } from "next/navigation";
import BaseLayout from "./BaseLayout";

const BARE_PATHS = new Set(["/login", "/register"]);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname && BARE_PATHS.has(pathname)) {
    return <>{children}</>;
  }
  return <BaseLayout>{children}</BaseLayout>;
}
