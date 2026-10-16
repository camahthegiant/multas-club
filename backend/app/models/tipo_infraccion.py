from sqlalchemy import Boolean, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class TipoInfraccion(Base, UUIDMixin, TimestampMixin):
    """`escala` son los importes en euros por orden de reincidencia dentro de
    la temporada: la n-ésima multa de este tipo cuesta `escala[n-1]`, y a
    partir de agotar la lista se repite el último valor."""

    __tablename__ = "tipos_infraccion"

    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    escala: Mapped[list[int]] = mapped_column(ARRAY(Integer), nullable=False)
    orden: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    multas: Mapped[list["Multa"]] = relationship(back_populates="tipo")  # noqa: F821
