import { Component, ChangeDetectorRef } from '@angular/core'
import { NavParams, NavController, Platform, ViewController } from 'ionic-angular'
import { CheckinService } from '../../services/checkin-service.service'
import { Settings } from '../../services/settings.service'

import { PhotoPage } from '../photo/photo'

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
  public ERROR

  constructor(
    public platform: Platform,
    public params: NavParams,
    public viewCtrl: ViewController,
    public navCtrl: NavController,
    public checkinService: CheckinService,
    public changeDetector: ChangeDetectorRef,
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
      observations: [],
      mapURL: ''
    }
    this.PBDBURL = Settings.PBDBURL
    this.ERROR = false
  }

  ionViewDidEnter() {
    this.checkinService.get({
      checkin_id: this.params.get('checkin_id')
    }, null, (error, result) => {
      if (error || !result || !result.length) {
        this.ERROR = true
        return
      }
      this.checkin = result[0]
    })
  }

  ionViewDidLeave() {
    if (this.map) {
      this.map.remove()
      this.map = null
    }
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

  urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, '<a href="$1" target="_blank" class="external-link">$1</a>')
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
}
