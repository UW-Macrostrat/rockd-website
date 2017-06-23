import { NgModule } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { IonicApp, IonicModule, DeepLinkConfig } from 'ionic-angular';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { MyApp } from './app.component';

import { AboutPage } from '../pages/about/about';
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
import { AutocompleteService } from '../services/autocomplete.service';
import { Settings } from '../services/settings.service'

import { ENV } from '../config/environment'

export const deepLinkConfig: DeepLinkConfig = {
  links: [
    { component: NewHomePage, name: 'Home Page', segment: 'explore' },
    { component: AboutPage, name: 'About Page', segment: 'about' },
    { component: CheckinPage, name: 'Checkin Page', segment: 'checkin/:checkin_id' },
    { component: CheckinMap, name: 'Checkin Page Map', segment: 'checkin/:checkin_id/map', defaultHistory: [CheckinPage] },
    { component: PhotoPage, name: 'Photo Page', segment: 'photo/:photo_id', defaultHistory: [CheckinPage]},
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

    MapInfoModal,
    OverlappingCheckins,
    Footer
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp, {
      locationStrategy: ENV.LOCATIONSTRATEGY
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

    MapInfoModal,
    OverlappingCheckins,
    Footer
  ],
  providers: [
    Settings,
    CheckinService,
    MacrostratService,
    AutocompleteService,
    { provide: APP_BASE_HREF, useValue: ENV.BASE_URI }
  ]
})
export class AppModule {}
