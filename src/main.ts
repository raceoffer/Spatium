import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// cordova.js has to be added after angular scripts
const cordovaScript = document.createElement('script');
cordovaScript.setAttribute('src', 'cordova.js');
document.body.appendChild(cordovaScript);

document.addEventListener('deviceready', () => {
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.log(err));
}, false);

if (environment.production) {
  enableProdMode();
}
