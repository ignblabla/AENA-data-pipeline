"""
actualizar_aeropuertos_mundo.py
-------------------------------
Genera web/backend/app/referencia/aeropuertos_mundo.csv: código IATA,
nombre, ciudad, país y coordenadas de los aeropuertos del mundo, para
dibujar las rutas hacia los destinos.

Fuente: OurAirports (https://ourairports.com/data/), dominio público.
Solo hace falta ejecutarlo si aparecen destinos nuevos sin coordenadas:

    venv\\Scripts\\python web\\backend\\scripts\\actualizar_aeropuertos_mundo.py
"""

import csv
import io
import urllib.request
from pathlib import Path

URL = "https://davidmegginson.github.io/ourairports-data/airports.csv"
SALIDA = Path(__file__).resolve().parents[1] / "app" / "referencia" / "aeropuertos_mundo.csv"
TIPOS = {"large_airport", "medium_airport", "small_airport"}

# AENA usa algunos códigos distintos de los de OurAirports: código AENA -> código OurAirports
ALIAS = {
    "MLH": "BSL",  # EuroAirport Basilea-Mulhouse-Friburgo (tiene dos códigos IATA)
    "QGZ": "GMZ",  # La Gomera
}


def main() -> None:
    with urllib.request.urlopen(URL, timeout=60) as respuesta:
        texto = respuesta.read().decode("utf-8")

    filas = {}
    for fila in csv.DictReader(io.StringIO(texto)):
        iata = (fila["iata_code"] or "").strip().upper()
        if len(iata) != 3 or fila["type"] not in TIPOS:
            continue
        filas[iata] = {
            "iata": iata,
            "nombre": fila["name"].strip(),
            "ciudad": fila["municipality"].strip(),
            "pais": fila["iso_country"].strip(),
            "continente": fila["continent"].strip(),
            "lat": round(float(fila["latitude_deg"]), 4),
            "lon": round(float(fila["longitude_deg"]), 4),
        }

    for codigo_aena, codigo_oa in ALIAS.items():
        if codigo_oa in filas:
            filas[codigo_aena] = {**filas[codigo_oa], "iata": codigo_aena}

    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    with open(SALIDA, "w", encoding="utf-8", newline="") as f:
        escritor = csv.DictWriter(f, fieldnames=["iata", "nombre", "ciudad", "pais", "continente", "lat", "lon"])
        escritor.writeheader()
        escritor.writerows(sorted(filas.values(), key=lambda r: r["iata"]))
    print(f"{len(filas)} aeropuertos escritos en {SALIDA}")


if __name__ == "__main__":
    main()
