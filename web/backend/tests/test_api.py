def test_salud(cliente):
    assert cliente.get("/api/salud").json() == {"estado": "ok"}


def test_meta_rango(cliente):
    meta = cliente.get("/api/meta").json()
    assert len(meta["aeropuertos"]) == 11
    assert meta["rango"]["dia_min"] == "2026-01-01"
    assert meta["rango"]["dia_max"] == "2026-01-03"
    assert meta["rango"]["dia_min_completo"] == meta["rango"]["dia_max_completo"] == "2026-01-02"


def test_resumen_por_defecto_usa_dias_completos(cliente):
    r = cliente.get("/api/resumen").json()
    # 2026-01-02: MAD (LHR compartido, BCN cancelado, PMI) + BCN (MAD)
    assert r["salidas"] == 4
    assert r["vuelos"] == 5
    assert r["cancelados"] == 1
    assert r["tasa_cancelacion"] == 0.25
    # Retrasos válidos: 30 (LHR) y 0 (BCN->MAD); el de 2000 min se descarta
    assert r["retraso_medio"] == 15
    assert r["tasa_puntualidad"] == 0.5


def test_filtro_aeropuerto_y_fechas(cliente):
    r = cliente.get("/api/resumen", params={"aeropuertos": "bcn", "desde": "2026-01-01", "hasta": "2026-01-03"}).json()
    assert r["aeropuertos"] == ["BCN"]
    assert r["salidas"] == 2


def test_filtros_invalidos(cliente):
    assert cliente.get("/api/resumen", params={"aeropuertos": "XXX"}).status_code == 422
    assert cliente.get("/api/resumen", params={"desde": "2026-01-03", "hasta": "2026-01-01"}).status_code == 422


def test_rango_sin_datos(cliente):
    r = cliente.get("/api/resumen", params={"desde": "2025-01-01", "hasta": "2025-01-02"}).json()
    assert r["salidas"] == 0 and r["vuelos"] == 0 and r["retraso_medio"] is None


def test_serie_diaria(cliente):
    serie = cliente.get("/api/series/temporal").json()
    assert [(p["periodo"], p["aeropuerto"], p["salidas"], p["completo"]) for p in serie] == [
        ("2026-01-02", "BCN", 1, True),
        ("2026-01-02", "MAD", 3, True),
    ]
    total = cliente.get("/api/series/temporal", params={"agrupar": "total"}).json()
    assert [(p["periodo"], p["aeropuerto"], p["salidas"]) for p in total] == [("2026-01-02", None, 4)]


def test_serie_semanal_y_mensual_marcan_periodos_incompletos(cliente):
    semana = cliente.get("/api/series/temporal", params={"granularidad": "semana", "agrupar": "total"}).json()
    # 2026-01-02 es viernes: su semana empieza el lunes 29/12/2025 y solo tiene 1 día con datos
    assert [(p["periodo"], p["dias"], p["completo"]) for p in semana] == [("2025-12-29", 1, False)]
    mes = cliente.get(
        "/api/series/temporal",
        params={"granularidad": "mes", "agrupar": "total", "desde": "2026-01-01", "hasta": "2026-01-03"},
    ).json()
    assert [(p["periodo"], p["dias"], p["salidas"], p["completo"]) for p in mes] == [("2026-01-01", 3, 6, False)]


def test_ranking_aeropuertos(cliente):
    r = cliente.get("/api/rankings/aeropuertos", params={"metrica": "salidas"}).json()
    assert [a["aeropuerto"] for a in r] == ["MAD", "BCN"]
    assert cliente.get("/api/rankings/aeropuertos", params={"metrica": "otra"}).status_code == 422


def test_ranking_destinos_y_aerolineas(cliente):
    destinos = cliente.get("/api/rankings/destinos", params={"limite": 1}).json()
    assert len(destinos) == 1

    aerolineas = {a["iata_compania"]: a for a in cliente.get("/api/rankings/aerolineas").json()}
    assert aerolineas["VY"]["vuelos"] == 3
    assert aerolineas["VY"]["cancelados"] == 1
    assert aerolineas["AA"]["vuelos"] == 1  # el código compartido cuenta para cada aerolínea


