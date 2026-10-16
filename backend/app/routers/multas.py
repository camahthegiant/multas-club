from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models.jugador import Jugador
from app.models.multa import Multa
from app.models.tipo_infraccion import TipoInfraccion
from app.schemas.multa import MultaCreate, MultaOut, MultaUpdate, PrecioPreview
from app.services.importes import calcular_importe, recalcular_grupo, temporada_de_fecha

router = APIRouter(
    prefix="/api/v1/multas", tags=["multas"], dependencies=[Depends(get_current_user)]
)


def _tipo_o_404(db: Session, tipo_id: str) -> TipoInfraccion:
    tipo = db.query(TipoInfraccion).filter(TipoInfraccion.id == tipo_id).first()
    if not tipo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tipo no encontrado")
    return tipo


def _jugador_o_404(db: Session, jugador_id: str) -> Jugador:
    jugador = db.query(Jugador).filter(Jugador.id == jugador_id).first()
    if not jugador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jugador no encontrado")
    return jugador


def _multa_out(m: Multa) -> MultaOut:
    return MultaOut(
        id=str(m.id),
        jugador_id=str(m.jugador_id),
        jugador_nombre=m.jugador.nombre,
        tipo_id=str(m.tipo_id),
        tipo_nombre=m.tipo.nombre,
        fecha=m.fecha,
        temporada=m.temporada,
        pagada=m.pagada,
        pagada_en=m.pagada_en,
        importe_fijado=m.importe_fijado,
        importe_manual=m.importe_manual,
        nota=m.nota,
    )


@router.get("", response_model=list[MultaOut])
def listar_multas(temporada: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Multa).options(joinedload(Multa.jugador), joinedload(Multa.tipo))
    if temporada:
        query = query.filter(Multa.temporada == temporada)
    multas = query.order_by(Multa.fecha.desc(), Multa.created_at.desc()).all()
    return [_multa_out(m) for m in multas]


@router.get("/precio", response_model=PrecioPreview)
def precio_siguiente(
    jugador_id: str, tipo_id: str, fecha: date, db: Session = Depends(get_db)
):
    tipo = _tipo_o_404(db, tipo_id)
    temporada = temporada_de_fecha(fecha)
    existentes = (
        db.query(Multa)
        .filter(
            Multa.jugador_id == jugador_id,
            Multa.tipo_id == tipo_id,
            Multa.temporada == temporada,
        )
        .count()
    )
    orden = existentes + 1
    importe = calcular_importe(tipo.escala, orden)
    return PrecioPreview(orden=orden, importe=importe, temporada=temporada)


@router.post("", response_model=MultaOut, status_code=status.HTTP_201_CREATED)
def crear_multa(datos: MultaCreate, db: Session = Depends(get_db)):
    jugador = _jugador_o_404(db, datos.jugador_id)
    tipo = _tipo_o_404(db, datos.tipo_id)
    temporada = temporada_de_fecha(datos.fecha)

    multa = Multa(
        jugador_id=jugador.id,
        tipo_id=tipo.id,
        fecha=datos.fecha,
        temporada=temporada,
        importe_fijado=Decimal("0"),  # provisional, lo fija recalcular_grupo justo debajo
        nota=datos.nota,
    )
    db.add(multa)
    db.flush()
    recalcular_grupo(db, jugador.id, tipo.id, temporada, tipo.escala)
    db.commit()
    db.refresh(multa)
    return _multa_out(multa)


@router.patch("/{multa_id}", response_model=MultaOut)
def actualizar_multa(multa_id: str, datos: MultaUpdate, db: Session = Depends(get_db)):
    multa = (
        db.query(Multa)
        .options(joinedload(Multa.jugador), joinedload(Multa.tipo))
        .filter(Multa.id == multa_id)
        .first()
    )
    if not multa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Multa no encontrada")

    grupo_anterior = (multa.jugador_id, multa.tipo_id, multa.temporada)
    campos = datos.model_dump(exclude_unset=True)

    if "jugador_id" in campos:
        _jugador_o_404(db, campos["jugador_id"])
        multa.jugador_id = campos["jugador_id"]
    if "tipo_id" in campos:
        _tipo_o_404(db, campos["tipo_id"])
        multa.tipo_id = campos["tipo_id"]
    if "fecha" in campos:
        multa.fecha = campos["fecha"]
        multa.temporada = temporada_de_fecha(multa.fecha)
    if "nota" in campos:
        multa.nota = campos["nota"]

    if "importe_fijado" in campos:
        multa.importe_fijado = campos["importe_fijado"]
        multa.importe_manual = True

    if "pagada" in campos:
        multa.pagada = campos["pagada"]
        if multa.pagada:
            multa.pagada_en = date.today()
        else:
            multa.pagada_en = None

    db.flush()

    tipo_actual = db.query(TipoInfraccion).filter(TipoInfraccion.id == multa.tipo_id).first()
    recalcular_grupo(db, multa.jugador_id, multa.tipo_id, multa.temporada, tipo_actual.escala)
    grupo_nuevo = (multa.jugador_id, multa.tipo_id, multa.temporada)
    if grupo_anterior != grupo_nuevo:
        tipo_anterior = (
            db.query(TipoInfraccion).filter(TipoInfraccion.id == grupo_anterior[1]).first()
        )
        recalcular_grupo(db, *grupo_anterior, tipo_anterior.escala)

    db.commit()
    db.refresh(multa)
    return _multa_out(multa)


@router.delete("/{multa_id}", status_code=status.HTTP_204_NO_CONTENT)
def borrar_multa(multa_id: str, db: Session = Depends(get_db)):
    multa = db.query(Multa).filter(Multa.id == multa_id).first()
    if not multa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Multa no encontrada")

    jugador_id, tipo_id, temporada = multa.jugador_id, multa.tipo_id, multa.temporada
    tipo = db.query(TipoInfraccion).filter(TipoInfraccion.id == tipo_id).first()
    db.delete(multa)
    db.flush()
    recalcular_grupo(db, jugador_id, tipo_id, temporada, tipo.escala)
    db.commit()
