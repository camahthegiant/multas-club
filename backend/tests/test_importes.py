from datetime import date

from app.services.importes import calcular_importe, temporada_de_fecha

ESCALA_NORMAL = [3, 5, 7, 10]
ESCALA_ROJA = [10, 15]


def test_temporada_antes_de_septiembre_pertenece_a_la_anterior():
    assert temporada_de_fecha(date(2026, 8, 31)) == "2025/26"


def test_temporada_desde_septiembre_es_la_nueva():
    assert temporada_de_fecha(date(2026, 9, 1)) == "2026/27"


def test_temporada_en_mitad_de_curso():
    assert temporada_de_fecha(date(2027, 3, 15)) == "2026/27"


def test_escala_normal_progresion_3_5_7_10():
    assert [calcular_importe(ESCALA_NORMAL, n) for n in range(1, 5)] == [3, 5, 7, 10]


def test_escala_normal_se_mantiene_en_10_a_partir_de_la_cuarta():
    assert calcular_importe(ESCALA_NORMAL, 5) == 10
    assert calcular_importe(ESCALA_NORMAL, 20) == 10


def test_escala_roja_10_luego_15():
    assert calcular_importe(ESCALA_ROJA, 1) == 10
    assert calcular_importe(ESCALA_ROJA, 2) == 15
    assert calcular_importe(ESCALA_ROJA, 10) == 15
