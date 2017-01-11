import { Component } from '@angular/core'
import { NavParams, NavController, Platform, ViewController } from 'ionic-angular'
import { CheckinService } from '../../services/checkin-service.service'
import { Settings } from '../../services/settings.service'

import { PhotoPage } from '../photo/photo'
import { TheMap } from '../map/map'

import { CheckinMap } from '../checkin-map/checkin-map'

//import mapboxgl from '../../../assets/js/mapbox-gl.js'
// Ignore mapboxgl...
declare const mapboxgl


@Component({
  selector: 'checkin-page',
  templateUrl: 'checkin-page.html'
})

export class CheckinPage {
  public checkin
  public PBDBURL
  public map

  constructor(
    public platform: Platform,
    public params: NavParams,
    public viewCtrl: ViewController,
    public navCtrl: NavController,
    public checkinService: CheckinService
  ) {
    this.checkin = {
      checkin_id: null,
      person_id: null,
      first_name: '',
      last_name: '',
      notes: '',
      rating: null,
      geom: {},
      near: '',
      created: '',
      photo: null,
      liked: false,
      likes: '',
      observations: []
    }
    this.PBDBURL = Settings.PBDBURL
  }

  ionViewDidEnter() {
    this.checkinService.get({
      checkin_id: this.params.get('checkin_id')
    }, null, (error, result) => {
      this.checkin = result[0]
      this.initializeMap(this.checkin.geom.coordinates)
    })
  }
  ionViewDidLeave() {
    this.map.remove()
    this.map = null
  }

  getRating(rating) {
    return new Array(rating)
  }
  hasKeys(obj) {
    if (!obj) {
      return false
    }
    return (Object.keys(obj).length > 0) ? true : false
  }
  hasKey(obj, key) {
    if (Object.keys(obj).indexOf(key) > -1) {
      return true
    }
    return false
  }

  openPhoto(photo_id) {
    let photos = [this.checkin.photo_id].concat(this.checkin.observations.map(d => { return d.photo }))
    photos = photos.filter(d => { if (d) return d })

    this.navCtrl.push(PhotoPage, {
      // checkin_id: this.checkin.checkin_id,
      // person_id: this.checkin.person_id,
      // photos: photos,
      checkin: this.checkin,
      photo_id: photo_id
    })
  }

  openMap() {
    this.navCtrl.push(CheckinMap, {
      checkin_id: this.checkin.checkin_id.replace('chk|', ''),
      config: {
        mapType: 'checkin',
        checkin: {
          checkin: this.checkin.geom.coordinates,
          observations: this.checkin.observations.map(d => { return d.geometry.coordinates }).filter(d => { if (d.length) return d })
        }
      }
    })
  }

  dismiss() {
    this.viewCtrl.dismiss()
  }

  initializeMap(center) {
    if (!center || !center.length) {
      console.log('skip')
      return
    }
    mapboxgl.accessToken = 'pk.eyJ1IjoiamN6YXBsZXdza2kiLCJhIjoiWnQxSC01USJ9.oleZzfREJUKAK1TMeCD0bg'
    this.map = new mapboxgl.Map({
      container: 'checkin-map',
      style: 'mapbox://styles/mapbox/light-v9',
      attributionControl: false,
      interactive: false,
      dragRotate: false,
      touchZoomRotate: false,
      center: center,
      zoom: 6
    })

    this.map.panTo(center, {
      duration: 0,
      offset: [150, 0],
      animate: false
    })

    this.map.on('load', () => {
      this.map.addSource('markers', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: center
            }
          }]
        }
      })

      this.map.addLayer({
        id: 'marker',
        type: 'symbol',
        source: 'markers',
        layout: {
          'icon-image': 'marker-15',
          'icon-offset': [0, -5]
        }
      })
    })
  }
}
