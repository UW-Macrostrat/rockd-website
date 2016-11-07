import { Component } from '@angular/core'
import { NavParams, Platform, ViewController } from 'ionic-angular'
import { Settings } from '../../services/settings.service'

@Component({
  selector: 'checkin-info',
  templateUrl: 'checkin-info.html'
})

export class CheckinInfoModal {
  checkin;
  public PBDBURL

  constructor(
    public platform: Platform,
    public params: NavParams,
    public viewCtrl: ViewController
  ) {
    this.checkin = this.params.get('checkin')
    this.PBDBURL = Settings.PBDBURL
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

  dismiss() {
    this.viewCtrl.dismiss()
  }
}
