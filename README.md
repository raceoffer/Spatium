# Requirements

* npm v5.5
* node v8.9.1
* Angular v6
* Cordova v7.1
* Android SDK v26

# Installation
```bash
npm install -g @angular/cli
npm install -g cordova
```

In the root folder of the repo:
```bash
npm install
```

In cordova/
```bash
npm install
cordova platform add android
```

##### Build UWP app
Install Visual Studio 2015
Install SDK: https://download.microsoft.com/download/6/3/B/63BADCE0-F2E6-44BD-B2F9-60F5F073038E/standalonesdk/SDKSETUP.EXE

In cordova/
```
cordova platform add windows
cordova run windows -- --archs=x86
```


## Warning!
Due to the bug in cordova's local plugin system, if you notice that some local plugins fail to install you should reinstall them manually as:
```bash
cordova plugin add ../plugin-directory-name
```
Issue link: https://issues.apache.org/jira/browse/CB-13503

# Run the app
```bash
cd cordova
cordova run android [--production] [--nocore] [--noprepare] [--nobuild] [--target=xxxxxxxx]
```

## Options
### --production
Enables production mode and minification.
### --nocore
Disables rebuild of crypto-core-async.
### --noprepare
Disables building angular application.
### --nobuild
Disables application compilation (just installs the app).
### --target=xxxxxxxx
Run app on specific device. Get a list of connecteddevices with this command: `adb devices -l`

# Troubleshooting
## Error: Current working directory is not a Cordova-based project.
`mkdir www`
