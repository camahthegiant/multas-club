from decimal import Decimal

from pydantic import BaseModel


class ResumenTipo(BaseModel):
    tipo_id: str
    nombre: str
    cantidad: int
    total: Decimal


class ResumenJugador(BaseModel):
    jugador_id: str
    nombre: str
    total: Decimal


class ResumenTemporada(BaseModel):
    temporada: str
    total: Decimal
    cobrado: Decimal
    pendiente: Decimal
    num_multas: int
    por_tipo: list[ResumenTipo]
    ranking: list[ResumenJugador]
