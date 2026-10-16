"use client";

import { useEffect, useState } from "react";
import {
  api,
  type JugadorCard as JugadorCardType,
  type JugadorDetalle,
  type ResumenTemporada,
  type TipoInfraccion,
} from "@/lib/api";
import { CartaJugador } from "@/components/CartaJugador";
import { DetalleJugador } from "@/components/DetalleJugador";
import { GraficoTipos } from "@/components/GraficoTipos";
import { NavBar } from "@/components/NavBar";
import { formatEUR } from "@/lib/format";

export default function HomePage() {
  const [temporadas, setTemporadas] = useState<string[]>([]);
  const [temporada, setTemporada] = useState<string>("");
  const [jugadores, setJugadores] = useState<JugadorCardType[]>([]);
  const [tipos, setTipos] = useState<TipoInfraccion[]>([]);
  const [resumen, setResumen] = useState<ResumenTemporada | null>(null);
  const [detalle, setDetalle] = useState<JugadorDetalle | null>(null);
  const [indiceDetalle, setIndiceDetalle] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.resumen.temporadas(), api.tipos.listar()])
      .then(([r, t]) => {
        setTemporadas(r.temporadas);
        setTemporada(r.actual);
        setTipos(t);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error cargando datos"));
  }, []);

  useEffect(() => {
    if (!temporada) return;
    setCargando(true);
    Promise.all([api.jugadores.listar(temporada), api.resumen.obtener(temporada)])
      .then(([j, r]) => {
        setJugadores(j);
        setResumen(r);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error cargando datos"))
      .finally(() => setCargando(false));
  }, [temporada]);

  useEffect(() => {
    if (indiceDetalle === null) return;
    const id = jugadores[indiceDetalle]?.id;
    if (!id) return;
    api.jugadores
      .detalle(id, temporada)
      .then(setDetalle)
      .catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar el jugador"));
  }, [indiceDetalle, jugadores, temporada]);

  function moverDetalle(delta: number) {
    setIndiceDetalle((i) => {
      if (i === null) return i;
      return (i + delta + jugadores.length) % jugadores.length;
    });
  }

  return (
    <div className="pb-20 sm:pb-0">
      <NavBar />
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <header className="mb-8 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/escudo.png" alt="Club de Rugby Castelló" className="h-20 w-auto" />
          <div>
            <h1 className="font-display text-xl font-bold uppercase tracking-[0.25em] text-neutral-100">
              Multas del equipo
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-neutral-500">
              Club de Rugby Castelló
            </p>
          </div>

          {temporadas.length > 0 && (
            <select
              value={temporada}
              onChange={(e) => setTemporada(e.target.value)}
              className="mt-2 border-0 border-b border-neutral-700 bg-transparent px-0 py-1 text-center text-sm uppercase tracking-widest text-neutral-300 focus:border-club-green-bright focus:outline-none"
            >
              {temporadas.map((t) => (
                <option key={t} value={t} className="bg-neutral-900">
                  Temporada {t}
                </option>
              ))}
            </select>
          )}
        </header>

        {error && <p className="mb-6 text-center text-sm text-red-500">{error}</p>}

        {resumen && (
          <div className="mb-10 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-neutral-800 py-3">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">Total</p>
              <p className="font-display text-xl font-semibold text-club-yellow">
                {formatEUR(resumen.total)}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-800 py-3">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">Cobrado</p>
              <p className="font-display text-xl font-semibold text-club-green-bright">
                {formatEUR(resumen.cobrado)}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-800 py-3">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">Pendiente</p>
              <p className="font-display text-xl font-semibold text-neutral-100">
                {formatEUR(resumen.pendiente)}
              </p>
            </div>
          </div>
        )}

        {cargando ? (
          <p className="text-center text-sm text-neutral-500">Cargando…</p>
        ) : jugadores.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">
            Sin jugadores todavía. Añádelos desde el panel de administración.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {jugadores.map((j, i) => (
              <CartaJugador key={j.id} jugador={j} onClick={() => setIndiceDetalle(i)} />
            ))}
          </div>
        )}

        {resumen && resumen.por_tipo.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
              Por tipo de infracción
            </h2>
            <GraficoTipos datos={resumen.por_tipo} />
          </section>
        )}

        {detalle && (
          <DetalleJugador
            jugador={detalle}
            tipos={tipos}
            onClose={() => {
              setDetalle(null);
              setIndiceDetalle(null);
            }}
            onPrev={() => moverDetalle(-1)}
            onNext={() => moverDetalle(1)}
          />
        )}
      </div>
    </div>
  );
}
