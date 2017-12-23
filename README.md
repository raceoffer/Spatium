# Requirements

* npm v.3.10->8.9.1
* Angular v.1.5
* Cordova v. 7.1
* Android SDK v.26

# Instalation
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
In src/bcoinlib/:
```bash
npm install
```
In cordova/
```bash
npm install
cordova plugin add ../cordova-plugin-android
cordova platform add android ios browser
```

## Warning!
Due to the bug in cordova's local plugin system, you should always revert the changes to config.xml that occur after adding platforms

# Run the app
```bash
cd cordova
cordova run <platform-name>
```
## Options
### --build-bcoin
Run build of the bcoin bundles.
### --target
Defines the build targer. <br />
Possible options: dev, prod. <br />
Default: dev.

# Troubleshooting
## Error: Current working directory is not a Cordova-based project.
`mkdir www`
## Error: Cannot find module 'android-versions'
```bash
cordova platform rm android
cordova platform add android
```