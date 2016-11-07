import { Component } from '@angular/core'
import { NavParams, Platform, ViewController } from 'ionic-angular'
import { Settings } from '../../services/settings.service'

@Component({
  selector: 'map-info',
  templateUrl: 'map-info.html'
})

export class MapInfoModal {
  mapInfo;

  constructor(
    public platform: Platform,
    public params: NavParams,
    public viewCtrl: ViewController
  ) {
    this.mapInfo = this.params.get('mapInfo')
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
}
