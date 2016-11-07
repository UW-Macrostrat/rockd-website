import { NgModule, ViewChild } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { IonicApp, IonicModule, DeepLinkConfig } from 'ionic-angular';
import { MyApp } from './app.component';
import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { CheckinInfoModal } from '../pages/checkin-info/checkin-info-modal';
import { MapInfoModal } from '../pages/map-info/map-info';
import { HomePage } from '../pages/home/home';
//import { TabsPage } from '../pages/tabs/tabs';

import { CheckinService } from '../services/checkin-service.service';
import { MacrostratService } from '../services/macrostrat.service';
import { Settings } from '../services/settings.service'

export const deepLinkConfig: DeepLinkConfig = {
  links: [
  //  { component: TabsPage, name: 'Tabs', segment: '' },
    { component: HomePage, name: 'Home Page', segment: '' },
    { component: AboutPage, name: 'About Page', segment: 'about' },
    { component: ContactPage, name: 'Contact Page', segment: 'contact' },
  ]
};

@NgModule({
  declarations: [
    MyApp,

    AboutPage,
    ContactPage,
    HomePage,

    CheckinInfoModal,
    MapInfoModal
  ],
  imports: [
    IonicModule.forRoot(MyApp, {
      locationStrategy: 'path'
  }, deepLinkConfig)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,

    AboutPage,
    ContactPage,
    HomePage,

    CheckinInfoModal,
    MapInfoModal
  ],
  providers: [
    Settings,
    CheckinService,
    MacrostratService,
    { provide: APP_BASE_HREF, useValue: '/' }
  ]
})
export class AppModule {}
