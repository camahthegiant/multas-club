"use client";

import { useEffect, useState, useCallback } from "react";
import {
  api,
  logout,
  type JugadorCard,
  type MultaOut,
  type TipoInfraccion,
} from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { formatEUR, formatFecha } from "@/lib/format";

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminPage() {
  const listo = useAuthGuard();

  const [jugadores, setJugadores] = useState<JugadorCard[]>([]);
  const [tipos, setTipos] = useState<TipoInfraccion[]>([]);
  const [multas, setMultas] = useState<MultaOut[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cargarTodo = useCallback(async () => {
    try {
      const [j, t, m] = await Promise.all([
        api.jugadores.listarTodos(),
        api.tipos.listar(),
        api.multas.listar(),
      ]);
      setJugadores(j);
      setTipos(t);
      setMultas(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos");
    }
  }, []);

  useEffect(() => {
    if (listo) cargarTodo();
  }, [listo, cargarTodo]);

  if (!listo) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
      <header className="mb-10 flex items-center justify-between">
        <h1 className="text-sm font-bold uppercase tracking-[0.3em] text-neutral-100">
          Multas · Admin
        </h1>
        <button
          onClick={logout}
          className="text-[11px] uppercase tracking-widest text-neutral-500 hover:text-club-green-bright"
        >
          Salir
        </button>
      </header>

      {error && <p className="mb-6 text-sm text-red-500">{error}</p>}

      <NuevaMulta jugadores={jugadores} tipos={tipos} onCreada={cargarTodo} />
      <ListaMultas multas={multas} onCambio={cargarTodo} />
      <GestionJugadores jugadores={jugadores} onCambio={cargarTodo} />
      <GestionTipos tipos={tipos} onCambio={cargarTodo} />
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-neutral-800 pt-8">
      <h2 className="mb-5 text-[11px] font-medium uppercase tracking-widest text-neutral-400">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function NuevaMulta({
  jugadores,
  tipos,
  onCreada,
}: {
  jugadores: JugadorCard[];
  tipos: TipoInfraccion[];
  onCreada: () => void;
}) {
  const [jugadorId, setJugadorId] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [nota, setNota] = useState("");
  const [precio, setPrecio] = useState<string | null>(null);
  const [orden, setOrden] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jugadorId || !tipoId || !fecha) {
      setPrecio(null);
      return;
    }
    api.multas
      .precio(jugadorId, tipoId, fecha)
      .then((p) => {
        setPrecio(p.importe);
        setOrden(p.orden);
      })
      .catch(() => setPrecio(null));
  }, [jugadorId, tipoId, fecha]);

  async function registrar() {
    if (!jugadorId || !tipoId) {
      setError("Elige jugador y tipo de infracción");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await api.multas.crear({ jugador_id: jugadorId, tipo_id: tipoId, fecha, nota: nota || undefined });
      setNota("");
      onCreada();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la multa");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Seccion titulo="Nueva multa">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <select
            value={jugadorId}
            onChange={(e) => setJugadorId(e.target.value)}
            className="border-0 border-b border-neutral-700 bg-transparent py-2 text-sm text-neutral-200 focus:border-club-green-bright focus:outline-none"
          >
            <option value="" className="bg-neutral-900">Jugador…</option>
            {jugadores.filter((j) => j.activo).map((j) => (
              <option key={j.id} value={j.id} className="bg-neutral-900">
                {j.nombre}
              </option>
            ))}
          </select>
          <select
            value={tipoId}
            onChange={(e) => setTipoId(e.target.value)}
            className="border-0 border-b border-neutral-700 bg-transparent py-2 text-sm text-neutral-200 focus:border-club-green-bright focus:outline-none"
          >
            <option value="" className="bg-neutral-900">Infracción…</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id} className="bg-neutral-900">
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border-0 border-b border-neutral-700 bg-transparent py-2 text-sm text-neutral-200 focus:border-club-green-bright focus:outline-none"
          />
          <input
            type="text"
            placeholder="Nota (opcional)"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="border-0 border-b border-neutral-700 bg-transparent py-2 text-sm text-neutral-200 focus:border-club-green-bright focus:outline-none"
          />
        </div>

        {precio !== null && (
          <p className="text-sm text-neutral-400">
            Será la <span className="text-neutral-200">{orden}ª</span> vez →{" "}
            <span className="font-display font-semibold text-club-yellow">{formatEUR(precio)}</span>
          </p>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={registrar}
          disabled={guardando}
          className="w-full border border-white bg-white py-3 text-xs font-medium uppercase tracking-widest text-black transition-colors hover:border-club-green-bright hover:bg-club-green-bright hover:text-white disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Registrar multa"}
        </button>
      </div>
    </Seccion>
  );
}

function ListaMultas({ multas, onCambio }: { multas: MultaOut[]; onCambio: () => void }) {
  async function togglePagada(m: MultaOut) {
    await api.multas.actualizar(m.id, { pagada: !m.pagada });
    onCambio();
  }

  async function borrar(id: string) {
    if (!confirm("¿Borrar esta multa? No se puede deshacer.")) return;
    await api.multas.eliminar(id);
    onCambio();
  }

  return (
    <Seccion titulo={`Multas (${multas.length})`}>
      {multas.length === 0 ? (
        <p className="text-sm text-neutral-500">Sin multas registradas.</p>
      ) : (
        <ul className="space-y-2">
          {multas.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 border-b border-neutral-800 py-3 text-sm"
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={m.pagada}
                  onChange={() => togglePagada(m)}
                  className="accent-club-green-bright"
                />
                <div>
                  <p className="text-neutral-200">
                    {m.jugador_nombre} <span className="text-neutral-500">· {m.tipo_nombre}</span>
                  </p>
                  <p className="text-[11px] text-neutral-500">{formatFecha(m.fecha)}</p>
                </div>
              </label>
              <div className="flex items-center gap-3">
                <span className="font-display font-semibold text-neutral-100">
                  {formatEUR(m.importe_fijado)}
                </span>
                <button
                  onClick={() => borrar(m.id)}
                  aria-label="Borrar multa"
                  className="text-neutral-600 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Seccion>
  );
}

function GestionJugadores({
  jugadores,
  onCambio,
}: {
  jugadores: JugadorCard[];
  onCambio: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [dorsal, setDorsal] = useState("");
  const [posicion, setPosicion] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function anadir() {
    if (!nombre.trim()) return;
    try {
      await api.jugadores.crear({
        nombre: nombre.trim(),
        dorsal: dorsal ? Number(dorsal) : null,
        posicion: posicion.trim() || null,
      });
      setNombre("");
      setDorsal("");
      setPosicion("");
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo añadir el jugador");
    }
  }

  async function subirFoto(id: string, file: File) {
    try {
      await api.jugadores.subirFoto(id, file);
      onCambio();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto");
    }
  }

  async function toggleActivo(j: JugadorCard) {
    await api.jugadores.actualizar(j.id, { activo: !j.activo });
    onCambio();
  }

  return (
    <Seccion titulo={`Jugadores (${jugadores.length})`}>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <input
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="col-span-3 border-0 border-b border-neutral-700 bg-transparent py-2 text-sm text-neutral-200 focus:border-club-green-bright focus:outline-none sm:col-span-1"
        />
        <input
          placeholder="Dorsal"
          type="number"
          value={dorsal}
          onChange={(e) => setDorsal(e.target.value)}
          className="border-0 border-b border-neutral-700 bg-transparent py-2 text-sm text-neutral-200 focus:border-club-green-bright focus:outline-none"
        />
        <input
          placeholder="Posición"
          value={posicion}
          onChange={(e) => setPosicion(e.target.value)}
          className="border-0 border-b border-neutral-700 bg-transparent py-2 text-sm text-neutral-200 focus:border-club-green-bright focus:outline-none"
        />
        <button
          onClick={anadir}
          className="col-span-3 mt-2 border border-neutral-600 py-3 text-xs uppercase tracking-widest text-neutral-200 transition-colors hover:border-white hover:bg-white hover:text-black"
        >
          Añadir jugador
        </button>
      </div>

      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

      <ul className="space-y-2">
        {jugadores.map((j) => (
          <FilaJugador
            key={j.id}
            jugador={j}
            onSubirFoto={subirFoto}
            onToggleActivo={toggleActivo}
            onCambio={onCambio}
            onError={setError}
          />
        ))}
      </ul>
    </Seccion>
  );
}

const CAMPO_EDICION =
  "w-full border-0 border-b border-neutral-700 bg-transparent py-1 text-sm text-neutral-200 focus:border-club-green-bright focus:outline-none";

function FilaJugador({
  jugador,
  onSubirFoto,
  onToggleActivo,
  onCambio,
  onError,
}: {
  jugador: JugadorCard;
  onSubirFoto: (id: string, file: File) => void;
  onToggleActivo: (j: JugadorCard) => void;
  onCambio: () => void;
  onError: (mensaje: string | null) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(jugador.nombre);
  const [dorsal, setDorsal] = useState(jugador.dorsal?.toString() ?? "");
  const [posicion, setPosicion] = useState(jugador.posicion ?? "");
  const [guardando, setGuardando] = useState(false);

  function empezarEdicion() {
    setNombre(jugador.nombre);
    setDorsal(jugador.dorsal?.toString() ?? "");
    setPosicion(jugador.posicion ?? "");
    onError(null);
    setEditando(true);
  }

  async function guardar() {
    if (!nombre.trim()) {
      onError("El nombre no puede estar vacío");
      return;
    }
    setGuardando(true);
    onError(null);
    try {
      await api.jugadores.actualizar(jugador.id, {
        nombre: nombre.trim(),
        dorsal: dorsal ? Number(dorsal) : null,
        posicion: posicion.trim() || null,
      });
      setEditando(false);
      onCambio();
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo guardar el jugador");
    } finally {
      setGuardando(false);
    }
  }

  if (editando) {
    return (
      <li className="border-b border-club-green py-4 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <input
            aria-label="Nombre"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={`col-span-3 sm:col-span-1 ${CAMPO_EDICION}`}
          />
          <input
            aria-label="Dorsal"
            placeholder="Dorsal"
            type="number"
            value={dorsal}
            onChange={(e) => setDorsal(e.target.value)}
            className={CAMPO_EDICION}
          />
          <input
            aria-label="Posición"
            placeholder="Posición"
            value={posicion}
            onChange={(e) => setPosicion(e.target.value)}
            className={CAMPO_EDICION}
          />
        </div>
        <div className="mt-3 flex justify-end gap-4">
          <button
            onClick={() => setEditando(false)}
            className="text-[11px] uppercase tracking-widest text-neutral-500 hover:text-neutral-200"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="text-[11px] uppercase tracking-widest text-club-green-bright hover:underline disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 border-b border-neutral-800 py-3 text-sm">
      <span className={jugador.activo ? "text-neutral-200" : "text-neutral-600 line-through"}>
        {jugador.dorsal != null && `#${jugador.dorsal} `}
        {jugador.nombre}
        {jugador.posicion && <span className="text-neutral-500"> · {jugador.posicion}</span>}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={empezarEdicion}
          className="text-[11px] uppercase tracking-widest text-neutral-500 hover:text-club-green-bright"
        >
          Editar
        </button>
        <label className="cursor-pointer text-[11px] uppercase tracking-widest text-neutral-500 hover:text-club-green-bright">
          Foto
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSubirFoto(jugador.id, file);
            }}
          />
        </label>
        <button
          onClick={() => onToggleActivo(jugador)}
          className="text-[11px] uppercase tracking-widest text-neutral-500 hover:text-club-green-bright"
        >
          {jugador.activo ? "Desactivar" : "Activar"}
        </button>
      </div>
    </li>
  );
}

function GestionTipos({ tipos, onCambio }: { tipos: TipoInfraccion[]; onCambio: () => void }) {
  const [edicion, setEdicion] = useState<Record<string, string>>({});

  async function guardarEscala(t: TipoInfraccion) {
    const texto = edicion[t.id];
    if (texto === undefined) return;
    const escala = texto
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    if (escala.length === 0) return;
    await api.tipos.actualizar(t.id, { escala });
    setEdicion((prev) => {
      const { [t.id]: _omitida, ...resto } = prev;
      return resto;
    });
    onCambio();
  }

  return (
    <Seccion titulo="Tipos de infracción">
      <ul className="space-y-2">
        {tipos.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-3 border-b border-neutral-800 py-3 text-sm"
          >
            <span className="text-neutral-200">{t.nombre}</span>
            <div className="flex items-center gap-2">
              <input
                value={edicion[t.id] ?? t.escala.join(", ")}
                onChange={(e) => setEdicion((prev) => ({ ...prev, [t.id]: e.target.value }))}
                className="w-28 border-0 border-b border-neutral-700 bg-transparent py-1 text-right text-sm text-neutral-200 focus:border-club-green-bright focus:outline-none"
              />
              <button
                onClick={() => guardarEscala(t)}
                className="text-[11px] uppercase tracking-widest text-neutral-500 hover:text-club-green-bright"
              >
                Guardar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}
