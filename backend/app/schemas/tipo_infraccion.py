from pydantic import BaseModel, Field, field_validator


class TipoInfraccionOut(BaseModel):
    id: str
    nombre: str
    escala: list[int]
    orden: int
    activo: bool

    model_config = {"from_attributes": True}

    @field_validator("id", mode="before")
    @classmethod
    def _id_a_str(cls, v):
        return str(v)


class TipoInfraccionCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    escala: list[int] = Field(min_length=1)
    orden: int = 0


class TipoInfraccionUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=100)
    escala: list[int] | None = Field(default=None, min_length=1)
    orden: int | None = None
    activo: bool | None = None
