"""
migrar_a_parquet.py
-------------------
Script de un solo uso para migrar data/historico_vuelos.csv a formato
Parquet particionado (aeropuerto / fecha).
"""

import pandas as pd
from pathlib import Path

def migrar_historico():
    csv_path = Path("data/historico_vuelos.csv")
    parquet_dir = Path("data/historico_parquet")

    if not csv_path.exists():
        print("No se encontró historico_vuelos.csv. Nada que migrar.")
        return

    print(f"Leyendo {csv_path}...")
    df = pd.read_csv(csv_path)

    df["detectado_en"] = pd.to_datetime(df["detectado_en"])
    
    # Crear columna temporal de fecha para agrupar
    df["fecha"] = df["detectado_en"].dt.strftime("%Y-%m-%d")

    print(f"Migrando datos a {parquet_dir}...")
    
    # Agrupamos por aeropuerto y fecha
    for (aeropuerto, fecha), df_grupo in df.groupby(["aeropuerto", "fecha"]):
        dir_particion = parquet_dir / f"aeropuerto={aeropuerto}" / f"fecha={fecha}"
        dir_particion.mkdir(parents=True, exist_ok=True)
        
        archivo_parquet = dir_particion / "datos.parquet"

        df_a_guardar = df_grupo.drop(columns=["fecha"])

        df_a_guardar.to_parquet(archivo_parquet, index=False, engine="pyarrow")
        print(f" -> Migrada partición: {aeropuerto} / {fecha} ({len(df_a_guardar)} filas)")

    print("\n¡Migración completada con éxito!")
    print("Por seguridad, revisa los datos en 'data/historico_parquet/'.")
    print("Una vez validado, puedes borrar 'data/historico_vuelos.csv'.")

if __name__ == "__main__":
    migrar_historico()