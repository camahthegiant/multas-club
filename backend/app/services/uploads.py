"""Subida de fotos de jugador: valida que el fichero es una imagen de verdad
(abriéndolo con Pillow, no fiándose de la extensión ni el Content-Type),
la recorta a retrato cuadrado y la guarda como WebP con nombre aleatorio —
nunca el nombre original del fichero, para no filtrar rutas ni depender de
que el admin no suba algo raro."""

import io
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError

from app.config import settings

TAMANO_MAX_BYTES = 5 * 1024 * 1024
LADO_PX = 600


def _ruta_uploads() -> Path:
    ruta = Path(settings.uploads_dir)
    ruta.mkdir(parents=True, exist_ok=True)
    return ruta


def guardar_foto_jugador(archivo: UploadFile) -> str:
    contenido = archivo.file.read(TAMANO_MAX_BYTES + 1)
    if len(contenido) > TAMANO_MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="La foto no puede superar 5 MB",
        )

    try:
        Image.open(io.BytesIO(contenido)).verify()
        # verify() deja el objeto inservible: se reabre para usarlo de verdad.
        imagen = Image.open(io.BytesIO(contenido)).convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="El fichero no es una imagen válida"
        ) from exc

    ancho, alto = imagen.size
    lado = min(ancho, alto)
    izquierda = (ancho - lado) // 2
    arriba = 0  # recorte de retrato: prioriza la parte de arriba (cara), no el centro vertical
    imagen = imagen.crop((izquierda, arriba, izquierda + lado, arriba + lado))
    imagen = imagen.resize((LADO_PX, LADO_PX), Image.LANCZOS)

    nombre = f"{uuid.uuid4().hex}.webp"
    destino = _ruta_uploads() / nombre
    imagen.save(destino, "WEBP", quality=85)
    return nombre


def borrar_foto_jugador(nombre_fichero: str | None) -> None:
    if not nombre_fichero:
        return
    ruta = _ruta_uploads() / nombre_fichero
    ruta.unlink(missing_ok=True)
