from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class MultaCreate(BaseModel):
    jugador_id: str
    tipo_id: str
    fecha: date
    nota: str | None = None


class MultaUpdate(BaseModel):
    fecha: date | None = None
    tipo_id: str | None = None
    jugador_id: str | None = None
    pagada: bool | None = None
    importe_fijado: Decimal | None = None
    nota: str | None = None


class MultaOut(BaseModel):
    id: str
    jugador_id: str
    jugador_nombre: str
    tipo_id: str
    tipo_nombre: str
    fecha: date
    temporada: str
    pagada: bool
    pagada_en: date | None
    importe_fijado: Decimal
    importe_manual: bool
    nota: str | None

    model_config = {"from_attributes": True}


class PrecioPreview(BaseModel):
    orden: int
    importe: Decimal
    temporada: str
