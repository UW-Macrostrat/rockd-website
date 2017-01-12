import { Component, ViewChild } from '@angular/core'
import { App, NavParams, ViewController, Slides } from 'ionic-angular'
import { CheckinService } from '../../services/checkin-service.service'
import { Settings } from '../../services/settings.service'

import { CheckinPage } from '../checkin-page/checkin-page'

@Component({
  templateUrl: 'photo.html',
  selector: 'photo'
})

/*
  Needs:
    checkin
    photo_id (which to open to)
*/
export class PhotoPage {
  @ViewChild('photoSlider') slider: Slides;

  public photos
  public checkin
  public photoData
  public PBDBURL
  public loading = true

  public options = {
    initialSlide: 0
  }

  constructor(
    public params: NavParams,
    public viewCtrl: ViewController,
    public checkinService: CheckinService,
    public settings: Settings,
    public appCtrl: App
  ) {
    this.photos = []
    this.PBDBURL = Settings.PBDBURL
  }

  ionViewDidEnter() {
    this.viewCtrl.setBackButtonText('Checkin')
    this.loading = true

    if (this.params.get('checkin')) {
      this.checkin = this.params.get('checkin')
      this.setup(false)

    } else {
      // Need to query checkins by photo_id!
      this.checkinService.get({
        photo_id: this.params.get('photo_id')
      }, null, (error, result) => {
        this.checkin = result[0]
        this.setup(true)
      })
    }
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

  setup(fresh) {
    let photos = [ this.checkin.photo_id ].concat(this.checkin.observations.map(d => { return d.photo }))
    photos = photos.filter(d => { if (d) return d })
    this.photos = photos

    this.photoData = {}
    this.photoData[this.checkin.photo_id] = {
      title: this.checkin.notes
    }

    this.checkin.observations.forEach(obs => {
      if (obs.photo) {
        this.photoData[obs.photo] = obs
      }
    })

    if (fresh) {
      // Having a default history on this page will force the back button to show, but then we want to remove that page because we can't pass navParams with it.
      this.appCtrl.getRootNav().remove(0, 1)
      // Manually insert the checkin page into the navigation stack
      this.appCtrl.getRootNav().insert(0, CheckinPage, { checkin_id: this.checkin.checkin_id.replace('chk|', '') })
    }

    setTimeout(() => {
      this.slider.slideTo(this.photos.indexOf(parseInt(this.params.get('photo_id'))), 0)
      this.loading = false
    }, 400)
  }

  dismiss() {
    this.viewCtrl.dismiss()
  }

  onSlideChanged() {
    let currentIndex = this.slider.getActiveIndex()

    // There is a bug in rc-5 that pushes an index that doesn't exist if you swipe past the last image
    if ((currentIndex + 1) > this.photos.length) {
      return
    }
    let hash = window.location.hash.split('/')
    hash.pop()
    history.replaceState(null, 'Rockd', hash.join('/') + '/' + this.photos[currentIndex])
  }
}
