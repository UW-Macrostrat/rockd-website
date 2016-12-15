import { Component } from '@angular/core'
import { NavParams, NavController, Platform, ViewController, ModalController } from 'ionic-angular'

import { CheckinService } from '../../services/checkin-service.service'
import { MacrostratService } from '../../services/macrostrat.service'

import { MapInfoModal } from '../map-info/map-info'

// Ignore mapboxgl...
declare const mapboxgl

@Component({
  selector: 'map',
  templateUrl: 'map.html'
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

  constructor(
    public checkinService: CheckinService,
    public macrostratService: MacrostratService,
    public platform: Platform,
    public params: NavParams,
    public viewCtrl: ViewController,
    public navCtrl: NavController,
    public modalCtrl: ModalController,
  ) {
    this.mapInfo = {
      macrostrat: {},
      burwell: [],
      elevation: null,
      literature: {
        journals: []
      }
    }
  }

  ionViewDidEnter() {
    console.log('enter')
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
    console.log('remove map')
    this.map.remove()
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
    console.log('init map')
    mapboxgl.accessToken = 'pk.eyJ1IjoiamN6YXBsZXdza2kiLCJhIjoiWnQxSC01USJ9.oleZzfREJUKAK1TMeCD0bg'

    let infoMarkerLayer = {
      id: 'infoMarker',
      type: 'circle',
      source: 'info_marker',
      paint: {
        'circle-radius': 8,
        'circle-color': '#333',
        'circle-opacity': 0.9,
      //  'circle-stroke-width': 1,
      //  'circle-stroke-color': '#333333'
      }
    }

    this.map = new mapboxgl.Map({
      container: 'the-map',
      style: {
        version: 8,
        sprite: 'mapbox://styles/mapbox/light-v9',
        sources: {
          satellite: {
            type: 'raster',
            tiles: ['https://api.mapbox.com/styles/v1/jczaplewski/cigmamq4n000xaaknfpuj1zdk/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiamN6YXBsZXdza2kiLCJhIjoiWnQxSC01USJ9.oleZzfREJUKAK1TMeCD0bg'],
            tileSize: 256
          },
          burwell: {
            type: 'raster',
            tiles: ['https://macrostrat.org/api/v2/maps/burwell/emphasized/{z}/{x}/{y}/tile.png'],
            tileSize: 256
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
          }
        ]
      },
      attributionControl: false,
    //  hash: true,
      dragRotate: false,
    //  touchZoomRotate: false,
      center: [0, 0],
      minZoom: 1,
      maxZoom: 17,
      zoom: 1
    })

    const nav = new mapboxgl.NavigationControl()
    this.map.addControl(nav, 'top-left')

    this.map.on('movestart', () => {
      if (this.map.getLayer('infoMarker')) {
        this.map.removeLayer('infoMarker')
      }
    })
    this.map.on('click', (event) => {
      // Reposition and add the info marker to the spot of the click
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

      this.map.addLayer(infoMarkerLayer)

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
        this.openMapInfoModal()
      })
    })

    if (type) {
      switch(type) {
        case 'checkin':
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

        case 'all':
          this.map.addSource('checkins', {
            type: 'geojson',
            data: data
          })
          this.map.addLayer({
            id: 'checkins',
            type: 'circle',
            source: 'checkins',
            paint: {
              'circle-radius': 5,
              'circle-color': '#ffffff',
              'circle-opacity': 0.5,
            }
          })
          break

        case 'adjust':

          break
      }
    }
  }

  openMapInfoModal() {
    this.modalCtrl.create(MapInfoModal, {mapInfo: this.mapInfo}).present()
  }
}
