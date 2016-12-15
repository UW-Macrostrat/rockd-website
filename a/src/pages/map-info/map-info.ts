import { Component } from '@angular/core'
import { NavParams, ViewController } from 'ionic-angular'

@Component({
  selector: 'map-info',
  templateUrl: 'map-info.html'
})

export class MapInfoModal {
  public mapInfo

  constructor(
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
