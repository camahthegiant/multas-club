from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.multa import Multa
from app.schemas.resumen import ResumenJugador, ResumenTemporada, ResumenTipo
from app.services.importes import temporada_de_fecha

router = APIRouter(prefix="/api/v1/resumen", tags=["resumen"])


@router.get("", response_model=ResumenTemporada)
def resumen(temporada: str | None = None, db: Session = Depends(get_db)):
    temporada = temporada or temporada_de_fecha(date.today())
    multas = (
        db.query(Multa)
        .options(joinedload(Multa.tipo), joinedload(Multa.jugador))
        .filter(Multa.temporada == temporada)
        .all()
    )

    total = sum((m.importe_fijado for m in multas), start=Decimal("0"))
    cobrado = sum((m.importe_fijado for m in multas if m.pagada), start=Decimal("0"))
    pendiente = total - cobrado

    por_tipo: dict[str, ResumenTipo] = {}
    for m in multas:
        tid = str(m.tipo_id)
        if tid not in por_tipo:
            por_tipo[tid] = ResumenTipo(
                tipo_id=tid, nombre=m.tipo.nombre, cantidad=0, total=Decimal("0")
            )
        por_tipo[tid].cantidad += 1
        por_tipo[tid].total += m.importe_fijado

    por_jugador: dict[str, Decimal] = {}
    nombres: dict[str, str] = {}
    for m in multas:
        jid = str(m.jugador_id)
        por_jugador[jid] = por_jugador.get(jid, Decimal("0")) + m.importe_fijado
        nombres[jid] = m.jugador.nombre

    jugadores_ranking = (
        ResumenJugador(jugador_id=jid, nombre=nombres[jid], total=t)
        for jid, t in por_jugador.items()
    )
    ranking = sorted(jugadores_ranking, key=lambda r: r.total, reverse=True)

    return ResumenTemporada(
        temporada=temporada,
        total=total,
        cobrado=cobrado,
        pendiente=pendiente,
        num_multas=len(multas),
        por_tipo=list(por_tipo.values()),
        ranking=ranking,
    )


@router.get("/temporadas")
def listar_temporadas(db: Session = Depends(get_db)):
    filas = db.query(Multa.temporada).distinct().order_by(Multa.temporada.desc()).all()
    temporadas = [f[0] for f in filas]
    actual = temporada_de_fecha(date.today())
    if actual not in temporadas:
        temporadas.insert(0, actual)
    return {"temporadas": temporadas, "actual": actual}
