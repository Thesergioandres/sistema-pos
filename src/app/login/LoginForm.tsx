"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) setError("Credenciales incorrectas");
      else {
        let dest = "/";
        try {
          const last = localStorage.getItem("last_view");
          if (last && last !== "/login" && last !== "/register") dest = last;
        } catch {}
        // Disparar barra de carga y navegar con router
        window.dispatchEvent(
          new CustomEvent("app:navigation", { detail: { href: dest } })
        );
        router.replace(dest);
      }
    } catch {
      setError(
        "Error inesperado al iniciar sesión. Intenta de nuevo más tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-zinc-800 p-8 rounded shadow w-full max-w-sm flex flex-col gap-4 mx-auto mt-24"
    >
      <h1 className="text-2xl font-bold mb-2 text-center">Iniciar sesión</h1>
      <input
        name="email"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        className="border p-2 rounded"
      />
      <input
        name="password"
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        className="border p-2 rounded"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
      {error && <div className="text-red-600 text-sm text-center">{error}</div>}
      <div className="text-center mt-2">
        <span className="text-sm">¿No tienes cuenta? </span>
        <Link
          href="/register"
          prefetch={false}
          className="text-blue-600 underline text-sm"
        >
          Regístrate
        </Link>
      </div>
    </form>
  );
}
