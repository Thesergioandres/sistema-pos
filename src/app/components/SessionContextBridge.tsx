"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUsuario } from "@/contexts/usuario/Provider";
import { useSucursal } from "@/contexts/sucursal/Provider";

export default function SessionContextBridge() {
  const { data: session } = useSession();
  const { setUsuario } = useUsuario();
  const { setSucursalId } = useSucursal();

  useEffect(() => {
    if (session?.user) {
      setUsuario({
        id: session.user.id,
        nombre: session.user.nombre,
        rol: session.user.rol,
        sucursalId: session.user.sucursalId,
      });
      setSucursalId(session.user.sucursalId);
    } else {
      setUsuario(undefined);
      setSucursalId(undefined);
    }
  }, [session, setUsuario, setSucursalId]);

  return null;
}
