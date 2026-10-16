"""initial schema

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-10-04

"""
from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _columnas_timestamp() -> list[sa.Column]:
    return [
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "usuarios",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("activo", sa.Boolean, nullable=False, server_default=sa.true()),
        *_columnas_timestamp(),
    )

    op.create_table(
        "jugadores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("dorsal", sa.Integer, nullable=True),
        sa.Column("posicion", sa.String(20), nullable=True),
        sa.Column("foto_path", sa.String(255), nullable=True),
        sa.Column("activo", sa.Boolean, nullable=False, server_default=sa.true()),
        *_columnas_timestamp(),
    )

    op.create_table(
        "tipos_infraccion",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("escala", postgresql.ARRAY(sa.Integer), nullable=False),
        sa.Column("orden", sa.Integer, nullable=False, server_default="0"),
        sa.Column("activo", sa.Boolean, nullable=False, server_default=sa.true()),
        *_columnas_timestamp(),
    )

    op.create_table(
        "multas",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "jugador_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("jugadores.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "tipo_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tipos_infraccion.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("fecha", sa.Date, nullable=False),
        sa.Column("temporada", sa.String(7), nullable=False),
        sa.Column("pagada", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("pagada_en", sa.Date, nullable=True),
        sa.Column("importe_fijado", sa.Numeric(10, 2), nullable=False),
        sa.Column("importe_manual", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("nota", sa.Text, nullable=True),
        *_columnas_timestamp(),
    )
    op.create_index(
        "ix_multas_jugador_tipo_temporada", "multas", ["jugador_id", "tipo_id", "temporada"]
    )


def downgrade() -> None:
    op.drop_index("ix_multas_jugador_tipo_temporada", table_name="multas")
    op.drop_table("multas")
    op.drop_table("tipos_infraccion")
    op.drop_table("jugadores")
    op.drop_table("usuarios")
