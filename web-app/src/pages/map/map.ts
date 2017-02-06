import { Component, ChangeDetectorRef, Input, EventEmitter } from '@angular/core'
import { NavParams, NavController, ViewController, ModalController } from 'ionic-angular'
import buffer from '@turf/buffer'
import bbox from '@turf/bbox'

import { CheckinService } from '../../services/checkin-service.service'
import { MacrostratService } from '../../services/macrostrat.service'

import { MapInfoModal } from '../map-info/map-info'
import { CheckinPage } from '../checkin-page/checkin-page'
import { OverlappingCheckins } from '../overlapping-checkins/overlapping-checkins'



// Ignore mapboxgl...
declare const mapboxgl

@Component({
  selector: 'map',
  templateUrl: 'map.html',
  outputs: ['visibleCheckins']
})

/*
@params
  config
    mapType - can be one of the following:
      + checkin (for a single checkin and its observations)
      + adjust (for adjusting the location of a checkin)
      + all (for showing all checkins)

    checkin - to go along with mapType === checkin
      { checkin: [lng, lat], observations: [ [lng, lat] ] }

    coord - to go along with adjust
      [lng, lat]
*/

export class TheMap {

  public map
  public mapInfo
  public overlappingCheckins
  public mapState
  public checkins: any
  public _filters: any = {}
  public loading = false
  // The map emits an observable `visibleCheckins` that simply returns a list of all visible checkins on the map
  visibleCheckins: EventEmitter<any>

  @Input() mapType: any
  @Input() data: any
  @Input() focalLng: any
  @Input() focalLat: any
  @Input() filters: any = []

  // sortAscending(l) {
  //   return l.sort((a, b) => { return a - b })
  // }
  //
  // filtersChanged(existing, incoming) {
  //   if (this.sortAscending(existing.strat_name_ids) !== this.sortAscending(incoming.strat_name_ids)) {
  //     return true
  //   } else if (this.sortAscending(existing.lith_ids) !== this.sortAscending(incoming.lith_ids)) {
  //     return true
  //   } else if (this.sortAscending(existing.mineral_ids) !== this.sortAscending(incoming.mineral_ids)) {
  //     return true
  //   } else if (this.sortAscending(existing.structure_ids) !== this.sortAscending(incoming.structure_ids)) {
  //     return true
  //   } else if ([].concat.apply([], existing.ages) !== [].concat.apply([], incoming.ages)) {
  //     return true
  //   }
  //   return false
  // }

  constructor(
    public checkinService: CheckinService,
    public macrostratService: MacrostratService,
    public params: NavParams,
    public viewCtrl: ViewController,
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public changeDetector: ChangeDetectorRef,
  ) {
    this.mapInfo = {
      macrostrat: {},
      burwell: [],
      elevation: null,
      literature: {
        journals: []
      }
    }
    this.mapState = {
      x: 0,
      y: 0,
      z: 0
    }
    this.overlappingCheckins = []

    // Construct the event emitter for visible checkins
    this.visibleCheckins = new EventEmitter()
  }

  public filterMap = {
    strat_name: 'strat_name_ids',
    people: 'person_ids',
    liths: 'lith_ids',
    lith_atts: 'lith_att_ids',
    intervals: 'ages',
    minerals: 'mineral_ids',
    structures: 'structure_ids',
    taxa: 'taxon_ids'
  }

