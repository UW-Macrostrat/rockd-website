import { SETTINGS } from "~/settings";

export function mapStyle(type: object) {
  const clusterThreshold = 1;

  const baseColor = "#868aa2";
  const endColor = "#212435";

  return {
    sources: {
      weaver: {
        type: "vector",
        tiles: [ SETTINGS.rockdApiURL + "/checkin-tile/{z}/{x}/{y}?cluster=true"],
      }
    },
    layers: [
      {
        id: "clusters",
        type: "circle",
        source: "weaver",
        "source-layer": "default",
        filter: ['>', ['get', 'n'], clusterThreshold],
        paint: {
          "circle-radius": [
            'step',
            ['get', 'n'],
            7, 50,
            9, 100,
            11, 150,
            13, 200,
            15,
          ],
          "circle-color": [
            'step',
            ['get', 'n'],
            "#7b7fa0", 50,
            '#636b8d', 100,
            '#4a546e', 150,
            '#353b49', 200,
            endColor
          ],
          "circle-stroke-color": [
            'step',
            ['get', 'n'],
            "#8b8eab", 50,
            '#7a7e96', 100,
            '#5d5f7c', 150,
            '#484b63',
          ],
          "circle-stroke-width": 3,
          "circle-stroke-opacity": 1,
        },
      },
      {
        id: 'cluster-count',
        type: 'symbol',
        source: 'weaver',
        "source-layer": "default",
        filter: ['has', 'n'],
        layout: {
          'text-field': ['get', 'n'],
          'text-size': 10,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          "text-color": "#fff"
        },
      },
      {
        id: 'unclustered-point',
        type: 'circle',
        source: 'weaver',
        "source-layer": "default",
        filter: ['<=', ['get', 'n'], clusterThreshold],
        paint: {
          'circle-color': baseColor,
          'circle-radius': 4,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      },
    ],
  };
}
