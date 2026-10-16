from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.config import settings
from app.database import get_db
from app.models.usuario import Usuario
from app.ratelimit import limiter
from app.schemas.auth import BootstrapRequest, LoginRequest, TokenResponse, UsuarioOut

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _usuario_out(user: Usuario) -> UsuarioOut:
    return UsuarioOut(id=str(user.id), email=user.email, nombre=user.nombre)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, datos: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == datos.email, Usuario.activo == True).first()  # noqa: E712
    if not user or not verify_password(datos.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


@router.post("/bootstrap", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def bootstrap(request: Request, datos: BootstrapRequest, db: Session = Depends(get_db)):
    """Crea el único admin. Solo funciona si no existe ninguno y el secret coincide."""
    if not settings.bootstrap_secret or datos.bootstrap_secret != settings.bootstrap_secret:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Secret incorrecto")

    if db.query(Usuario).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un usuario")

    user = Usuario(
        email=datos.email,
        hashed_password=hash_password(datos.password),
        nombre=datos.nombre,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _usuario_out(user)


@router.get("/me", response_model=UsuarioOut)
def me(current_user: Usuario = Depends(get_current_user)):
    return _usuario_out(current_user)
