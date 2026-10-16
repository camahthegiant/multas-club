"""Siembra los 5 tipos de infracción y los jugadores de la convocatoria
inicial. Idempotente: hace upsert por nombre, así que se puede volver a
correr sin duplicar nada.

Uso:
    DATABASE_URL=postgresql://multas:changeme@localhost:5435/multas python scripts/seed.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal  # noqa: E402
from app.models.jugador import Jugador  # noqa: E402
from app.models.tipo_infraccion import TipoInfraccion  # noqa: E402

TIPOS = [
    ("Retraso en la convocatoria", [3, 5, 7, 10], 0),
    ("No llevar la camiseta de calentamiento", [3, 5, 7, 10], 1),
    ("Tarjeta amarilla por conducta evitable", [3, 5, 7, 10], 2),
    ("Protestas evitables al árbitro", [3, 5, 7, 10], 3),
    ("Tarjeta roja por conducta antideportiva", [10, 15], 4),
]

JUGADORES = [
    (1, "Jugador 1"),
    (2, "Jugador 2"),
    (3, "Jugador 3"),
    (4, "Jugador 4"),
    (5, "Jugador 5"),
    (6, "Jugador 6"),
    (7, "Jugador 7"),
    (8, "Jugador 8"),
    (9, "Jugador 9"),
    (10, "Jugador 10"),
    (11, "Jugador 11"),
    (12, "Jugador 12"),
    (13, "Jugador 13"),
    (14, "Jugador 14"),
    (15, "Jugador 15"),
    (16, "Jugador 16"),
    (17, "Jugador 17"),
    (18, "Jugador 18"),
    (19, "Jugador 19"),
]


def seed() -> None:
    db = SessionLocal()
    try:
        for nombre, escala, orden in TIPOS:
            existente = db.query(TipoInfraccion).filter(TipoInfraccion.nombre == nombre).first()
            if existente:
                existente.escala = escala
                existente.orden = orden
            else:
                db.add(TipoInfraccion(nombre=nombre, escala=escala, orden=orden))

        for dorsal, nombre in JUGADORES:
            existente = db.query(Jugador).filter(Jugador.nombre == nombre).first()
            if existente:
                existente.dorsal = dorsal
            else:
                db.add(Jugador(nombre=nombre, dorsal=dorsal))

        db.commit()
        print(f"Sembrados {len(TIPOS)} tipos de infracción y {len(JUGADORES)} jugadores.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
