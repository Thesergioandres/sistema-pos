"use client";
import { signOut } from "next-auth/react";

export default function CerrarSesionButton() {
  return (
    <button
      className="bg-red-600 text-white px-3 py-2 rounded mt-4 hover:bg-red-700 font-semibold w-full"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Cerrar sesión
    </button>
  );
}
