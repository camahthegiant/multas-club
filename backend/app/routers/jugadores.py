from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models.jugador import Jugador
from app.models.multa import Multa
from app.schemas.jugador import (
    ConteoTipo,
    JugadorCard,
    JugadorCreate,
    JugadorDetalle,
    JugadorUpdate,
    MultaDeJugador,
)
from app.services.importes import temporada_de_fecha
from app.services.uploads import borrar_foto_jugador, guardar_foto_jugador

router = APIRouter(prefix="/api/v1/jugadores", tags=["jugadores"])


def _temporada_o_actual(temporada: str | None) -> str:
    return temporada or temporada_de_fecha(date.today())


def _tarjeta(jugador: Jugador, multas_temporada: list[Multa]) -> JugadorCard:
    total = sum((m.importe_fijado for m in multas_temporada), start=Decimal("0"))
    pendiente = sum(
        (m.importe_fijado for m in multas_temporada if not m.pagada),
        start=Decimal("0"),
    )
    conteo: dict[str, ConteoTipo] = {}
    for m in multas_temporada:
        if m.tipo_id not in conteo:
            conteo[m.tipo_id] = ConteoTipo(tipo_id=str(m.tipo_id), nombre=m.tipo.nombre, cantidad=0)
        conteo[m.tipo_id].cantidad += 1

    return JugadorCard(
        id=str(jugador.id),
        nombre=jugador.nombre,
        dorsal=jugador.dorsal,
        posicion=jugador.posicion,
        foto_path=jugador.foto_path,
        activo=jugador.activo,
        total_temporada=total,
        pendiente_temporada=pendiente,
        num_multas=len(multas_temporada),
        conteo_por_tipo=list(conteo.values()),
    )


def _listar(db: Session, temporada: str | None, incluir_inactivos: bool) -> list[JugadorCard]:
    temporada = _temporada_o_actual(temporada)
    consulta = db.query(Jugador)
    if not incluir_inactivos:
        consulta = consulta.filter(Jugador.activo == True)  # noqa: E712
    jugadores = consulta.order_by(Jugador.dorsal.nulls_last(), Jugador.nombre).all()
    multas = (
        db.query(Multa)
        .options(joinedload(Multa.tipo))
        .filter(Multa.temporada == temporada)
        .all()
    )
    por_jugador: dict[str, list[Multa]] = {}
    for m in multas:
        por_jugador.setdefault(str(m.jugador_id), []).append(m)

    return [_tarjeta(j, por_jugador.get(str(j.id), [])) for j in jugadores]


@router.get("", response_model=list[JugadorCard])
def listar_jugadores(temporada: str | None = None, db: Session = Depends(get_db)):
    return _listar(db, temporada, incluir_inactivos=False)


# Antes de "/{jugador_id}" para que "todos" no se interprete como un id.
@router.get("/todos", response_model=list[JugadorCard])
def listar_todos_los_jugadores(
    temporada: str | None = None, db: Session = Depends(get_db), _=Depends(get_current_user)
):
    return _listar(db, temporada, incluir_inactivos=True)


@router.get("/{jugador_id}", response_model=JugadorDetalle)
def detalle_jugador(jugador_id: str, temporada: str | None = None, db: Session = Depends(get_db)):
    temporada = _temporada_o_actual(temporada)
    jugador = db.query(Jugador).filter(Jugador.id == jugador_id).first()
    if not jugador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jugador no encontrado")

    multas = (
        db.query(Multa)
        .options(joinedload(Multa.tipo))
        .filter(Multa.jugador_id == jugador_id, Multa.temporada == temporada)
        .order_by(Multa.fecha, Multa.id)
        .all()
    )
    tarjeta = _tarjeta(jugador, multas)

    contador: dict[str, int] = {}
    lista_multas = []
    for m in multas:
        contador[str(m.tipo_id)] = contador.get(str(m.tipo_id), 0) + 1
        lista_multas.append(
            MultaDeJugador(
                id=str(m.id),
                tipo_id=str(m.tipo_id),
                tipo_nombre=m.tipo.nombre,
                fecha=m.fecha.isoformat(),
                orden=contador[str(m.tipo_id)],
                importe_fijado=m.importe_fijado,
                pagada=m.pagada,
                pagada_en=m.pagada_en.isoformat() if m.pagada_en else None,
                nota=m.nota,
            )
        )

    return JugadorDetalle(**tarjeta.model_dump(), multas=lista_multas)


@router.post("", response_model=JugadorCard, status_code=status.HTTP_201_CREATED)
def crear_jugador(datos: JugadorCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    jugador = Jugador(**datos.model_dump())
    db.add(jugador)
    db.commit()
    db.refresh(jugador)
    return _tarjeta(jugador, [])


@router.patch("/{jugador_id}", response_model=JugadorCard)
def actualizar_jugador(
    jugador_id: str,
    datos: JugadorUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    jugador = db.query(Jugador).filter(Jugador.id == jugador_id).first()
    if not jugador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jugador no encontrado")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(jugador, campo, valor)
    db.commit()
    db.refresh(jugador)
    multas_actuales = (
        db.query(Multa)
        .options(joinedload(Multa.tipo))
        .filter(Multa.jugador_id == jugador.id, Multa.temporada == temporada_de_fecha(date.today()))
        .all()
    )
    return _tarjeta(jugador, multas_actuales)


@router.post("/{jugador_id}/foto", response_model=JugadorCard)
def subir_foto(
    jugador_id: str,
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    jugador = db.query(Jugador).filter(Jugador.id == jugador_id).first()
    if not jugador:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jugador no encontrado")

    nombre_anterior = jugador.foto_path
    jugador.foto_path = guardar_foto_jugador(foto)
    db.commit()
    db.refresh(jugador)
    borrar_foto_jugador(nombre_anterior)

    return _tarjeta(jugador, [])
