"""
renderizar.py
-------------
Convierte el JSON de un carrusel en 10 imágenes PNG de 1080x1350 (formato 4:5 de Instagram).

Escribe datos.js con el JSON, abre carrusel.html?n=1..10 en Chrome sin ventana y guarda
una captura de cada lámina en png/.

Uso:
    python docs/carrusel/diseno/renderizar.py [ruta_json]
"""

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

DIR = Path(__file__).resolve().parent
JSON_POR_DEFECTO = DIR.parent / "ejemplo_MAD_2026-10-19.json"
ANCHO, ALTO = 1080, 1350

NAVEGADORES = [
    os.environ.get("CHROME", ""),
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]


def navegador() -> str:
    for ruta in NAVEGADORES:
        if ruta and Path(ruta).exists():
            return ruta
    sys.exit("No se encontró Chrome ni Edge; indica la ruta con la variable CHROME.")


def main() -> None:
    ruta_json = Path(sys.argv[1]) if len(sys.argv) > 1 else JSON_POR_DEFECTO
    datos = json.loads(ruta_json.read_text(encoding="utf-8"))
    (DIR / "datos.js").write_text(f"window.DATOS = {json.dumps(datos, ensure_ascii=False)}\n", encoding="utf-8")

    salida = DIR / "png"
    salida.mkdir(exist_ok=True)
    prefijo = f"{datos['aeropuerto']['iata']}_{datos['dia']}"
    chrome = navegador()

    # Un perfil temporal evita chocar con un Chrome que ya esté abierto
    with tempfile.TemporaryDirectory() as perfil:
        for n in range(1, len(datos["diapositivas"]) + 1):
            png = salida / f"{prefijo}_{n:02d}.png"
            subprocess.run(
                [
                    chrome,
                    "--headless=new",
                    "--disable-gpu",
                    "--hide-scrollbars",
                    "--force-device-scale-factor=1",
                    f"--user-data-dir={perfil}",
                    f"--window-size={ANCHO},{ALTO}",
                    "--virtual-time-budget=3000",
                    f"--screenshot={png}",
                    f"{(DIR / 'carrusel.html').as_uri()}?n={n}",
                ],
                check=True,
                capture_output=True,
            )
            print(png.relative_to(DIR.parent.parent.parent))


if __name__ == "__main__":
    main()
