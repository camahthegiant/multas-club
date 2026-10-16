# Multas — Club de Rugby Castelló

> **Copia pública del proyecto.** Es una foto del código de una app que uso con mi equipo; el repositorio de trabajo es privado y avanza por su cuenta, así que esta copia puede quedarse atrás. Se omite el historial de commits y los datos de las personas: los jugadores del seed son ficticios ("Jugador 1"…) y dominios y claves son de ejemplo.

App para llevar las multas internas del equipo: un admin las da de
alta y las marca como pagadas; cualquiera con el link ve, sin login, cuántas
multas lleva cada jugador y el balance del equipo en la temporada.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 + TypeScript + Tailwind 4, PWA |
| Backend | FastAPI + SQLAlchemy + Alembic |
| Base de datos | PostgreSQL 16 |
| Auth | JWT, un único admin |
| Infraestructura | Docker Compose, Coolify + Traefik en producción |

## Infracciones y precios

| Infracción | 1ª | 2ª | 3ª | 4ª+ |
|---|---|---|---|---|
| Retraso en la convocatoria | 3€ | 5€ | 7€ | 10€ |
| No llevar la camiseta de calentamiento | 3€ | 5€ | 7€ | 10€ |
| Tarjeta amarilla por conducta evitable | 3€ | 5€ | 7€ | 10€ |
| Protestas evitables al árbitro | 3€ | 5€ | 7€ | 10€ |
| Tarjeta roja por conducta antideportiva | 10€ | 15€ | 15€ | 15€ |

El contador de reincidencia se reinicia cada temporada (septiembre → junio).
Editable desde el panel admin (`/admin`, sección "Tipos de infracción").

## Puertos locales

| Servicio | Puerto |
|----------|--------|
| Frontend | 3004 |
| Backend | 8004 |
| Postgres | 5435 |

## Arranque en local

```bash
cp .env.example .env   # rellena SECRET_KEY y BOOTSTRAP_SECRET con algo aleatorio
docker compose -f docker-compose.dev.yml up -d
```

Espera a que las migraciones corran (`docker compose -f docker-compose.dev.yml logs -f backend`), luego crea el único admin:

```bash
curl -X POST http://localhost:8004/api/v1/auth/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tu-contraseña","nombre":"Tu nombre","bootstrap_secret":"el-que-pusiste-en-.env"}'
```

Siembra los tipos de infracción y los jugadores de la convocatoria inicial (opcional, recomendado):

```bash
cd backend
DATABASE_URL=postgresql://multas:changeme@localhost:5435/multas python scripts/seed.py
```

Abre `http://localhost:3004` (vista pública) y `http://localhost:3004/admin/login` para administrar.

## Parar

```bash
docker compose -f docker-compose.dev.yml down     # seguro
docker compose -f docker-compose.dev.yml down -v  # ⚠️ destruye postgres_data y las fotos subidas
```

## Despliegue en producción (Coolify)

1. **DNS**: registro A `multas` → la IP de tu VPS.
2. **Coolify**: nuevo recurso → Docker Compose → apunta al repo, fichero `docker-compose.prod.yml`.
3. Variables de entorno en Coolify (igual que `.env.example`, con valores reales):
   `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL`,
   `SECRET_KEY`, `CORS_ORIGINS=https://multas.example.com`, `BOOTSTRAP_SECRET`.
4. Deploy. Alembic corre solo (`alembic upgrade head` antes de levantar uvicorn).
5. Bootstrap del admin igual que en local pero contra `https://multas.example.com`:
   ```bash
   curl -X POST https://multas.example.com/api/v1/auth/bootstrap \
     -H "Content-Type: application/json" \
     -d '{"email":"tu@email.com","password":"tu-contraseña","nombre":"Tu nombre","bootstrap_secret":"..."}'
   ```
6. Seed de jugadores y tipos: ejecutar `scripts/seed.py` dentro del contenedor backend de producción (`docker exec` desde el panel de Coolify), o repetir las llamadas a la API a mano.

Las fotos subidas viven en el volumen `uploads_data` — sobreviven a redeploys, no a un `docker compose down -v`.

## Estadísticas de partidos

La pestaña `/estadisticas` incrusta (`iframe`) un dashboard de estadísticas de partidos hecho por otro compañero del club, publicado en su propio dominio. Ese proyecto no forma parte de este repositorio.

## Notas de diseño

- Vista pública sin login (`noindex`, `robots.txt` cierra todo) — el link se comparte por WhatsApp.
- `/admin` requiere login; sin token redirige a `/admin/login`.
- Pagar una multa congela su importe — si luego se borra otra multa anterior del mismo jugador/tipo, la pagada no se renumera ni cambia de precio.
- Fotos de jugador: subida de archivo, validada con Pillow (no se fía de la extensión), recortada a cuadrado y guardada como WebP con nombre aleatorio.

## Licencia

MIT, ver [LICENSE](LICENSE). El escudo y el nombre del club pertenecen al club.
