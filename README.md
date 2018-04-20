# Requirements

* npm v.3.10->8.9.1
* Angular v.1.5
* Cordova v. 7.1
* Android SDK v.26

# Installation
```bash
npm install -g webpack
npm install -g angular@1.5
npm install -g @angular/cli
npm install -g cordova
```

In the root folder of the repo:
```bash
npm install
```
In src/crypto-core-async/:
```bash
npm install
```
In cordova/
```bash
npm install
cordova plugin add ../cordova-plugin-bluetooth
cordova platform add android
```

## Warning!
Due to the bug in cordova's local plugin system, if you notice that some local plugins fail to install you should reinstall them manually
Issue link: https://issues.apache.org/jira/browse/CB-13503

# Run the app
```bash
cd cordova
cordova run android [--production] [--nocore]
```
## Options
### --production
Enables production mode and minification.
### --nocore
Disables rebuild of crypto-core-async.

# Troubleshooting
## Error: Current working directory is not a Cordova-based project.
`mkdir www`