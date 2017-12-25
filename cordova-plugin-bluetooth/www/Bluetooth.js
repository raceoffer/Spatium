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

exports.startListening = function(success, error) {
    exec(success, error, "Bluetooth", "startListening", []);
};

exports.stopListening = function(success, error) {
    exec(success, error, "Bluetooth", "stopListening", []);
};

exports.getListening = function(success, error) {
    exec(success, error, "Bluetooth", "getListening", []);
};

exports.connect = function(device, success, error) {
    exec(success, error, "Bluetooth", "connect", [device]);
};

exports.disconnect = function(success, error) {
    exec(success, error, "Bluetooth", "disconnect", []);
};

exports.getConnected = function(success, error) {
    exec(success, error, "Bluetooth", "getConnected", []);
};