def test_ranking_aerolineas_incluye_puntualidad(cliente):
    vy = next(a for a in cliente.get("/api/rankings/aerolineas").json() if a["iata_compania"] == "VY")
    # VY: BCN->MAD con 0 min (puntual); cancelado y retraso absurdo no cuentan
    assert vy["tasa_puntualidad"] == 1.0


def test_horario(cliente):
    celdas = cliente.get("/api/aeropuertos/mad/horario").json()
    # Viernes (5) a las 8, 9 y 12; un solo viernes en el periodo
    assert [(c["dia_semana"], c["hora"], c["salidas_por_dia"]) for c in celdas] == [(5, 8, 1.0), (5, 9, 1.0), (5, 12, 1.0)]
    assert cliente.get("/api/aeropuertos/XXX/horario").status_code == 404


def test_histograma_retrasos(cliente):
    h = cliente.get("/api/aeropuertos/MAD/retrasos").json()
    # Solo cuenta el LHR (30 min): el cancelado y el de 2000 min no tienen retraso válido
    assert h["total"] == 1 and h["mediana"] == 30
    assert sum(i["salidas"] for i in h["intervalos"]) == 1
    assert next(i for i in h["intervalos"] if i["salidas"])["inicio"] == 30
    assert h["intervalos"][0] == {"inicio": None, "fin": -15, "salidas": 0}
    assert h["intervalos"][-1] == {"inicio": 120, "fin": None, "salidas": 0}


def test_rutas(cliente):
    rutas = {(r["origen"], r["destino_iata"]): r for r in cliente.get("/api/rutas").json()}
    assert set(rutas) == {("MAD", "LHR"), ("MAD", "BCN"), ("MAD", "PMI"), ("BCN", "MAD")}
    assert rutas[("MAD", "LHR")]["pais"] == "GB" and rutas[("MAD", "LHR")]["lat"] == 51.4707
    assert rutas[("MAD", "BCN")]["tasa_cancelacion"] == 1.0
    assert rutas[("MAD", "PMI")]["lat"] is None  # sin coordenadas en la referencia
    assert {r["origen"] for r in cliente.get("/api/rutas", params={"aeropuertos": "BCN"}).json()} == {"BCN"}


def test_panel_directo(cliente):
    panel = cliente.get("/api/directo/mad").json()
    assert panel["actualizado"] == "2026-01-02T11:00:00"
    assert panel["total"] == 2
    lhr, pmi = panel["vuelos"]
    # Código compartido agrupado en una fila
    assert [c["num_vuelo"] for c in lhr["codigos"]] == ["2", "9"]
    assert lhr["retraso_min"] == 160 and lhr["estado_nombre"] == "Embarcando"
    assert pmi["destino_iata"] == "PMI" and pmi["mostrador"] is None  # "null-null" se normaliza
    assert len(cliente.get("/api/directo/MAD", params={"limite": 1}).json()["vuelos"]) == 1
    assert cliente.get("/api/directo/XXX").status_code == 404


def test_panel_sin_foto(cliente):
    panel = cliente.get("/api/directo/BCN").json()
    assert panel["total"] == 0 and panel["vuelos"] == []


def test_historial_vuelo(cliente):
    h = cliente.get("/api/vuelos/historial", params={"clave": "MAD_2_2026-01-02 08:00_LHR"}).json()
    assert [c["num_vuelo"] for c in h["codigos"]] == ["2", "9"]
    primero, segundo = h["eventos"]
    assert primero["cambios"] == [] and primero["estado_nombre"] == "Programado"
    assert {c["campo"]: (c["antes"], c["despues"]) for c in segundo["cambios"]} == {
        "estado": ("Programado", "Embarcando"),
        "salida_estimada": ("2026-01-02T08:00:00", "2026-01-02T08:30:00"),
    }
    assert segundo["retraso_min"] == 30
    assert cliente.get("/api/vuelos/historial", params={"clave": "no-existe"}).status_code == 404
