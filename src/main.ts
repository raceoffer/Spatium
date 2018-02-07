import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

const cordovaScript = document.createElement('script');
cordovaScript.setAttribute('src', 'cordova.js');
document.body.appendChild(cordovaScript);

document.addEventListener('deviceready', () => {
  if (environment.production) {
    enableProdMode();
  }

  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.log(err));
}, false);
