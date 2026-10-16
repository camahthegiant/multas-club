"use client";

import { useEffect } from "react";
import type { JugadorDetalle, TipoInfraccion } from "@/lib/api";
import { formatEUR } from "@/lib/format";
import { CaraCarta } from "@/components/CartaJugador";

// Barra "de carga" de un tipo de infracción: un segmento por cada tramo de
// su escala (4 para las normales [3,5,7,10], 2 para la roja [10,15] — sale
// solo del largo de `tipo.escala`, no hay que tocar nada si el admin cambia la
// escala desde el admin). El precio es el techo de la escala (el que se
// paga una vez agotados los tramos), uno solo para toda la barra.
function BarraTipo({ tipo, cantidad }: { tipo: TipoInfraccion; cantidad: number }) {
  const segmentos = tipo.escala.length;
  const llenos = Math.min(cantidad, segmentos);
  const precioTecho = tipo.escala[tipo.escala.length - 1];

  return (
    <div className="border-b border-neutral-800 pb-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-widest text-neutral-400">
          {tipo.nombre}
        </span>
        <span className="font-display text-sm font-semibold text-club-yellow">
          {precioTecho}€
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: segmentos }).map((_, i) => (
          <div
            key={i}
            className={i < llenos ? "h-2 flex-1 bg-club-green-bright" : "h-2 flex-1 bg-neutral-800"}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-neutral-500">
        {cantidad === 0 ? "Sin infracciones" : `${cantidad}×`}
      </p>
    </div>
  );
}

export function DetalleJugador({
  jugador,
  tipos,
  onClose,
  onPrev,
  onNext,
}: {
  jugador: JugadorDetalle;
  tipos: TipoInfraccion[];
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, onPrev, onNext]);

  const cantidadPorTipo: Record<string, number> = {};
  for (const m of jugador.multas) {
    cantidadPorTipo[m.tipo_id] = (cantidadPorTipo[m.tipo_id] ?? 0) + 1;
  }

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 overflow-y-auto bg-black/90 p-4"
      onClick={onClose}
    >
      {/* Escritorio: flechas a los lados de toda la fila (carta + tabla), ancladas
          al viewport — la derecha queda justo después de la tabla. En móvil el
          layout se apila (carta arriba, tabla abajo) y no hay "lados" de verdad,
          así que ahí usamos el otro par, pegado a la carta (ver abajo). */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label="Jugador anterior"
        className="fixed left-6 top-1/2 z-10 hidden -translate-y-1/2 px-2 py-1 text-3xl text-neutral-500 hover:text-club-green-bright sm:block"
      >
        ‹
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label="Jugador siguiente"
        className="fixed right-6 top-1/2 z-10 hidden -translate-y-1/2 px-2 py-1 text-3xl text-neutral-500 hover:text-club-green-bright sm:block"
      >
        ›
      </button>

      {/* Envoltorio que centra el diálogo cuando cabe entero y, si no cabe
          (pantallas cortas o móvil con la carta grande), deja que sea el
          contenedor de fuera el que deslice — nunca la tabla sola, que
          dejaba la carta inalcanzable por encima de la pantalla. */}
      <div className="flex min-h-full items-center justify-center py-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle de ${jugador.nombre}`}
          onClick={(e) => e.stopPropagation()}
          className="animate-zoom-in flex w-full max-w-4xl flex-col items-center gap-8 sm:flex-row sm:items-start"
        >
          {/* Móvil: flechas ancladas a la carta, no al viewport — con el layout
              apilado, un centrado de pantalla completa caía encima de la tabla. */}
          <div className="relative w-48 shrink-0 sm:w-72">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              aria-label="Jugador anterior"
              className="absolute -left-9 top-1/2 z-10 -translate-y-1/2 px-1 py-2 text-3xl text-neutral-500 hover:text-club-green-bright sm:hidden"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              aria-label="Jugador siguiente"
              className="absolute -right-9 top-1/2 z-10 -translate-y-1/2 px-1 py-2 text-3xl text-neutral-500 hover:text-club-green-bright sm:hidden"
            >
              ›
            </button>
            <div className="aspect-[3/4] w-full">
              <CaraCarta jugador={jugador} />
            </div>
          </div>

          <div className="w-full border-t-2 border-club-green bg-neutral-950 p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold uppercase text-neutral-100">
                  {jugador.nombre}
                </h2>
                {jugador.posicion && (
                  <p className="text-[11px] uppercase tracking-widest text-neutral-500">
                    {jugador.posicion}
                    {jugador.dorsal != null && ` · #${jugador.dorsal}`}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="text-xl text-neutral-500 hover:text-club-green-bright"
              >
                ✕
              </button>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-8 border-b border-neutral-800 pb-6">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-neutral-500">Total</p>
                <p className="mt-2 font-display text-2xl font-semibold text-club-yellow">
                  {formatEUR(jugador.total_temporada)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-neutral-500">
                  Pendiente
                </p>
                <p className="mt-2 font-display text-2xl font-semibold text-neutral-100">
                  {formatEUR(jugador.pendiente_temporada)}
                </p>
              </div>
            </div>

            <p className="mb-4 text-[11px] uppercase tracking-widest text-neutral-500">
              Infracciones de la temporada
            </p>
            <div className="space-y-4">
              {tipos.map((t) => (
                <BarraTipo key={t.id} tipo={t} cantidad={cantidadPorTipo[t.id] ?? 0} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
