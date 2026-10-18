"""
catalogo.py
-----------
Datos de referencia que no vienen en el histórico: nombre y coordenadas de
los 11 aeropuertos monitorizados y traducción de los códigos de estado de
AENA (el pipeline solo traduce algunos).

Se define aquí en vez de importar src.etl_aena.extract porque ese módulo
crea la carpeta raw/ y configura logging al importarse.
"""

AEROPUERTOS = {
    "MAD": {"nombre": "Adolfo Suárez Madrid-Barajas", "ciudad": "Madrid", "lat": 40.4719, "lon": -3.5626},
    "BCN": {"nombre": "Josep Tarradellas Barcelona-El Prat", "ciudad": "Barcelona", "lat": 41.2971, "lon": 2.0785},
    "PMI": {"nombre": "Palma de Mallorca", "ciudad": "Palma", "lat": 39.5517, "lon": 2.7388},
    "AGP": {"nombre": "Málaga-Costa del Sol", "ciudad": "Málaga", "lat": 36.6749, "lon": -4.4991},
    "LPA": {"nombre": "Gran Canaria", "ciudad": "Las Palmas", "lat": 27.9319, "lon": -15.3866},
    "TFS": {"nombre": "Tenerife Sur", "ciudad": "Tenerife", "lat": 28.0445, "lon": -16.5725},
    "VLC": {"nombre": "Valencia", "ciudad": "Valencia", "lat": 39.4893, "lon": -0.4816},
    "SVQ": {"nombre": "Sevilla", "ciudad": "Sevilla", "lat": 37.4180, "lon": -5.8931},
    "TFN": {"nombre": "Tenerife Norte-Ciudad de La Laguna", "ciudad": "Tenerife", "lat": 28.4827, "lon": -16.3415},
    "SCQ": {"nombre": "Santiago-Rosalía de Castro", "ciudad": "Santiago de Compostela", "lat": 42.8963, "lon": -8.4151},
    "MAH": {"nombre": "Menorca", "ciudad": "Mahón", "lat": 39.8626, "lon": 4.2186},
}

ESTADOS = {
    "SCH": "Programado",
    "INI": "Facturación",
    "BOR": "Embarcando",
    "EMB": "Embarcando",
    "BRD": "Embarcando",
    "ULL": "Última llamada",
    "LSC": "Última llamada",
    "CER": "Cerrado",
    "CLS": "Cerrado",
    "RDY": "Listo para salir",
    "OBK": "Fuera de calzos",
    "AIR": "En vuelo",
    "RET": "Retrasado",
    "CAN": "Cancelado",
}
