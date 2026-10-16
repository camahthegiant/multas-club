"use client";

import { NavBar } from "@/components/NavBar";

// Verificado (2026-10-04): responde 200 y no manda X-Frame-Options ni
// Content-Security-Policy con frame-ancestors, así que deja incrustarse.
const URL_ESTADISTICAS = "https://rugby-castello-stats.agileadad.io/";

export default function EstadisticasPage() {
  return (
    <div className="flex min-h-screen flex-col pb-20 sm:pb-0">
      <NavBar />
      <div className="flex-1">
        <iframe
          src={URL_ESTADISTICAS}
          title="Estadísticas del Club de Rugby Castelló"
          className="h-[calc(100vh-56px)] w-full border-0 sm:h-[calc(100vh-72px)]"
        />
      </div>
      <p className="px-4 py-3 text-center text-[11px] uppercase tracking-widest text-neutral-600">
        Si no carga,{" "}
        <a
          href={URL_ESTADISTICAS}
          target="_blank"
          rel="noopener noreferrer"
          className="text-club-green-bright hover:underline"
        >
          ábrela en una pestaña nueva
        </a>
      </p>
    </div>
  );
}
