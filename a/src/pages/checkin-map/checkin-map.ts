import { Component } from '@angular/core'
import { NavParams, NavController, ViewController } from 'ionic-angular'

@Component({
  selector: 'checkin-map',
  templateUrl: 'checkin-map.html'
})

export class CheckinMap {
  public config

  constructor(
    public params: NavParams,
    public viewCtrl: ViewController,
    public navCtrl: NavController
  ) {

  }

  ngOnInit() {
    let incomingConfig = this.params.get('config')

    this.config = incomingConfig.checkin

  }

  dismiss() {
    this.viewCtrl.dismiss()
  }

}
