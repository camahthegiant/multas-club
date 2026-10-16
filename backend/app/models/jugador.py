from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Jugador(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "jugadores"

    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    dorsal: Mapped[int | None] = mapped_column(Integer, nullable=True)
    posicion: Mapped[str | None] = mapped_column(String(20), nullable=True)
    foto_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    multas: Mapped[list["Multa"]] = relationship(  # noqa: F821
        back_populates="jugador", cascade="all, delete-orphan"
    )
