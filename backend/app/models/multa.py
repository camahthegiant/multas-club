from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class Multa(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "multas"
    __table_args__ = (
        Index("ix_multas_jugador_tipo_temporada", "jugador_id", "tipo_id", "temporada"),
    )

    jugador_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jugadores.id", ondelete="CASCADE"), nullable=False
    )
    tipo_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tipos_infraccion.id", ondelete="RESTRICT"), nullable=False
    )
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    # Temporada derivada de `fecha` (sept→junio, ej. "2026/27"). Guardada en
    # vez de calculada al vuelo para que agrupar/indexar no dependa de
    # recalcular la lógica de temporada en cada consulta.
    temporada: Mapped[str] = mapped_column(String(7), nullable=False)

    pagada: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    pagada_en: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Importe vigente de esta multa. Se recalcula solo mientras no esté
    # pagada ni fijada a mano (ver app/services/importes.py).
    importe_fijado: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    importe_manual: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    nota: Mapped[str | None] = mapped_column(Text, nullable=True)

    jugador: Mapped["Jugador"] = relationship(back_populates="multas")  # noqa: F821
    tipo: Mapped["TipoInfraccion"] = relationship(back_populates="multas")  # noqa: F821
