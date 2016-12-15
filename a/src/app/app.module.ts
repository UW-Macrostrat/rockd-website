import { NgModule } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { IonicApp, IonicModule, DeepLinkConfig } from 'ionic-angular';
import { MyApp } from './app.component';
import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { CheckinInfoModal } from '../pages/checkin-info-modal/checkin-info-modal';
import { MapInfoModal } from '../pages/map-info/map-info';
import { HomePage } from '../pages/home/home';
import { CheckinPage } from '../pages/checkin-page/checkin-page';
import { PhotoPage } from '../pages/photo/photo';
import { TheMap } from '../pages/map/map';

import { CheckinService } from '../services/checkin-service.service';
import { MacrostratService } from '../services/macrostrat.service';
import { Settings } from '../services/settings.service'

export const deepLinkConfig: DeepLinkConfig = {
  links: [
    { component: HomePage, name: 'Home Page', segment: 'map' },
    { component: AboutPage, name: 'About Page', segment: 'about' },
    { component: ContactPage, name: 'Contact Page', segment: 'contact' },
    { component: CheckinPage, name: 'Checkin Page', segment: 'checkin/:checkin_id' },
    { component: PhotoPage, name: 'Photo Page', segment: 'photo/:photo_id', defaultHistory: [CheckinPage]},
    { component: TheMap, name: 'Map', segment: 'merp' },
  ]
};

@NgModule({
  declarations: [
    MyApp,

    AboutPage,
    ContactPage,
    HomePage,
    CheckinPage,
    PhotoPage,
    TheMap,

    CheckinInfoModal,
    MapInfoModal
  ],
  imports: [
    IonicModule.forRoot(MyApp, {
      locationStrategy: 'hash'
  }, deepLinkConfig)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,

    AboutPage,
    ContactPage,
    HomePage,
    CheckinPage,
    PhotoPage,
    TheMap,

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
