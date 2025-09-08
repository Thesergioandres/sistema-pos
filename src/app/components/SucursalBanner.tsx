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
    <div className="bg-black text-zinc-100 px-4 py-2 text-base font-bold text-center shadow-sm border-b border-zinc-700 flex flex-col items-center gap-1">
      <div>
        <span className="mr-2">🏢</span>
        Operando en sucursal:{" "}
        {sucursalId ? (
          <span className="underline text-blue-400">
            {nombre ? nombre : `#${sucursalId}`}
          </span>
        ) : (
          <span className="italic text-red-400">Sin sucursal</span>
        )}
      </div>
      <SucursalSelector />
    </div>
  );
}
