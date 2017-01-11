import { NgModule } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { IonicApp, IonicModule, DeepLinkConfig } from 'ionic-angular';
import { MyApp } from './app.component';

import { AboutPage } from '../pages/about/about';
import { CheckinInfoModal } from '../pages/checkin-info-modal/checkin-info-modal';
import { MapInfoModal } from '../pages/map-info/map-info';
import { NewHomePage } from '../pages/new-home/new-home';
import { CheckinPage } from '../pages/checkin-page/checkin-page';
import { PhotoPage } from '../pages/photo/photo';
import { TheMap } from '../pages/map/map';
import { OverlappingCheckins } from '../pages/overlapping-checkins/overlapping-checkins';
import { Footer } from '../pages/footer/footer';
import { CheckinMap } from '../pages/checkin-map/checkin-map';

import { CheckinService } from '../services/checkin-service.service';
import { MacrostratService } from '../services/macrostrat.service';
import { Settings } from '../services/settings.service'

export const deepLinkConfig: DeepLinkConfig = {
  links: [
    { component: NewHomePage, name: 'Home Page', segment: '' },
    { component: AboutPage, name: 'About Page', segment: 'about' },
    { component: CheckinPage, name: 'Checkin Page', segment: 'checkin/:checkin_id' },
    { component: CheckinMap, name: 'Checkin Page Map', segment: 'checkin/:checkin_id/map' },
    { component: PhotoPage, name: 'Photo Page', segment: 'photo/:photo_id', defaultHistory: [CheckinPage]},
    { component: TheMap, name: 'Map', segment: 'merp' },
  ]
};

@NgModule({
  declarations: [
    MyApp,

    AboutPage,
    NewHomePage,
    CheckinPage,
    PhotoPage,
    TheMap,
    CheckinMap,

    CheckinInfoModal,
    MapInfoModal,
    OverlappingCheckins,
    Footer
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
    NewHomePage,
    CheckinPage,
    PhotoPage,
    TheMap,
    CheckinMap,

    CheckinInfoModal,
    MapInfoModal,
    OverlappingCheckins,
    Footer
  ],
  providers: [
    Settings,
    CheckinService,
    MacrostratService,
    { provide: APP_BASE_HREF, useValue: '/' }
  ]
})
export class AppModule {}
