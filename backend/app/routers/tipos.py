from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.tipo_infraccion import TipoInfraccion
from app.schemas.tipo_infraccion import (
    TipoInfraccionCreate,
    TipoInfraccionOut,
    TipoInfraccionUpdate,
)

router = APIRouter(prefix="/api/v1/tipos", tags=["tipos"])


@router.get("", response_model=list[TipoInfraccionOut])
def listar_tipos(db: Session = Depends(get_db)):
    return (
        db.query(TipoInfraccion)
        .filter(TipoInfraccion.activo == True)  # noqa: E712
        .order_by(TipoInfraccion.orden)
        .all()
    )


@router.post("", response_model=TipoInfraccionOut, status_code=status.HTTP_201_CREATED)
def crear_tipo(
    datos: TipoInfraccionCreate, db: Session = Depends(get_db), _=Depends(get_current_user)
):
    tipo = TipoInfraccion(**datos.model_dump())
    db.add(tipo)
    db.commit()
    db.refresh(tipo)
    return tipo


@router.patch("/{tipo_id}", response_model=TipoInfraccionOut)
def actualizar_tipo(
    tipo_id: str,
    datos: TipoInfraccionUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    tipo = db.query(TipoInfraccion).filter(TipoInfraccion.id == tipo_id).first()
    if not tipo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tipo no encontrado")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(tipo, campo, valor)
    db.commit()
    db.refresh(tipo)
    return tipo