  ngOnChanges(changes: any) {
    if (!this.map) {
      return
    }

    if (changes.focalLng && changes.focalLng.currentValue != changes.focalLng.previousValue) {
      this.map.easeTo({
        zoom: 14,
        center: [changes.focalLng.currentValue, changes.focalLat.currentValue],
        duration: 5000,
        curve: 1,
        animate: true
      })
    } else if (changes.filters) {
      this._filters = {}
      changes.filters.currentValue.forEach(d => {
        let key = this.filterMap[d.cat]
        if (this._filters[key]) {
          this._filters[key] = this._filters[key].concat(d.vals)
        } else {
          if (key === 'ages') {
            this._filters[key] = [d.vals]
          } else {
            this._filters[key] = d.vals
          }
        }
      })

      // If there are no filters, display all checkins
      if (!Object.keys(this._filters).length) {
        this.map.getSource('checkin-clusters').setData(this.checkins)
        this.map.getSource('checkins').setData(this.checkins)
        setTimeout(() => {
          this.map.fire('moveend', true)
        }, 300)

        return
      }

      let filterMatches = {
        strat_name_ids: [],
        person_ids: [],
        lith_ids: [],
        lith_att_ids: [],
        ages: [],
        mineral_ids: [],
        structure_ids: [],
        taxon_ids: []
      }


      for (var i = 0; i < this.checkins.features.length; i++) {
        Object.keys(this._filters).forEach(f => {
          if (f.indexOf('_id') > -1) {
            let intersection = this._filters[f].filter(j => {
              return this.checkins.features[i].properties[f].indexOf(j) != -1
            })
            if (intersection.length) {
              filterMatches[f].push(this.checkins.features[i].properties.checkin_id)
            }
          } else {
            // Handle ages
            this._filters[f].forEach(range => {
              this.checkins.features[i].properties.age_ranges.forEach(range2 => {
                if (range[0] >= range2[1] && range2[0] >= range[1]) {
                  filterMatches[f].push(this.checkins.features[i].properties.checkin_id)
                }
              })
            })
          }
        })
      }

      let presentFilters = Object.keys(filterMatches).filter(d => { if (filterMatches[d].length) return d }).map(d => { return filterMatches[d] })

      // Interesection of multiple arrays via http://stackoverflow.com/a/11076082/1956065
      let checkinMatches = presentFilters.shift().filter(function(v) {
          return presentFilters.every(function(a) {
              return a.indexOf(v) !== -1;
          })
      })

      let filteredFeatures = this.checkins.features.filter(checkin => {
        if (checkinMatches.indexOf(checkin.properties.checkin_id) > -1) {
          return checkin
        }
      })

      this.map.getSource('checkin-clusters').setData({
        type: 'FeatureCollection',
        features: filteredFeatures
      })
      this.map.getSource('checkins').setData({
        type: 'FeatureCollection',
        features: filteredFeatures
      })
      setTimeout(() => {
        this.map.fire('moveend', true)
      }, 300)
    }
  }

  ngOnInit() {
    this.initializeMap(this.mapType, this.data)
  }

  ngOnDestroy() {
    this.map.remove()
    this.map = null
  }

  ionViewDidEnter() {
    let config = this.params.get('config')

    if (!config || !config.mapType) {
      this.initializeMap(null, null)
      return
    }

    switch(config.mapType) {
      case 'checkin':
        this.initializeMap(config.mapType, config.checkin)
        break
      case 'all':
        this.checkinService.getMap((error, data) => {
          this.initializeMap(config.mapType, data)
        })
        break
      case 'adjust':
        this.initializeMap(config.mapType, config.coord)
        break
      default:
        this.initializeMap(null, null)
    }

  }
  ionViewDidLeave() {
    this.map.remove()
    this.map = null
  }

  hasKeys(obj) {
    if (!obj) {
      return false
    }
    return (Object.keys(obj).length > 0) ? true : false
  }

  dismiss() {
    this.viewCtrl.dismiss()
  }

