import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Página no encontrada</h1>
      <p className="mb-4">La página que buscas no existe.</p>
      <Link href="/" className="text-blue-600 underline">
        Volver al inicio
      </Link>
    </div>
  );
}
