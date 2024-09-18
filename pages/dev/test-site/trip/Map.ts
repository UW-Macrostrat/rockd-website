import h from "@macrostrat/hyper";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { BlankImage, Image } from "../index";

export function Map() {
    let data = {
        "success": {
          "v": 2,
          "data": [
            {
              "trip_id": 1,
              "person_id": 1,
              "first_name": "John",
              "last_name": "Czaplewski",
              "name": "Nottingham",
              "description": "Some outcrops around Nottingham",
              "created": "2018-08-31T15:38:17.228Z",
              "updated": "2018-10-15T16:28:43.098Z",
              "status": 1,
              "likes": 7,
              "liked": false,
              "comments": 1,
              "stops": [
                {
                  "stop_id": 1,
                  "name": "Stop 1",
                  "description": "Outcrop near road",
                  "trip_order": 0,
                  "checkin_id": 3570,
                  "checkin": {
                    "checkin_id": 3570,
                    "person_id": 1,
                    "first_name": "John",
                    "last_name": "Czaplewski",
                    "notes": "Hollow Stone",
                    "rating": 5,
                    "lng": -1.14094021678511,
                    "lat": 52.9515549935913,
                    "near": "Nottingham, United Kingdom",
                    "created": "April 30, 2018",
                    "added": "April 30, 2018",
                    "photo": 9488,
                    "likes": 6,
                    "comments": 0,
                    "status": 1,
                    "observations": [
                      {
                        "obs_id": 7842,
                        "photo": 9491,
                        "lng": -1.14093097225077,
                        "lat": 52.9515056114062,
                        "rocks": {
                          "strat_name": {
                            "strat_name_long": "Chester Formation",
                            "strat_name_id": 94571,
                            "strat_name": "Chester",
                            "b_age": 251.2,
                            "b_period": "Triassic",
                            "t_age": 247.2,
                            "t_period": "Triassic",
                            "parent": "New Red Sandstone Supergroup",
                            "ref_id": 27
                          },
                          "map_unit": {
                            "map_id": 2032435,
                            "unit_name": "Triassic Rocks (Undifferentiated)",
                            "distance": 0,
                            "int_name": "Triassic"
                          },
                          "liths": [
                            {
                              "class": "sedimentary",
                              "color": "255, 213, 0, 0.5",
                              "fill": 607,
                              "group": "sandstones",
                              "lith_id": 10,
                              "name": "sandstone",
                              "type": "siliciclastic",
                              "count": 1,
                              "attributes": []
                            }
                          ],
                          "interval": {
                            "int_id": 72,
                            "name": "Olenekian",
                            "abbrev": null,
                            "t_age": 247.2,
                            "b_age": 251.2,
                            "int_type": "age",
                            "color": "176, 81, 165, 0.5"
                          },
                          "notes": ""
                        },
                        "orientation": {
      
                        },
                        "fossils": {
      
                        },
                        "minerals": {
      
                        },
                        "comments": 0
                      },
                      {
                        "obs_id": 7841,
                        "photo": 9490,
                        "lng": -1.14098210965403,
                        "lat": 52.9515165096043,
                        "rocks": {
                          "strat_name": {
                            "strat_name_long": "Chester Formation",
                            "strat_name_id": 94571,
                            "strat_name": "Chester",
                            "b_age": 251.2,
                            "b_period": "Triassic",
                            "t_age": 247.2,
                            "t_period": "Triassic",
                            "parent": "New Red Sandstone Supergroup",
                            "ref_id": 27
                          },
                          "map_unit": {
                            "map_id": 2032435,
                            "unit_name": "Triassic Rocks (Undifferentiated)",
                            "distance": 0,
                            "int_name": "Triassic"
                          },
                          "liths": [
                            {
                              "class": "sedimentary",
                              "color": "255, 213, 0, 0.5",
                              "fill": 607,
                              "group": "sandstones",
                              "lith_id": 10,
                              "name": "sandstone",
                              "type": "siliciclastic",
                              "_id": "activeLithology",
                              "count": 1,
                              "_rev": "26-d12a756ed538c9a2739ef923f5c06769",
                              "attributes": [
                                {
                                  "lith_att_id": 165,
                                  "name": "chossy",
                                  "type": "lithology",
                                  "t_units": 0
                                }
                              ]
                            }
                          ],
                          "interval": {
                            "int_id": 72,
                            "name": "Olenekian",
                            "abbrev": null,
                            "t_age": 247.2,
                            "b_age": 251.2,
                            "int_type": "age",
                            "color": "176, 81, 165, 0.5"
                          },
                          "notes": ""
                        },
                        "orientation": {
      
                        },
                        "fossils": {
      
                        },
                        "minerals": {
      
                        },
                        "comments": 0
                      },
                      {
                        "obs_id": 7840,
                        "photo": 9489,
                        "lng": -1.14068677379817,
                        "lat": 52.9513976411644,
                        "rocks": {
                          "strat_name": {
                            "strat_name_long": "Chester Formation",
                            "strat_name_id": 94571,
                            "strat_name": "Chester",
                            "b_age": 251.2,
                            "b_period": "Triassic",
                            "t_age": 247.2,
                            "t_period": "Triassic",
                            "parent": "New Red Sandstone Supergroup",
                            "ref_id": 27
                          },
                          "map_unit": {
                            "map_id": 2032435,
                            "unit_name": "Triassic Rocks (Undifferentiated)",
                            "distance": 0,
                            "int_name": "Triassic"
                          },
                          "liths": [
                            {
                              "class": "sedimentary",
                              "color": "255, 213, 0, 0.5",
                              "fill": 607,
                              "group": "sandstones",
                              "lith_id": 10,
                              "name": "sandstone",
                              "type": "siliciclastic",
                              "count": 1,
                              "attributes": []
                            }
                          ],
                          "interval": {
                            "int_id": 72,
                            "name": "Olenekian",
                            "abbrev": null,
                            "t_age": 247.2,
                            "b_age": 251.2,
                            "int_type": "age",
                            "color": "176, 81, 165, 0.5"
                          },
                          "notes": "Chester Formation used to be called the Castle Rock Formation"
                        },
                        "orientation": {
      
                        },
                        "fossils": {
      
                        },
                        "minerals": {
      
                        },
                        "comments": 0
                      }
                    ],
                    "xp": {
                      "checkin": 100,
                      "photos": 400,
                      "rocks": 260,
                      "taxa": 0,
                      "orientation": 0,
                      "minerals": 0,
                      "other": 15,
                      "bonus": 0,
                      "total": 775
                    }
                  }
                },
                {
                  "stop_id": 2,
                  "name": "Stop 2 - Tunnel",
                  "description": "The park tunnel under the castle",
                  "trip_order": 1,
                  "checkin_id": 3584,
                  "checkin": {
                    "checkin_id": 3584,
                    "person_id": 1,
                    "first_name": "John",
                    "last_name": "Czaplewski",
                    "notes": "Park Tunnel",
                    "rating": 5,
                    "lng": -1.16018390270193,
                    "lat": 52.9540752193602,
                    "near": "Nottingham, United Kingdom",
                    "created": "May 01, 2018",
                    "added": "May 02, 2018",
                    "photo": 9516,
                    "likes": 9,
                    "comments": 0,
                    "status": 1,
                    "observations": [
                      {
                        "obs_id": 7859,
                        "photo": null,
                        "lng": null,
                        "lat": null,
                        "rocks": {
                          "strat_name": {
                            "strat_name_long": "Chester Formation",
                            "strat_name_id": 94571,
                            "strat_name": "Chester",
                            "b_age": 251.2,
                            "b_period": "Triassic",
                            "t_age": 247.2,
                            "t_period": "Triassic",
                            "parent": "New Red Sandstone Supergroup",
                            "ref_id": 27
                          },
                          "map_unit": {
                            "map_id": 2032435,
                            "unit_name": "Triassic Rocks (Undifferentiated)",
                            "distance": 0,
                            "int_name": "Triassic"
                          },
                          "liths": [
                            {
                              "lith_id": 10,
                              "name": "sandstone",
                              "type": "siliciclastic",
                              "class": "sedimentary",
                              "color": "255, 213, 0, 0.5",
                              "_id": "activeLithology",
                              "count": 1,
                              "_rev": "27-daa8b32fc69a21385a9cb7b95fc68aa8",
                              "attributes": [
                                {
                                  "lith_att_id": 165,
                                  "name": "chossy",
                                  "type": "lithology",
                                  "t_units": 0
                                }
                              ]
                            }
                          ],
                          "interval": {
      
                          },
                          "notes": ""
                        },
                        "orientation": {
      
                        },
                        "fossils": {
      
                        },
                        "minerals": {
      
                        },
                        "comments": 0
                      },
                      {
                        "obs_id": 7864,
                        "photo": 9521,
                        "lng": null,
                        "lat": null,
                        "rocks": {
                          "strat_name": {
                            "strat_name_long": "Chester Formation",
                            "strat_name_id": 94571,
                            "strat_name": "Chester",
                            "b_age": 251.2,
                            "b_period": "Triassic",
                            "t_age": 247.2,
                            "t_period": "Triassic",
                            "parent": "New Red Sandstone Supergroup",
                            "ref_id": 27
                          },
                          "map_unit": {
                            "map_id": 2032435,
                            "unit_name": "Triassic Rocks (Undifferentiated)",
                            "distance": 0,
                            "int_name": "Triassic"
                          },
                          "liths": [
                            {
                              "lith_id": 10,
                              "name": "sandstone",
                              "type": "siliciclastic",
                              "class": "sedimentary",
                              "color": "255, 213, 0, 0.5",
                              "count": 1,
                              "attributes": []
                            },
                            {
                              "lith_id": 14,
                              "name": "conglomerate",
                              "type": "siliciclastic",
                              "class": "sedimentary",
                              "color": "255, 192, 0, 0.5",
                              "attributes": []
                            }
                          ],
                          "interval": {
      
                          },
                          "notes": ""
                        },
                        "orientation": {
                          "strike": null,
                          "strikestd": null,
                          "dip": null,
                          "dipstd": null,
                          "dip_dir": null,
                          "trend": null,
                          "trendstd": null,
                          "plunge": null,
                          "plungestd": null,
                          "feature": {
                            "structure_id": 51,
                            "name": "cross bedding",
                            "structure_type": "paleocurrent",
                            "group": "",
                            "class": "sedimentology"
                          },
                          "notes": ""
                        },
                        "fossils": {
      
                        },
                        "minerals": {
      
                        },
                        "comments": 0
                      },
                      {
                        "obs_id": 7863,
                        "photo": 9520,
                        "lng": null,
                        "lat": null,
                        "rocks": {
                          "strat_name": {
                            "strat_name_long": "Chester Formation",
                            "strat_name_id": 94571,
                            "strat_name": "Chester",
                            "b_age": 251.2,
                            "b_period": "Triassic",
                            "t_age": 247.2,
                            "t_period": "Triassic",
                            "parent": "New Red Sandstone Supergroup",
                            "ref_id": 27
                          },
                          "map_unit": {
                            "map_id": 2032435,
                            "unit_name": "Triassic Rocks (Undifferentiated)",
                            "distance": 0,
                            "int_name": "Triassic"
                          },
                          "liths": [
                            {
                              "lith_id": 10,
                              "name": "sandstone",
                              "type": "siliciclastic",
                              "class": "sedimentary",
                              "color": "255, 213, 0, 0.5",
                              "count": 1,
                              "attributes": []
                            }
                          ],
                          "interval": {
      
                          },
                          "notes": ""
                        },
                        "orientation": {
      
                        },
                        "fossils": {
      
                        },
                        "minerals": {
      
                        },
                        "comments": 0
                      },
                      {
                        "obs_id": 7862,
                        "photo": 9519,
                        "lng": null,
                        "lat": null,
                        "rocks": {
                          "strat_name": {
                            "strat_name_long": "Chester Formation",
                            "strat_name_id": 94571,
                            "strat_name": "Chester",
                            "b_age": 251.2,
                            "b_period": "Triassic",
                            "t_age": 247.2,
                            "t_period": "Triassic",
                            "parent": "New Red Sandstone Supergroup",
                            "ref_id": 27
                          },
                          "map_unit": {
                            "map_id": 2032435,
                            "unit_name": "Triassic Rocks (Undifferentiated)",
                            "distance": 0,
                            "int_name": "Triassic"
                          },
                          "liths": [
                            {
                              "lith_id": 10,
                              "name": "sandstone",
                              "type": "siliciclastic",
                              "class": "sedimentary",
                              "color": "255, 213, 0, 0.5",
                              "count": 2,
                              "attributes": [
                                {
                                  "lith_att_id": 165,
                                  "name": "chossy",
                                  "type": "lithology",
                                  "t_units": 0
                                }
                              ],
                              "_id": "activeLithology",
                              "_rev": "29-4d7a221373a3b76a0411c9cac3476d81"
                            }
                          ],
                          "interval": {
      
                          },
                          "notes": ""
                        },
                        "orientation": {
      
                        },
                        "fossils": {
      
                        },
                        "minerals": {
      
                        },
                        "comments": 0
                      },
                      {
                        "obs_id": 7861,
                        "photo": 9518,
                        "lng": null,
                        "lat": null,
                        "rocks": {
                          "strat_name": {
                            "strat_name_long": "Chester Formation",
                            "strat_name_id": 94571,
                            "strat_name": "Chester",
                            "b_age": 251.2,
                            "b_period": "Triassic",
                            "t_age": 247.2,
                            "t_period": "Triassic",
                            "parent": "New Red Sandstone Supergroup",
                            "ref_id": 27
                          },
                          "map_unit": {
                            "map_id": 2032435,
                            "unit_name": "Triassic Rocks (Undifferentiated)",
                            "distance": 0,
                            "int_name": "Triassic"
                          },
                          "liths": [
                            {
                              "lith_id": 10,
                              "name": "sandstone",
                              "type": "siliciclastic",
                              "class": "sedimentary",
                              "color": "255, 213, 0, 0.5",
                              "count": 1,
                              "attributes": []
                            },
                            {
                              "lith_id": 14,
                              "name": "conglomerate",
                              "type": "siliciclastic",
                              "class": "sedimentary",
                              "color": "255, 192, 0, 0.5"
                            }
                          ],
                          "interval": {
      
                          },
                          "notes": ""
                        },
                        "orientation": {
                          "strike": null,
                          "strikestd": null,
                          "dip": null,
                          "dipstd": null,
                          "dip_dir": null,
                          "trend": null,
                          "trendstd": null,
                          "plunge": null,
                          "plungestd": null,
                          "feature": {
                            "structure_id": 51,
                            "name": "cross bedding",
                            "structure_type": "paleocurrent",
                            "group": "",
                            "class": "sedimentology"
                          },
                          "notes": ""
                        },
                        "fossils": {
      
                        },
                        "minerals": {
      
                        },
                        "comments": 0
                      },
                      {
                        "obs_id": 7860,
                        "photo": 9517,
                        "lng": -1.1611,
                        "lat": 52.9536083333333,
                        "rocks": {
                          "strat_name": {
                            "strat_name_long": "Chester Formation",
                            "strat_name_id": 94571,
                            "strat_name": "Chester",
                            "b_age": 251.2,
                            "b_period": "Triassic",
                            "t_age": 247.2,
                            "t_period": "Triassic",
                            "parent": "New Red Sandstone Supergroup",
                            "ref_id": 27
                          },
                          "map_unit": {
                            "map_id": 2032435,
                            "unit_name": "Triassic Rocks (Undifferentiated)",
                            "distance": 0,
                            "int_name": "Triassic"
                          },
                          "liths": [
                            {
                              "lith_id": 10,
                              "name": "sandstone",
                              "type": "siliciclastic",
                              "class": "sedimentary",
                              "color": "255, 213, 0, 0.5",
                              "count": 2,
                              "attributes": [
                                {
                                  "lith_att_id": 165,
                                  "name": "chossy",
                                  "type": "lithology",
                                  "t_units": 0
                                }
                              ],
                              "_id": "activeLithology",
                              "_rev": "28-041db6b7beb15609ceabedbca0b785d8"
                            }
                          ],
                          "interval": {
      
                          },
                          "notes": "Word has it the king who lived in the castle above had the tunnel dug so that he could go to church without passing by the common folk"
                        },
                        "orientation": {
      
                        },
                        "fossils": {
      
                        },
                        "minerals": {
      
                        },
                        "comments": 1
                      }
                    ],
                    "xp": {
                      "checkin": 100,
                      "photos": 600,
                      "rocks": 390,
                      "taxa": 0,
                      "orientation": 40,
                      "minerals": 0,
                      "other": 5,
                      "bonus": 0,
                      "total": 1135
                    }
                  }
                },
                {
                  "stop_id": 3,
                  "name": "Stop 3",
                  "description": "",
                  "trip_order": 2,
                  "checkin_id": 3585,
                  "checkin": {
                    "checkin_id": 3585,
                    "person_id": 1,
                    "first_name": "John",
                    "last_name": "Czaplewski",
                    "notes": "Below the castle",
                    "rating": 4,
                    "lng": -1.15377462866411,
                    "lat": 52.9486194381308,
                    "near": "Nottingham, United Kingdom",
                    "created": "May 01, 2018",
                    "added": "May 02, 2018",
                    "photo": 9522,
                    "likes": 7,
                    "comments": 0,
                    "status": 1,
                    "observations": [
                      {
                        "obs_id": 7866,
                        "photo": 9524,
                        "lng": null,
                        "lat": null,
                        "rocks": {
                          "strat_name": {
                            "strat_name_long": "Chester Formation",
                            "strat_name_id": 94571,
                            "strat_name": "Chester",
                            "b_age": 251.2,
                            "b_period": "Triassic",
                            "t_age": 247.2,
                            "t_period": "Triassic",
                            "parent": "New Red Sandstone Supergroup",
                            "ref_id": 27
                          },
                          "map_unit": {
                            "map_id": 2032435,
                            "unit_name": "Triassic Rocks (Undifferentiated)",
                            "distance": 0,
                            "int_name": "Triassic"
                          },
                          "liths": [
                            {
                              "lith_id": 10,
                              "name": "sandstone",
                              "type": "siliciclastic",
                              "class": "sedimentary",
                              "color": "255, 213, 0, 0.5"
                            }
                          ],
                          "interval": {
      
                          },
                          "notes": ""
                        },
                        "orientation": {
      
                        },
                        "fossils": {
      
                        },
                        "minerals": {
      
                        },
                        "comments": 0
                      },
                      {
                        "obs_id": 7865,
                        "photo": 9523,
                        "lng": -1.15273036588633,
                        "lat": 52.9492496312761,
                        "rocks": {
                          "strat_name": {
                            "strat_name_long": "Chester Formation",
                            "strat_name_id": 94571,
                            "strat_name": "Chester",
                            "b_age": 251.2,
                            "b_period": "Triassic",
                            "t_age": 247.2,
                            "t_period": "Triassic",
                            "parent": "New Red Sandstone Supergroup",
                            "ref_id": 27
                          },
                          "map_unit": {
                            "map_id": 2032435,
                            "unit_name": "Triassic Rocks (Undifferentiated)",
                            "distance": 0,
                            "int_name": "Triassic"
                          },
                          "liths": [
                            {
                              "lith_id": 10,
                              "name": "sandstone",
                              "type": "siliciclastic",
                              "class": "sedimentary",
                              "color": "255, 213, 0, 0.5",
                              "attributes": []
                            }
                          ],
                          "interval": {
      
                          },
                          "notes": "A candidate for the oldest pub in England, it is dug into the soft sandstone underneath the castle"
                        },
                        "orientation": {
      
                        },
                        "fossils": {
      
                        },
                        "minerals": {
      
                        },
                        "comments": 0
                      }
                    ],
                    "xp": {
                      "checkin": 100,
                      "photos": 300,
                      "rocks": 140,
                      "taxa": 0,
                      "orientation": 0,
                      "minerals": 0,
                      "other": 5,
                      "bonus": 0,
                      "total": 545
                    }
                  }
                }
              ]
            }
          ]
        }
      };

    data = data["success"]["data"][0];


    const mapContainerRef = useRef(null);

    useEffect(() => {
        if (mapContainerRef.current) {
            mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

            // intialize map
            let map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/jczaplewski/cje04mr9l3mo82spihpralr4i',
                center: [ data.stops[0].checkin.lng, data.stops[0].checkin.lat ], // long, lat
                zoom: 12,
            });
            
            let lats = [];
            let lngs = [];


            // add markers
            for(const stop of data.stops) {
                const marker = new mapboxgl.Marker()
                    .setLngLat([stop.checkin.lng, stop.checkin.lat])
                    .addTo(map);

                lats.push(stop.checkin.lat);
                lngs.push(stop.checkin.lng);
            }
        }
    }, []);

    // format date
    let date = new Date(data.updated);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    data.updated = date.toLocaleDateString('en-US', options);

    // profile pic
    let profile_pic = h(BlankImage, {src: "https://rockd.org/api/v2/protected/gravatar/" + data.person_id, className: "profile-pic"});

    // create stops
    let stops = [];
    let temp;
    for(var i = 0; i < data.stops.length; i++) {
        data.stops[i].name = (i + 1) + ". " + data.stops[i].name;
        temp = h('div', {className: 'stop-description'}, [
            h('h2', {className: 'stop-title'}, data.stops[i].name),
            h('p', {className: 'stop-text'}, data.stops[i].description),
            h('div', {className: 'stop-box'},[
                h('div', {className: 'box-header'},[
                    h(BlankImage, {src: "https://rockd.org/api/v2/protected/gravatar/" + data.person_id, className: "profile-pic-checkin"}),
                    h('div', {className: 'checkin-details'}, [
                        h('h4', {className: 'rock'}, data.stops[i].checkin.observations[0].rocks.strat_name.strat_name_long),
                        h('h4', {className: 'location'}, data.stops[i].checkin.near),
                        h('h4', {className: 'name'}, data.stops[i].checkin.first_name + " " + data.stops[i].checkin.last_name),
                    ]),
                    h(Image, {src: "marker.png", className: "marker"}),
                ]),
                h(BlankImage, {src: "https://rockd.org/api/v2/protected/image/1/banner/" + data.stops[i].checkin.photo, className: "checkin-card-img"}),
            ]),
        ])
        stops.push(temp);
    }

    return h("div", {className: 'map'}, [
            h("div", { ref: mapContainerRef, className: 'map-container', style: { width: '100%', height: '75vh' } }),
            h('div', { className: 'stop-container', style: { width: '100%' } }, [
                h('div', { className: 'stop-header' }, [
                    h('h3', {className: 'profile-pic'}, profile_pic),
                    h('div', {className: 'stop-main-info'}, [
                        h('h3', {className: 'name'}, data.first_name + " " + data.last_name),
                        h('h3', {className: 'edited'}, "Edited " + data.updated),
                    ]),
                ]),
                h('h1', {className: 'park'}, data.name),
                h('div', {className: 'stop-list'}, stops),
            ])
        ]);
}
