import { Component } from '@angular/core'
import { NavParams, NavController, ViewController, App } from 'ionic-angular'
import { CheckinPage } from '../checkin-page/checkin-page'

@Component({
  selector: 'overlapping-checkins',
  templateUrl: 'overlapping-checkins.html'
})

export class OverlappingCheckins {
  public overlappingCheckins

  constructor(
    public navCtrl: NavController,
    public appCtrl: App,
    public params: NavParams,
    public viewCtrl: ViewController
  ) {
    this.overlappingCheckins = this.params.get('overlappingCheckins')
  }

  hasKeys(obj) {
    if (!obj) {
      return false
    }
    return (Object.keys(obj).length > 0) ? true : false
  }

  goToCheckin(checkin) {
    this.dismiss()
    this.appCtrl.getRootNav().push(CheckinPage, { checkin_id: checkin.checkin_id.replace('chk|', '  ') })

  }
  dismiss() {
    this.viewCtrl.dismiss()
  }
}
