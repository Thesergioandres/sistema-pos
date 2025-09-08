"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { SucursalContextValue } from "./types";

const Ctx = createContext<SucursalContextValue | null>(null);

export function SucursalProvider({
  children,
  initialSucursalId,
}: {
  children: React.ReactNode;
  initialSucursalId?: number;
}) {
  const [sucursalId, setSucursalIdState] = useState<number | undefined>(
    initialSucursalId
  );
  const setSucursalId = useCallback(
    (id?: number) => setSucursalIdState(id),
    []
  );
  const value = useMemo(
    () => ({ sucursalId, setSucursalId }),
    [sucursalId, setSucursalId]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSucursal() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSucursal debe usarse dentro de SucursalProvider");
  return v;
}
