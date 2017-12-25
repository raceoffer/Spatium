var exec = require('cordova/exec');

exports.getDeviceInfo = function(success, error) {
    exec(success, error, "Bluetooth", "getDeviceInfo", []);
};

exports.getSupported = function(success, error) {
    exec(success, error, "Bluetooth", "getSupported", []);
};

exports.getEnabled = function(success, error) {
    exec(success, error, "Bluetooth", "getEnabled", []);
};

exports.enable = function(success, error) {
    exec(success, error, "Bluetooth", "enable", []);
};

exports.listPairedDevices = function(success, error) {
    exec(success, error, "Bluetooth", "listPairedDevices", []);
};