#!/usr/bin/env python3
"""Convert omsk.gpkg into WGS84 GeoJSON for tippecanoe.

Usage:
    .venv/bin/python make_geojson.py [input.gpkg] [output.geojson]

Defaults: input=omsk.gpkg, output=omsk.geojson. Keeps a subset of the
source attributes and reprojects the geometry to EPSG:4326.
"""

import sys

import geopandas as gpd

KEEP = ["r_year_int", "r_floors", "r_name", "r_adress", "isApartmentBuilding"]


def make_geojson(input_path="omsk.gpkg", output_path="omsk.geojson"):
    gdf = gpd.read_file(input_path)
    gdf = gdf.to_crs(4326)[KEEP + ["geometry"]]
    gdf.to_file(output_path, driver="GeoJSON")
    print(f"Written {len(gdf)} features to {output_path}")


def main():
    input_path = sys.argv[1] if len(sys.argv) > 1 else "omsk.gpkg"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "omsk.geojson"
    make_geojson(input_path, output_path)


if __name__ == "__main__":
    main()
