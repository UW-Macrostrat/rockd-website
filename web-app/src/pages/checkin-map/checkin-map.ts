import { Component } from '@angular/core'
import { App, NavParams, NavController, ViewController } from 'ionic-angular'
import { CheckinService } from '../../services/checkin-service.service'

import { CheckinPage } from '../checkin-page/checkin-page'

@Component({
  selector: 'checkin-map',
  templateUrl: 'checkin-map.html'
})

export class CheckinMap {
  public config = {
    checkin: [],
    observations: []
  }

  constructor(
    public params: NavParams,
    public viewCtrl: ViewController,
    public navCtrl: NavController,
    public checkinService: CheckinService,
    public appCtrl: App,
  ) {

  }

  ngOnInit() {
    this.viewCtrl.setBackButtonText('Checkin')

    let incomingConfig = this.params.get('config')

    if (!incomingConfig && this.params.get('checkin_id')) {
      this.checkinService.get({
        checkin_id: this.params.get('checkin_id')
      }, null, (error, result) => {
        let checkin = result[0]

        this.config = {
          checkin: checkin.geom.coordinates,
          observations: checkin.observations.map(d => { return d.geometry.coordinates }).filter(d => { if (d.length) return d })
        }

        // Having a default history on this page will force the back button to show, but then we want to remove that page because we can't pass navParams with it.
        this.appCtrl.getRootNav().remove(0, 1)
        // Manually insert the checkin page into the navigation stack
        this.appCtrl.getRootNav().insert(0, CheckinPage, { checkin_id: checkin.checkin_id.replace('chk|', '') })

      })
    } else if (incomingConfig) {
      this.config = incomingConfig.checkin
    }
  }

  dismiss() {
    this.viewCtrl.dismiss()
  }

}