  initializeMap(type, data) {
    this.mapType = type || 'regular'
    // Need to force the DOM to update to make sure that the div the map will be instantiated into exists!
    //this.appRef.tick()
    this.changeDetector.detectChanges()

    mapboxgl.accessToken = 'pk.eyJ1IjoiamN6YXBsZXdza2kiLCJhIjoiWnQxSC01USJ9.oleZzfREJUKAK1TMeCD0bg'

    this.map = new mapboxgl.Map({
      container: 'the-map-' + this.mapType,
      //container: 'the-map',
      style: {
        version: 8,
        sprite: 'mapbox://styles/mapbox/light-v9',
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
          satellite: {
            type: 'raster',
            url: 'mapbox://mapbox.satellite',
            tileSize: 256
          },
          burwell: {
            type: 'raster',
            tiles: ['https://macrostrat.org/api/v2/maps/burwell/emphasized/{z}/{x}/{y}/tile.png'],
            tileSize: 512
          },
          checkins: {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          },
          info_marker: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [0, 0]
                }
              }]
            }
          }
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster',
            source: 'satellite',
            minzoom: 1,
            maxzoom: 17
          },
          {
            id: 'burwell',
            type: 'raster',
            source: 'burwell',
            minzoom: 1,
            maxzoom: 18,
            paint: {
              'raster-opacity': 0.5
            }
          },
          {
            id: 'checkins',
            type: 'circle',
            source: 'checkins',
            paint: {
              'circle-radius': 5,
              'circle-color': '#ffffff',
              'circle-opacity': 0,
            }
          }, {
            id: 'infoMarker',
            type: 'circle',
            source: 'info_marker',
            paint: {
              'circle-radius': 8,
              'circle-color': '#333',
              'circle-opacity': 0.9,
              //'circle-stroke-width': 1,
              'circle-stroke-color': '#555'
            }
          }
        ]
      },
      attributionControl: false,
    //  hash: true,
      dragRotate: false,
    //  touchZoomRotate: false,
      center: [(this.mapState.x || 0), (this.mapState.y || 0)],
      minZoom: 1,
      maxZoom: 17,
      zoom: this.mapState.z || 1
    })

    setTimeout(() => {
      this.map.resize()
    }, 400)

    const nav = new mapboxgl.NavigationControl()
    this.map.addControl(nav, 'top-right')

    this.map.on('movestart', () => {
      this.map.setPaintProperty('infoMarker', 'circle-opacity', 0)
    })
    this.map.on('moveend', event => {
      let center = this.map.getCenter()
      this.mapState = {
        x: center.lng,
        y: center.lat,
        z: this.map.getZoom()
      }

      let checkins = this.map.queryRenderedFeatures({ layers: ['checkins'] })
      if (checkins) {
        let uniques = this.uniqueFeatures(checkins).map(d => {
          return d.properties
        })

        this.visibleCheckins.emit(uniques)
      }
    })
    this.map.on('click', (event) => {
      var clusters = this.map.queryRenderedFeatures(event.point).filter(d => {
        if (d.layer.id.indexOf('cluster') > -1 && d.layer.id != 'cluster-count' && d.layer.id != 'unclustered') {
          return d
        }
      })
      var checkinPoints = this.map.queryRenderedFeatures(event.point).filter(d => {
        if (d.layer.id === 'checkins') {
          return d
        }
      })

      // Prioritize cluster clicks
      if (clusters.length) {
       /*
        *  If the map is zoomed in all the way and clusters are still being shown, present a list of checkins
        *  under this point to the user and allow them to select one or none.
        *  Because there is no reference to the original data in the clusters (https://github.com/mapbox/mapbox-gl-js/issues/2358)
        *  we create two layers - one of clusters that are shown, and one of the original points which is hidden. When
        *  a user clicks on a cluster, we create a small buffer around that point and then get the bounding box of that
        *  resultant polygon. The coordinates of that bounding box are projected to screen coordinates and then fed to
        *  map#queryRenderedFeatures, which only queries the original, hidden point layer
        */
        if (this.map.getZoom() >= 16.5) {
          var bounds = bbox(buffer({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [ event.lngLat.lng, event.lngLat.lat ]
            }
          }, 0.01, 'miles'))
          let searchArea = [this.map.project([bounds[0], bounds[1]]), this.map.project([bounds[2], bounds[3]])]
          // Display contents of cluster
          this.showOverlappingCheckins(this.uniqueFeatures(this.map.queryRenderedFeatures(searchArea, {layers: ['checkins']})))

       /*
        * If we aren't zoomed in all the way, ease to the cluser
        */
        } else {
          // zoom in more
          this.map.easeTo({
            zoom: this.map.getZoom() + 2,
            center: event.lngLat
          })
        }
        return

      // Checkin point clicks
      } else if (checkinPoints.length) {
        this.navCtrl.push(CheckinPage, { checkin_id: checkinPoints[0].properties.checkin_id.replace('chk|', '') })
        return
      }

     /*
      * If the click wasn't on a cluster or marker, query the geologic map and add a marker
      */
      // Reposition and add the info marker to the spot of the click
      this.loading = true


      this.map.getSource('info_marker').setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [event.lngLat.lng, event.lngLat.lat]
          }
        }]
      })

      this.map.setPaintProperty('infoMarker', 'circle-opacity', 0.9)

      let z = parseInt(this.map.getZoom())
      this.macrostratService.queryMap(event.lngLat, z, (error, data) => {
        if (error || !data || !data.success) {
          console.log(error, data)
          return
        }

        this.mapInfo = data.success.data
        this.mapInfo.lat = event.lngLat.lat.toFixed(4)
        this.mapInfo.lng = event.lngLat.lng.toFixed(4)
        this.mapInfo.literature = {
          journals: []
        }
        if (Object.keys(this.mapInfo.macrostrat).length && this.mapInfo.macrostrat.rank_names.length) {
          this.macrostratService.fetchArticles(this.mapInfo.macrostrat.rank_names, (error, literature) => {
              this.mapInfo.literature = literature
          })
        }
        this.loading = false
        this.openMapInfoModal()
      })
    })


    switch(type) {
      case 'checkin':
        if (!data.checkin.length) {
          return
        }
        this.map.on('load', () => {
          this.map.flyTo({
            center: data.checkin,
            zoom: 12
          })
          this.map.addSource('checkin', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: data.checkin
                }
              }]
            }
          })

          this.map.addSource('observations', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: data.observations.map(d => {
                return {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: d
                  }
                }
              })
            }
          })

          this.map.addLayer({
            id: 'chk',
            type: 'symbol',
            source: 'checkin',
            layout: {
              'icon-image': 'star-15'
            }
          })
          this.map.addLayer({
            id: 'obs',
            type: 'symbol',
            source: 'observations',
            layout: {
              'icon-image': 'marker-11'
            }
          })
        })
        break

      case 'adjust':

        break

      case 'all':
      default:
        if (data) {
          this.map.getSource('checkins').setData(data)
          // this.map.addSource('checkins', {
          //   type: 'geojson',
          //   data: data
          // })
          // this.map.addLayer({
          //   id: 'checkins',
          //   type: 'circle',
          //   source: 'checkins',
          //   paint: {
          //     'circle-radius': 5,
          //     'circle-color': '#ffffff',
          //     'circle-opacity': 0.5,
          //   }
          // })
        } else {
          this.map.on('load', () => {
            this.checkinService.getMap((error, data) => {
              // Save the data for later
              this.checkins = data

              // Update the checkin source
              this.map.getSource('checkins').setData(data)

              this.map.addSource('checkin-clusters', {
                type: 'geojson',
                cluster: true,
                data: data
              })

              var categories = [
                [500, '#08519c'],
                [200, '#3182bd'],
                [100, '#6baed6'],
                [20, '#bdd7e7'],
                [0, '#eff3ff']
              ]

              this.map.addLayer({
                id: 'unclustered',
                type: 'circle',
                source: 'checkin-clusters',
                filter: ['!has', 'point_count'],
                paint: {
                  'circle-radius': 6,
                  'circle-color': '#ffffff',
                  // update to 0.29 for goodness
                  // 'circle-stroke-width': 1,
                  // 'circle-stroke-color': '#ffffff',
                  'circle-opacity': 1,
                }
              })

              categories.forEach((layer, i) => {
                this.map.addLayer({
                  id: `cluster-${i}`,
                  type: 'circle',
                  source: 'checkin-clusters',
                  paint: {
                    'circle-color': layer[1],
                    'circle-radius': 18
                  },
                  filter: i === 0 ?
                    ['>=', 'point_count', layer[0]] :
                    ['all',
                      ['>=', 'point_count', layer[0]],
                      ['<', 'point_count', categories[i - 1][0]]]
                })
              })

              this.map.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'checkin-clusters',
                layout: {
                  'text-field': '{point_count}',
                  'text-font': [
                    'DIN Offc Pro Medium',
                    'Arial Unicode MS Bold'
                  ],
                  'text-size': 12
                }
              })

              this.visibleCheckins.emit(data.features.map(d => {
                return d.properties
              }))
            })
          })

        }

        break
    }
  }

  uniqueFeatures(features) {
    let seen = {}
    let uniques = features.filter(d => {
      if (seen[d.properties.checkin_id]) {
        return false
      } else {
        seen[d.properties.checkin_id] = true
        return true
      }
    })

    return uniques
  }

  showOverlappingCheckins(checkins) {
    this.checkinService.get({
      checkin_id: checkins.map(d => { return d.properties.checkin_id }).join(',')
    }, null, (error, data) => {
      this.modalCtrl.create(OverlappingCheckins, {overlappingCheckins: data}).present()
    })
  }

  openMapInfoModal() {
    this.modalCtrl.create(MapInfoModal, {mapInfo: this.mapInfo}).present()
  }

}
