"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const { access_token } = await api.auth.login(email, password);
      localStorage.setItem("multas_token", access_token);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="mb-12 text-center">
          <h1 className="font-display text-2xl font-bold uppercase tracking-[0.3em] text-club-yellow">
            Multas
          </h1>
          <p className="mt-2 text-[11px] uppercase tracking-widest text-neutral-400">
            Panel de administración
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-neutral-500">
              Usuario
            </label>
            <input
              name="email"
              type="text"
              required
              autoComplete="username"
              className="w-full border-0 border-b border-neutral-700 bg-transparent px-0 py-2 text-sm text-neutral-100 focus:border-club-green-bright focus:outline-none"
              placeholder="rugbycastello"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-neutral-500">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border-0 border-b border-neutral-700 bg-transparent px-0 py-2 text-sm text-neutral-100 focus:border-club-green-bright focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full border border-white bg-white py-3 text-xs font-medium uppercase tracking-widest text-black transition-colors hover:border-club-green-bright hover:bg-club-green-bright hover:text-white disabled:opacity-50"
          >
            {cargando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
