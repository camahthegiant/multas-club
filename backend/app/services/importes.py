"""Cálculo del importe de cada multa según su orden de reincidencia dentro
de la temporada (ver `TipoInfraccion.escala`).

Las funciones puras (`temporada_de_fecha`, `calcular_importe`) no tocan la
base de datos — son las que se prueban en `tests/test_importes.py`. El resto
sí consulta/escribe, así que se prueban vía los routers.
"""

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.multa import Multa

# Temporada de rugby: septiembre de un año hasta junio del siguiente.
MES_INICIO_TEMPORADA = 9


def temporada_de_fecha(fecha: date) -> str:
    inicio = fecha.year if fecha.month >= MES_INICIO_TEMPORADA else fecha.year - 1
    return f"{inicio}/{str(inicio + 1)[2:]}"


def calcular_importe(escala: list[int], n: int) -> Decimal:
    """`n` es el número de orden (1 = primera vez) de esta infracción para
    este jugador en esta temporada. Agotada la escala, se repite el último
    valor (p. ej. roja: 10€ la 1ª, 15€ de la 2ª en adelante)."""
    indice = min(n, len(escala)) - 1
    return Decimal(escala[indice])


def recalcular_grupo(
    db: Session, jugador_id: uuid.UUID, tipo_id: uuid.UUID, temporada: str, escala: list[int]
) -> None:
    """Renumera el importe de las multas no pagadas ni fijadas a mano de un
    (jugador, tipo, temporada), en orden de fecha. Se llama tras crear,
    editar o borrar cualquier multa del grupo — así una borrada a mitad hace
    que las siguientes vuelvan a contar correctamente ("era la 2ª, ahora es
    la 1ª")."""
    multas = (
        db.query(Multa)
        .filter(
            Multa.jugador_id == jugador_id,
            Multa.tipo_id == tipo_id,
            Multa.temporada == temporada,
        )
        .order_by(Multa.fecha, Multa.id)
        .all()
    )
    for i, multa in enumerate(multas, start=1):
        if not multa.pagada and not multa.importe_manual:
            multa.importe_fijado = calcular_importe(escala, i)
