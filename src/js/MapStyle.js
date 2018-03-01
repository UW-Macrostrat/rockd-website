import { SETTINGS } from './Settings'

export const mapStyle = {
    "version": 8,
    "sources": {
        "burwell": {
            "type": "vector",
            "tiles": [
              `${SETTINGS.burwellTileDomain}/carto-slim/{z}/{x}/{y}.mvt`
            ],
            "tileSize": 512
        },
        "pbdb": {
            "type": "vector",
            "tiles": [
              `${SETTINGS.burwellTileDomain}/pbdb-collections/{z}/{x}/{y}.mvt`
            ],
            "tileSize": 512
        },
        "info_marker": {
          "type": "geojson",
          "data": {
            "type": "FeatureCollection",
            "features": [{
              "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": [0, 0]
              }
            }]
          }
        },
        "columns": {
          "type": "geojson",
          "data": `${SETTINGS.apiDomain}/api/v2/columns?all&format=geojson_bare`
        },
        "filteredColumns": {
          "type": "geojson",
          "data": {
            "type": "FeatureCollection",
            "features": []
          }
        },
        "indexMap": {
          "type": "geojson",
          "data": `${SETTINGS.apiDomain}/api/v2/defs/sources?all&format=geojson_bare`
        },
        "elevationPoints": {
          "type": "geojson",
          "data": {
            "type": "FeatureCollection",
            "features": []
          }
        },
        "elevationLine": {
          "type": "geojson",
          "data": {
            "type": "FeatureCollection",
            "features": []
          }
        },
    },
    "layers": [
        {
          "id": "column_fill",
          "type": "fill",
          "source": "columns",
          "paint": {
            "fill-color": "#777777",
            "fill-opacity": 0.2
          },
          "layout": {
            "visibility": "none"
          }
        },
        {
          "id": "column_stroke",
          "type": "line",
          "source": "columns",
          "paint": {
            "line-color": "#777777",
            "line-width": {
              "stops": [
                [0, 0.2],
                [10, 1]
              ]
            }
          },
          "layout": {
            "visibility": "none"
          }
        },
        {
          "id": "filtered_column_fill",
          "type": "fill",
          "source": "filteredColumns",
          "paint": {
            "fill-color": "#777777",
            "fill-opacity": 0.2
          },
          "layout": {
            "visibility": "none"
          }
        },
        {
          "id": "filtered_column_stroke",
          "type": "line",
          "source": "filteredColumns",
          "paint": {
            "line-color": "#777777",
            "line-width": {
              "stops": [
                [0, 0.2],
                [10, 1]
              ]
            }
          },
          "layout": {
            "visibility": "none"
          }
        },
        {
          "id": "indexMap_fill",
          "type": "fill",
          "source": "indexMap",
          "paint": {
            "fill-color": "#000000",
            "fill-opacity": 0
          },
          "layout": {
            "visibility": "none"
          }
        },
        {
          "id": "indexMap_stroke",
          "type": "line",
          "source": "indexMap",
          "paint": {
            "line-color": "#000000",
            "line-width": {
              "stops": [
                [0, 2],
                [4, 2],
                [16, 12]
              ]
            },
            "line-opacity": 1
          },
          "layout": {
            "visibility": "none"
          }
        },
        {
          "id": "indexMap_highlight",
          "type": "line",
          "source": "indexMap",
          "paint": {
            "line-color": "#045275",
            "line-width": {
              "stops": [
                [0, 6],
                [4, 6],
                [16, 18]
              ]
            },
            "line-opacity": 1
          },
          "filter": ["==", "source_id", ""]
        },
        {
          "id": "burwell_fill",
          "type": "fill",
          "source": "burwell",
          "source-layer": "units",
          "filter": ["!=", "color", ""],
          "minzoom": 0,
          "maxzoom": 16,
          "paint": {
            "fill-color": {
              "property": "color",
              "type": "identity"
            },
            "fill-opacity": {
              "stops": [
                [0, 0.5],
                [12, 0.3]
              ]
            }
          }
        },
        {
          "id": "burwell_stroke",
          "type": "line",
          "source": "burwell",
          "source-layer": "units",
          "filter": ["!=", "color", ""],
          "minzoom": 0,
          "maxzoom": 16,
          "paint": {
            "line-color": "#777777",
            "line-width": 0,
            // "line-width": {
            //   "stops": [
            //     [0, 0.15],
            //     [1, 0.15],
            //     [2, 0.15],
            //     [3, 0.15],
            //     [4, 0.2],
            //     [5, 0.4],
            //     [6, 0.05],
            //     [7, 0.1],
            //     [8, 0.4],
            //     [9, 0.5],
            //     [10, 0.35],
            //     [11, 0.4],
            //     [12, 1],
            //     [13, 1.25],
            //     [14, 1.5],
            //     [15, 1.75],
            //     [16, 2]
            //   ]
            // },
            "line-opacity": {
              "stops": [
                [0, 0],
                [4, 0.5]
              ]
            }
          }
        },
        // Hide water
        {
          "id": "burwell_water_fill",
          "type": "fill",
          "source": "burwell",
          "source-layer": "units",
          "filter": ["==", "color", ""],
          "minzoom": 0,
          "maxzoom": 16,
          "paint": {
            "fill-opacity": 0
          }
        },
        {
          "id": "burwell_water_line",
          "type": "line",
          "source": "burwell",
          "source-layer": "units",
          "filter": ["==", "color", ""],
          "minzoom": 0,
          "maxzoom": 16,
          "paint": {
            "line-opacity": 0,
            "line-width": 1
          }
        },
        // {
        //   "id": "lines",
        //   "type": "line",
        //   "source": "burwell",
        //   "source-layer": "lines",
        //   "filter": ["!in", "type", "moraine", "lineament"],
        //   "minzoom": 0,
        //   "maxzoom": 16,
        //   "layout": {
        //     "line-join": {
        //       "property": "type",
        //       "type": "categorical",
        //       "stops": [
        //         ["dike", "miter"],
        //         ["fold", "miter"],
        //         ["anticline", "miter"],
        //         ["syncline", "miter"],
        //         ["monocline", "miter"],
        //         ["moraine", "round"],
        //         ["flow", "miter"],
        //         ["sill", "miter"],
        //         ["vein", "round"],
        //         ["marker bed", "miter"],
        //         ["", "miter"],
        //       ]
        //     },
        //     // "line-cap": {
        //     //   "property": "type",
        //     //   "type": "categorical",
        //     //   "stops": [
        //     //     ["dike", "butt"],
        //     //     ["fold", "butt"],
        //     //     ["anticline", "butt"],
        //     //     ["syncline", "butt"],
        //     //     ["monocline", "butt"],
        //     //     ["moraine", "round"],
        //     //     ["flow", "butt"],
        //     //     ["sill", "butt"],
        //     //     ["vein", "round"],
        //     //     ["marker bed", "butt"],
        //     //     ["", "butt"],
        //     //   ]
        //     // },
        //   },
        //   "paint": {
        //   //  "line-color": "#000000",
        //     // "line-color": {
        //     //   "property": "type",
        //     //   "type": "categorical",
        //     //   "stops": [
        //     //     ["dike", "#FF4136"],
        //     //     ["fold", "#F012BE"],
        //     //     ["anticline", "#F012BE"],
        //     //     ["syncline", "#F012BE"],
        //     //     ["monocline", "#F012BE"],
        //     //     ["moraine", "#3498DB"],
        //     //     ["flow", "#FF4136"],
        //     //     ["sill", "#FF4136"],
        //     //     ["vein", "#FF4136"],
        //     //     ["marker bed", "#333333"],
        //     //     ["", "#000000"]
        //     //   ]
        //     // },
        //     "line-width": {
        //       "property": "type",
        //       "type": "categorical",
        //       "stops": [
        //         [{ "zoom": 0, "value": "" }, 0.3],
        //
        //         [{ "zoom": 1, "value": "" }, 0.3],
        //
        //         [{ "zoom": 2, "value": "" }, 0.3],
        //         [{ "zoom": 2, "value": "dike" }, 0.25],
        //         [{ "zoom": 2, "value": "sill" }, 0.25],
        //
        //         [{ "zoom": 3, "value": "" }, 0.6],
        //         [{ "zoom": 3, "value": "dike" }, 0.35],
        //         [{ "zoom": 3, "value": "sill" }, 0.35],
        //
        //         [{ "zoom": 4, "value": "" }, 0.55],
        //         [{ "zoom": 4, "value": "dike" }, 0.3],
        //         [{ "zoom": 4, "value": "sill" }, 0.3],
        //
        //         [{ "zoom": 5, "value": "" }, 0.6],
        //         [{ "zoom": 5, "value": "dike" }, 0.35],
        //         [{ "zoom": 5, "value": "sill" }, 0.35],
        //
        //         [{ "zoom": 6, "value": "" }, 0.45],
        //         [{ "zoom": 6, "value": "dike" }, 0.2],
        //         [{ "zoom": 6, "value": "sill" }, 0.2],
        //
        //         [{ "zoom": 7, "value": "" }, 0.4],
        //         [{ "zoom": 7, "value": "dike" }, 0.25],
        //         [{ "zoom": 7, "value": "sill" }, 0.25],
        //         [{ "zoom": 7, "value": "fold" }, 0.5],
        //         [{ "zoom": 7, "value": "anticline" }, 0.5],
        //         [{ "zoom": 7, "value": "syncline" }, 0.5],
        //         [{ "zoom": 7, "value": "monocline" }, 15],
        //
        //         [{ "zoom": 8, "value": "" }, 0.7],
        //         [{ "zoom": 8, "value": "dike" }, 0.45],
        //         [{ "zoom": 8, "value": "sill" }, 0.45],
        //         [{ "zoom": 8, "value": "fold" }, 0.8],
        //         [{ "zoom": 8, "value": "anticline" }, 0.8],
        //         [{ "zoom": 8, "value": "syncline" }, 0.8],
        //         [{ "zoom": 8, "value": "monocline" }, 0.8],
        //
        //         [{ "zoom": 9, "value": "" }, 0.8],
        //         [{ "zoom": 9, "value": "dike" }, 0.65],
        //         [{ "zoom": 9, "value": "sill" }, 0.65],
        //         [{ "zoom": 9, "value": "fold" }, 0.9],
        //         [{ "zoom": 9, "value": "anticline" }, 0.9],
        //         [{ "zoom": 9, "value": "syncline" }, 0.9],
        //         [{ "zoom": 9, "value": "monocline" }, 0.9],
        //
        //         [{ "zoom": 10, "value": "" }, 0.8],
        //         [{ "zoom": 10, "value": "dike" }, 0.55],
        //         [{ "zoom": 10, "value": "sill" }, 0.55],
        //         [{ "zoom": 10, "value": "moraine" }, 0.5],
        //         [{ "zoom": 10, "value": "vein" }, 0.5],
        //         [{ "zoom": 10, "value": "fold" }, 0.9],
        //         [{ "zoom": 10, "value": "anticline" }, 0.9],
        //         [{ "zoom": 10, "value": "syncline" }, 0.9],
        //         [{ "zoom": 10, "value": "monocline" }, 0.9],
        //
        //         [{ "zoom": 11, "value": "" }, 1.1],
        //         [{ "zoom": 11, "value": "dike" }, 0.85],
        //         [{ "zoom": 11, "value": "sill" }, 0.85],
        //         [{ "zoom": 11, "value": "moraine" }, 0.8],
        //         [{ "zoom": 11, "value": "vein" }, 0.8],
        //         [{ "zoom": 11, "value": "fold" }, 1.2],
        //         [{ "zoom": 11, "value": "anticline" }, 1.2],
        //         [{ "zoom": 11, "value": "syncline" }, 1.2],
        //         [{ "zoom": 11, "value": "monocline" }, 1.2],
        //
        //         [{ "zoom": 12, "value": "" }, 1.3],
        //         [{ "zoom": 12, "value": "dike" }, 0.9],
        //         [{ "zoom": 12, "value": "sill" }, 0.9],
        //         [{ "zoom": 12, "value": "moraine" }, 0.8],
        //         [{ "zoom": 12, "value": "vein" }, 0.8],
        //         [{ "zoom": 12, "value": "flow" }, 1.3],
        //         [{ "zoom": 12, "value": "fold" }, 1.4],
        //         [{ "zoom": 12, "value": "anticline" }, 1.4],
        //         [{ "zoom": 12, "value": "syncline" }, 1.4],
        //         [{ "zoom": 12, "value": "monocline" }, 1.4]
        //       ]
        //     },
        //     "line-width": {
        //       "stops": [
        //         [0, 0.4],
        //         [1, 0.4],
        //         [2, 0.4],
        //         [3, 0.4],
        //         [4, 0.35],
        //         [5, 0.5],
        //         [6, 0.25],
        //         [7, 0.5],
        //         [8, 1],
        //         [9, 0.5],
        //         [10, 1],
        //         [11, 1.75],
        //         [12, 2.5],
        //         [13, 3],
        //         [14, 4],
        //         [15, 5],
        //         [16, 6]
        //       ]
        //     },
        //   }
        // },
        {
          "id": "faults",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["in", "type", "fault", "normal fault", "strike-slip fault", "reverse fault", "growth fault", "fault zone", "zone"],
          "minzoom": 0,
          "maxzoom": 16,
          "paint": {
            "line-color": "#000000",
            "line-width": {
              "stops": [
                [0, 0.3],
                [1, 0.3],
                [2, 0.3],
                [3, 0.3],
                [4, 0.5],
                [5, 0.6],
                [6, 0.45],
                [7, 0.4],
                [8, 0.7],
                [9, 0.8],
                [10, 0.7],
                [11, 1.1],
                [12, 1.3],
                [13, 1.5],
                [14, 1.6],
                [15, 1.75],
                [16, 2.2]
              ]
            },
            "line-opacity": 1
          }
        },
        {
          "id": "moraines",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["==", "type", "moraine"],
          "minzoom": 12,
          "maxzoom": 16,
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#3498DB",
            "line-dasharray": [1, 2],
            "line-width": {
              "stops": [
                [ 10, 1 ],
                [ 11, 2 ],
                [ 12, 2 ],
                [ 13, 2.5 ],
                [ 14, 3 ],
                [ 15, 3 ],
              ]
            },
            "line-opacity": {
              "stops": [
                [ 10, 0.2 ],
                [ 13, 1 ]
              ]
            }
          }
        },
        {
          "id": "eskers",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["==", "type", "esker"],
          "minzoom": 12,
          "maxzoom": 16,
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#00FFFF",
            "line-dasharray": [1, 4],
            "line-width": {
              "stops": [
                [ 10, 1 ],
                [ 11, 2 ],
                [ 12, 2 ],
                [ 13, 2.5 ],
                [ 14, 3 ],
                [ 15, 3 ],
              ]
            },
            "line-opacity": {
              "stops": [
                [ 10, 0.2 ],
                [ 13, 1 ]
              ]
            }
          }
        },
        {
          "id": "lineaments",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["==", "type", "lineament"],
          "minzoom": 0,
          "maxzoom": 16,
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#000000",
            "line-dasharray": [2, 2, 7, 2],
            "line-width": {
              "stops": [
                [ 9, 1],
                [ 10, 1 ],
                [ 11, 2 ],
                [ 12, 2 ],
                [ 13, 2.5 ],
                [ 14, 3 ],
                [ 15, 3 ],
              ]
            },
            "line-opacity": 1
          }
        },
        {
          "id": "synclines",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["==", "type", "syncline"],
          "minzoom": 0,
          "maxzoom": 16,
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#F012BE",
            "line-width": {
              "stops": [
                [0, 1],
                [7, 0.25],
                [8, 0.4],
                [9, 0.45],
                [10, 0.45],
                [11, 0.6],
                [12, 0.7],
                [13, 0.9],
                [14, 1.4],
                [15, 1.75],
                [16, 2.2]
              ]
            },
            "line-opacity": 1
          }
        },
        {
          "id": "monoclines",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["==", "type", "monocline"],
          "minzoom": 0,
          "maxzoom": 16,
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#F012BE",
            "line-width": {
              "stops": [
                [0, 1],
                [7, 0.25],
                [8, 0.4],
                [9, 0.45],
                [10, 0.45],
                [11, 0.6],
                [12, 0.7],
                [13, 0.9],
                [14, 1.4],
                [15, 1.75],
                [16, 2.2]
              ]
            },
            "line-opacity": 1
          }
        },
        {
          "id": "folds",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["==", "type", "fold"],
          "minzoom": 0,
          "maxzoom": 16,
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#F012BE",
            "line-width": {
              "stops": [
                [0, 1],
                [7, 0.25],
                [8, 0.4],
                [9, 0.45],
                [10, 0.45],
                [11, 0.6],
                [12, 0.7],
                [13, 0.9],
                [14, 1.4],
                [15, 1.75],
                [16, 2.2]
              ]
            },
            "line-opacity": 1
          }
        },
        {
          "id": "dikes",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["==", "type", "dike"],
          "minzoom": 6,
          "maxzoom": 16,
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#FF4136",
            "line-width": {
              "stops": [
                [0, 1],
                [7, 0.25],
                [8, 0.4],
                [9, 0.45],
                [10, 0.45],
                [11, 0.6],
                [12, 0.7],
                [13, 0.9],
                [14, 1.4],
                [15, 1.75],
                [16, 2.2]
              ]
            },
            "line-opacity": {
              "stops": [
                [ 6, 0.2 ],
                [ 10, 1 ]
              ]
            }
          }
        },
        {
          "id": "anticlines",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["==", "type", "anticline"],
          "minzoom": 0,
          "maxzoom": 16,
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#F012BE",
            "line-width": {
              "stops": [
                [0, 1],
                [7, 0.25],
                [8, 0.4],
                [9, 0.45],
                [10, 0.45],
                [11, 0.6],
                [12, 0.7],
                [13, 0.9],
                [14, 1.4],
                [15, 1.75],
                [16, 2.2]
              ]
            },
            "line-opacity": 1
          }
        },
        {
          "id": "flows",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["==", "type", "flow"],
          "minzoom": 0,
          "maxzoom": 16,
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#FF4136",
            "line-width": {
              "stops": [
                [0, 1],
                [7, 0.25],
                [8, 0.4],
                [9, 0.45],
                [10, 0.45],
                [11, 0.6],
                [12, 0.7],
                [13, 0.9],
                [14, 1.4],
                [15, 1.75],
                [16, 2.2]
              ]
            },
            "line-opacity": 1
          }
        },
        {
          "id": "sills",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["==", "type", "sill"],
          "minzoom": 0,
          "maxzoom": 16,
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#FF4136",
            "line-width": {
              "stops": [
                [0, 1],
                [7, 0.25],
                [8, 0.4],
                [9, 0.45],
                [10, 0.45],
                [11, 0.6],
                [12, 0.7],
                [13, 0.9],
                [14, 1.4],
                [15, 1.75],
                [16, 2.2]
              ]
            },
            "line-opacity": 1
          }
        },
        {
          "id": "veins",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["==", "type", "vein"],
          "minzoom": 0,
          "maxzoom": 16,
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#FF4136",
            "line-width": {
              "stops": [
                [0, 1],
                [7, 0.25],
                [8, 0.4],
                [9, 0.45],
                [10, 0.45],
                [11, 0.6],
                [12, 0.7],
                [13, 0.9],
                [14, 1.4],
                [15, 1.75],
                [16, 2.2]
              ]
            },
            "line-opacity": {
              "stops": [
                [ 6, 0.2 ],
                [ 10, 1 ]
              ]
            }
          }
        },
        {
          "id": "marker_beds",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["in", "type", "marker bed", "bed"],
          "minzoom": 12,
          "maxzoom": 16,
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#333333",
            "line-width": {
              "stops": [
                [10, 0.8],
                [11, 0.8],
                [12, 0.9],
                [13, 0.9],
                [14, 1.4],
                [15, 1.75],
                [16, 2.2]
              ]
            },
            "line-opacity": 1
          }
        },
        {
          "id": "craters",
          "type": "line",
          "source": "burwell",
          "source-layer": "lines",
          "filter": ["in", "type", "crater", "impact structure"],
          "minzoom": 10,
          "maxzoom": 16,
          "paint": {
            "line-dasharray": [6, 6],
            "line-color": "#000000",
            "line-width": {
              "stops": [
                [10, 0.6],
                [11, 0.6],
                [12, 0.72],
                [13, 0.72],
                [14, 1],
                [15, 1.3],
                [16, 1.8]
              ]
            },
            "line-opacity": 1
          }
        },
        {
          "id": "infoMarker",
          "type": "symbol",
          "source": "info_marker",
          "layout": {
            "icon-size": 0.65,
            "icon-image": "pin",
            "icon-offset": [0, -28],
            "visibility": "none",
            "icon-allow-overlap": true
          }
        },
        {
          "id": "elevationPoint",
          "type": "symbol",
          "source": "elevationPoints",
          "layout": {
            "icon-size": 1,
            "icon-image": "circle-stroked-15",
            "icon-allow-overlap": true
          },
          "paint": {
            "icon-color": "#ffffff"
          }
        },
        {
          "id": "elevationLine",
          "type": "line",
          "source": "elevationLine",
          "paint": {
            "line-dasharray": [4, 2],
            "line-width": 5,
            "line-color": "#ffffff",
            "line-opacity": 1
          }
        },
        {
          "id": "pbdbCollections",
          "type": "circle",
          "source": "pbdb",
          "source-layer": "pbdb-collections",
          "layout": {
            "visibility": "none"
          },
          "paint": {
            "circle-radius": {
              "property": "n_collections",
              "default": 10,
              "stops": [
                [{zoom: 0, value: 1}, 5],
                [{zoom: 0, value: 5000}, 30],
                [{zoom: 10, value: 1}, 10],
                [{zoom: 10, value: 50}, 30],
              ]
            },
            "circle-color": "#ffffff",
            "circle-opacity": 0.8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#aaaaaa"
          }
        },
        {
          "id": "pbdbCollections_highlight",
          "type": "circle",
          "source": "pbdb",
          "source-layer": "pbdb-collections",
          "paint": {
            "circle-radius": 10,
            "circle-color": "#ffffff",
            "circle-opacity": 1,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#045275"
          },
          "filter": ["==", "collection_no", ""]
        },
    ]
}
