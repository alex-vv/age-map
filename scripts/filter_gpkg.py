#!/usr/bin/env python3
"""Filter a GeoPackage layer by the `city` attribute and write the result.

Usage:
    python filter_gpkg.py <input.gpkg> [output.gpkg] [city]

Defaults: output=omsk.gpkg, city=omsk. The input file is expected to contain
a single layer.
"""

import sys

import geopandas as gpd
import pyogrio


def filter_by_city(input_path, output_path="omsk.gpkg", city="omsk"):
    layers = pyogrio.list_layers(input_path)
    if len(layers) != 1:
        raise ValueError(
            f"Expected exactly one layer in {input_path}, found {len(layers)}: "
            f"{[name for name, _ in layers]}"
        )
    layer_name = layers[0][0]

    output_layer = "omsk"
    print(f"Reading layer '{layer_name}' from {input_path} (city='{city}')...")
    gdf = gpd.read_file(input_path, layer=layer_name, where=f"city = '{city}'")
    print(f"Selected {len(gdf)} feature(s).")

    gdf.to_file(output_path, layer=output_layer, driver="GPKG")
    print(f"Written to {output_path} (layer '{output_layer}').")
    return gdf


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "omsk.gpkg"
    city = sys.argv[3] if len(sys.argv) > 3 else "omsk"

    filter_by_city(input_path, output_path, city)


if __name__ == "__main__":
    main()
