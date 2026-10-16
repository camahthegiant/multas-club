"use client";

import clsx from "clsx";
import type { JugadorCard } from "@/lib/api";
import { abreviaturaTipo } from "@/lib/tipos";

// Fila de "stats" fija con las 5 infracciones del seed, en su abreviatura.
// Si el admin añade un tipo nuevo, sus multas siguen contando en el total y
// aparecen en el detalle, pero no tienen hueco propio en esta fila — es un
// límite de layout aceptado a cambio de que la carta no crezca sin control.
const ABREVIATURAS_FILA = ["RET", "CAM", "AMA", "PRO", "ROJ"];

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

type EstadoCarta = "limpia" | "al-dia" | "debe";

function estadoDe(jugador: JugadorCard): EstadoCarta {
  const pendiente = parseFloat(jugador.pendiente_temporada);
  if (jugador.num_multas === 0) return "limpia";
  return pendiente === 0 ? "al-dia" : "debe";
}

// Contenido visual de la carta, recortado con el escudo de CartaShieldDefs.
// Lo usan tanto la carta pequeña de la rejilla (como botón) como la carta
// grande y estática del panel de detalle — mismo aspecto, dos tamaños.
export function CaraCarta({ jugador }: { jugador: JugadorCard }) {
  const pendiente = parseFloat(jugador.pendiente_temporada);
  const estado = estadoDe(jugador);

  const conteo: Record<string, number> = {};
  for (const c of jugador.conteo_por_tipo) {
    conteo[abreviaturaTipo(c.nombre)] = (conteo[abreviaturaTipo(c.nombre)] ?? 0) + c.cantidad;
  }

  return (
    <div className="relative h-full w-full">
      {/* Capa de borde: mismo escudo, un poco más grande, de color sólido
          detrás de la carta real — hace de "marco" porque clip-path no
          admite border-radius ni box-shadow con el contorno recortado. */}
      <div
        className={clsx(
          "absolute inset-0",
          estado === "limpia" && "bg-club-green-bright",
          estado === "al-dia" && "bg-club-green",
          estado === "debe" && "bg-club-green/40"
        )}
        style={{ clipPath: "url(#carta-shield)" }}
      />
      <div
        className="carta-brillo absolute inset-[3px] overflow-hidden bg-gradient-to-b from-neutral-900 to-black p-3"
        style={{ clipPath: "url(#carta-shield)" }}
      >
        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-2xl font-bold leading-none text-club-yellow">
                {Math.round(parseFloat(jugador.total_temporada))}€
              </p>
              {jugador.posicion && (
                <p className="font-display text-xs font-semibold uppercase text-neutral-400">
                  {jugador.posicion}
                </p>
              )}
            </div>
            {jugador.dorsal != null && (
              <span className="font-display text-sm font-semibold text-neutral-500">
                #{jugador.dorsal}
              </span>
            )}
          </div>

          <div className="flex flex-1 items-center justify-center py-2">
            {jugador.foto_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/uploads/${jugador.foto_path}`}
                alt={jugador.nombre}
                className="h-20 w-20 rounded-full border border-club-green/50 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-club-green/50 bg-neutral-900 font-display text-xl text-neutral-500">
                {iniciales(jugador.nombre)}
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="truncate font-display text-sm font-semibold uppercase tracking-wide text-neutral-100">
              {jugador.nombre}
            </p>
          </div>

          <div className="mt-2 flex justify-between border-t border-neutral-800 pt-2">
            {ABREVIATURAS_FILA.map((ab) => (
              <div key={ab} className="text-center">
                <p className="text-[9px] uppercase tracking-wide text-neutral-500">{ab}</p>
                <p className="font-display text-xs font-semibold text-neutral-200">
                  {conteo[ab] ?? 0}
                </p>
              </div>
            ))}
          </div>

          {pendiente > 0 && (
            <p className="mt-1 text-center text-[10px] uppercase tracking-widest text-club-yellow">
              {Math.round(pendiente)}€ pendiente
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CartaJugador({
  jugador,
  onClick,
}: {
  jugador: JugadorCard;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={`Ver detalle de ${jugador.nombre}`}
      className="group relative aspect-[3/4] w-full text-left transition-transform hover:-translate-y-1"
    >
      <CaraCarta jugador={jugador} />
    </button>
  );
}
