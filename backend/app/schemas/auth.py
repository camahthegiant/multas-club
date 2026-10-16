from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    # Identificador del admin: no tiene por qué ser un email de verdad (p.ej.
    # "rugbycastello") — es un único usuario, no hace falta validarlo como
    # correo. La columna en BD sigue llamándose `email` pero es solo texto.
    email: str = Field(min_length=1, max_length=255)
    password: str


class BootstrapRequest(BaseModel):
    email: str = Field(min_length=1, max_length=255)
    password: str
    nombre: str
    bootstrap_secret: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UsuarioOut(BaseModel):
    id: str
    email: str
    nombre: str
