"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getSucursalNombre } from "../utils/getSucursalNombre";
import dynamic from "next/dynamic";

const SucursalSelector = dynamic(() => import("./SucursalSelector"), {
  ssr: false,
});

export default function SucursalBanner() {
  const { data: session } = useSession();
  const sucursalId = session?.user?.sucursalId;
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    if (sucursalId) {
      getSucursalNombre(sucursalId).then(setNombre);
    }
  }, [sucursalId]);

  return (
    <div className="bg-blue-200 text-blue-900 px-4 py-2 text-base font-bold text-center shadow-sm border-b border-blue-300 flex flex-col items-center gap-1">
      <div>
        <span className="mr-2">🏢</span>
        Operando en sucursal:{" "}
        {sucursalId ? (
          <span className="underline">
            {nombre ? nombre : `#${sucursalId}`}
          </span>
        ) : (
          <span className="italic">Sin sucursal</span>
        )}
      </div>
      <SucursalSelector />
    </div>
  );
}
