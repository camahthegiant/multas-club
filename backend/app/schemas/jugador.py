from decimal import Decimal

from pydantic import BaseModel, Field


class JugadorCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    dorsal: int | None = None
    posicion: str | None = Field(default=None, max_length=20)


class JugadorUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=100)
    dorsal: int | None = None
    posicion: str | None = Field(default=None, max_length=20)
    activo: bool | None = None


class ConteoTipo(BaseModel):
    tipo_id: str
    nombre: str
    cantidad: int


class JugadorCard(BaseModel):
    """Lo que necesita una carta FIFA en la rejilla pública: sin listar cada
    multa, solo los totales de la temporada."""

    id: str
    nombre: str
    dorsal: int | None
    posicion: str | None
    foto_path: str | None
    activo: bool
    total_temporada: Decimal
    pendiente_temporada: Decimal
    num_multas: int
    conteo_por_tipo: list[ConteoTipo]


class MultaDeJugador(BaseModel):
    id: str
    tipo_id: str
    tipo_nombre: str
    fecha: str
    orden: int
    importe_fijado: Decimal
    pagada: bool
    pagada_en: str | None
    nota: str | None


class JugadorDetalle(JugadorCard):
    multas: list[MultaDeJugador]
