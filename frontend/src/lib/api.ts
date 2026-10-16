// Mismo dominio que el backend en producción (Traefik enruta /api y
// /uploads directamente al contenedor backend) — sin NEXT_PUBLIC_API_URL ni
// CORS, a diferencia de Gast-On. Ver next.config.ts para el rewrite de dev.
const API_URL = "";

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("multas_token");
  if ("caches" in window) {
    caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
  }
}

function handleUnauthorized() {
  clearSession();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
    window.location.href = "/admin/login";
  }
}

export function logout() {
  clearSession();
  if (typeof window !== "undefined") {
    window.location.href = "/admin/login";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("multas_token") : null;
  const esFormData = options?.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(esFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401 && path !== "/api/v1/auth/login") handleUnauthorized();
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "Error en la API");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<TokenResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<UsuarioOut>("/api/v1/auth/me"),
  },
  jugadores: {
    listar: (temporada?: string) =>
      request<JugadorCard[]>(`/api/v1/jugadores${temporada ? `?temporada=${temporada}` : ""}`),
    listarTodos: () => request<JugadorCard[]>("/api/v1/jugadores/todos"),
    detalle: (id: string, temporada?: string) =>
      request<JugadorDetalle>(
        `/api/v1/jugadores/${id}${temporada ? `?temporada=${temporada}` : ""}`
      ),
    crear: (datos: JugadorCreate) =>
      request<JugadorCard>("/api/v1/jugadores", { method: "POST", body: JSON.stringify(datos) }),
    actualizar: (id: string, datos: Partial<JugadorCreate> & { activo?: boolean }) =>
      request<JugadorCard>(`/api/v1/jugadores/${id}`, {
        method: "PATCH",
        body: JSON.stringify(datos),
      }),
    subirFoto: (id: string, foto: File) => {
      const form = new FormData();
      form.append("foto", foto);
      return request<JugadorCard>(`/api/v1/jugadores/${id}/foto`, {
        method: "POST",
        body: form,
      });
    },
  },
  tipos: {
    listar: () => request<TipoInfraccion[]>("/api/v1/tipos"),
    crear: (datos: TipoInfraccionCreate) =>
      request<TipoInfraccion>("/api/v1/tipos", { method: "POST", body: JSON.stringify(datos) }),
    actualizar: (id: string, datos: Partial<TipoInfraccionCreate> & { activo?: boolean }) =>
      request<TipoInfraccion>(`/api/v1/tipos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(datos),
      }),
  },
  multas: {
    listar: (temporada?: string) =>
      request<MultaOut[]>(`/api/v1/multas${temporada ? `?temporada=${temporada}` : ""}`),
    precio: (jugadorId: string, tipoId: string, fecha: string) =>
      request<PrecioPreview>(
        `/api/v1/multas/precio?jugador_id=${jugadorId}&tipo_id=${tipoId}&fecha=${fecha}`
      ),
    crear: (datos: MultaCreate) =>
      request<MultaOut>("/api/v1/multas", { method: "POST", body: JSON.stringify(datos) }),
    actualizar: (id: string, datos: MultaUpdate) =>
      request<MultaOut>(`/api/v1/multas/${id}`, { method: "PATCH", body: JSON.stringify(datos) }),
    eliminar: (id: string) => request<void>(`/api/v1/multas/${id}`, { method: "DELETE" }),
  },
  resumen: {
    obtener: (temporada?: string) =>
      request<ResumenTemporada>(`/api/v1/resumen${temporada ? `?temporada=${temporada}` : ""}`),
    temporadas: () => request<TemporadasResponse>("/api/v1/resumen/temporadas"),
  },
};

export type TokenResponse = { access_token: string; token_type: string };
export type UsuarioOut = { id: string; email: string; nombre: string };

export type ConteoTipo = { tipo_id: string; nombre: string; cantidad: number };

export type JugadorCard = {
  id: string;
  nombre: string;
  dorsal: number | null;
  posicion: string | null;
  foto_path: string | null;
  activo: boolean;
  total_temporada: string;
  pendiente_temporada: string;
  num_multas: number;
  conteo_por_tipo: ConteoTipo[];
};

export type MultaDeJugador = {
  id: string;
  tipo_id: string;
  tipo_nombre: string;
  fecha: string;
  orden: number;
  importe_fijado: string;
  pagada: boolean;
  pagada_en: string | null;
  nota: string | null;
};

export type JugadorDetalle = JugadorCard & { multas: MultaDeJugador[] };

export type JugadorCreate = {
  nombre: string;
  dorsal?: number | null;
  posicion?: string | null;
};

export type TipoInfraccion = {
  id: string;
  nombre: string;
  escala: number[];
  orden: number;
  activo: boolean;
};

export type TipoInfraccionCreate = {
  nombre: string;
  escala: number[];
  orden?: number;
};

export type MultaOut = {
  id: string;
  jugador_id: string;
  jugador_nombre: string;
  tipo_id: string;
  tipo_nombre: string;
  fecha: string;
  temporada: string;
  pagada: boolean;
  pagada_en: string | null;
  importe_fijado: string;
  importe_manual: boolean;
  nota: string | null;
};

export type MultaCreate = {
  jugador_id: string;
  tipo_id: string;
  fecha: string;
  nota?: string;
};

export type MultaUpdate = {
  fecha?: string;
  tipo_id?: string;
  jugador_id?: string;
  pagada?: boolean;
  importe_fijado?: number;
  nota?: string;
};

export type PrecioPreview = { orden: number; importe: string; temporada: string };

export type ResumenTipo = { tipo_id: string; nombre: string; cantidad: number; total: string };
export type ResumenJugador = { jugador_id: string; nombre: string; total: string };

export type ResumenTemporada = {
  temporada: string;
  total: string;
  cobrado: string;
  pendiente: string;
  num_multas: number;
  por_tipo: ResumenTipo[];
  ranking: ResumenJugador[];
};

export type TemporadasResponse = { temporadas: string[]; actual: string };
