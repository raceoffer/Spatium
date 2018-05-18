import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

declare const window: any;

const cordovaScript = document.createElement('script');
cordovaScript.setAttribute('src', 'cordova.js');
document.body.appendChild(cordovaScript);

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.log(err));

if (window.MobileAccessibility) {
  window.MobileAccessibility.usePreferredTextZoom(false);
}
