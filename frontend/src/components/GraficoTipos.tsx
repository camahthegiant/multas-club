"use client";

import { useState } from "react";
import { formatEUR } from "@/lib/format";
import type { ResumenTipo } from "@/lib/api";

export function GraficoTipos({ datos }: { datos: ResumenTipo[] }) {
  const [resaltado, setResaltado] = useState<string | null>(null);

  if (datos.length === 0) {
    return <p className="text-sm text-neutral-500">Sin multas registradas esta temporada.</p>;
  }

  const max = Math.max(...datos.map((d) => parseFloat(d.total)));

  return (
    <ul className="space-y-3">
      {datos.map((d) => {
        const valor = parseFloat(d.total);
        const porcentaje = max > 0 ? (valor / max) * 100 : 0;
        return (
          <li
            key={d.tipo_id}
            onMouseEnter={() => setResaltado(d.tipo_id)}
            onMouseLeave={() => setResaltado(null)}
            className="text-sm"
          >
            <div className="mb-1 flex items-baseline justify-between text-neutral-300">
              <span>
                {d.nombre} <span className="text-neutral-600">× {d.cantidad}</span>
              </span>
              <span className="font-display font-medium text-neutral-100">
                {formatEUR(d.total)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-900">
              <div
                className={`h-full rounded-full bg-club-green transition-all ${
                  resaltado === d.tipo_id ? "bg-club-green-bright" : ""
                }`}
                style={{ width: `${Math.max(porcentaje, 2)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
