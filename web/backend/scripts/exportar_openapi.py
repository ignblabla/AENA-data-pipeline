"""
exportar_openapi.py
-------------------
Escribe el esquema OpenAPI de la API en web/frontend/openapi.json, del que el
frontend genera sus tipos TypeScript (npm run tipos). No necesita el servidor
arrancado ni lee datos: solo inspecciona las rutas y los modelos.

    venv\\Scripts\\python web\\backend\\scripts\\exportar_openapi.py
"""

import json
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from app.main import app  # noqa: E402

SALIDA = BACKEND.parent / "frontend" / "openapi.json"

if __name__ == "__main__":
    SALIDA.write_text(json.dumps(app.openapi(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Esquema OpenAPI escrito en {SALIDA}")
