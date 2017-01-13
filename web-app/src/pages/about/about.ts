import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  templateUrl: 'about.html'
})
export class AboutPage {
  aboutPage = null
  constructor(public navCtrl: NavController) {
  }
}
