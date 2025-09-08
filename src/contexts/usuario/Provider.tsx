"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { Usuario, UsuarioContextValue } from "./types";

const Ctx = createContext<UsuarioContextValue | null>(null);

export function UsuarioProvider({
  children,
  initialUsuario,
}: {
  children: React.ReactNode;
  initialUsuario?: Usuario;
}) {
  const [usuario, setUsuarioState] = useState<Usuario | undefined>(
    initialUsuario
  );
  const setUsuario = useCallback((u?: Usuario) => setUsuarioState(u), []);
  const value = useMemo(() => ({ usuario, setUsuario }), [usuario, setUsuario]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUsuario() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUsuario debe usarse dentro de UsuarioProvider");
  return v;
}
