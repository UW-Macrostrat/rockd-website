import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'
import { enableProdMode } from '@angular/core'
import { ENV } from '../config/environment'

import { AppModule } from './app.module'

if (ENV.PRODUCTION) {
  enableProdMode()
}

platformBrowserDynamic().bootstrapModule(AppModule);
