var exec = require('cordova/exec');

var PLUGIN_NAME = 'Bluetooth';

exports.getDeviceInfo = function (success, error) {
	console.log("get device info");
    exec(success, error, PLUGIN_NAME, 'getDeviceInfo', []);
};
