"""
main.py
-------
API de la web de exploración del histórico de vuelos de AENA.

Arranque (desde la raíz del repositorio, con el venv activado):
    uvicorn app.main:app --reload --port 8000 --app-dir web/backend

Documentación interactiva en http://localhost:8000/docs
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.routers import aeropuertos, directo, meta, rankings, resumen, rutas, series

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = FastAPI(
    title="AENA · API de exploración",
    description="Métricas de los vuelos de salida de los 11 principales aeropuertos de España, "
    "calculadas a partir del histórico del pipeline ETL.",
    version="0.3.0",
)

app.add_middleware(CORSMiddleware, allow_origins=config.ORIGENES_CORS, allow_methods=["GET"], allow_headers=["*"])

for modulo in (meta, resumen, series, rankings, aeropuertos, rutas, directo):
    app.include_router(modulo.router, prefix="/api")


@app.get("/api/salud", tags=["meta"], summary="Comprobación de que la API está viva")
def salud():
    return {"estado": "ok"}
