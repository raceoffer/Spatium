# Requirements

* npm v.3.10
* Angular v.1.5
* Cordova v. 7.1
* Android SDK v.26

# Run the app
`
cd cordova
cordova run <platform-name>
`
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
`
cordova platform rm android
cordova platform add android
`