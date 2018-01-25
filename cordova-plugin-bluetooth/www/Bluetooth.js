var exec = require('cordova/exec');

exports.getSupported = function(){
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "getSupported", []);
	});
}

exports.getEnabled = function() {
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "getEnabled", []);
	});
};

exports.enable = function() {
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "enable", []);
	});
};

exports.listPairedDevices = function() {
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "listPairedDevices", []);
	});
};

exports.discoverDevices = function(onDiscovered) {
	exec(onDiscovered, null, "Bluetooth", "setOnDiscovered", []);
  return new Promise(function(success,error) {
    exec(success, error, "Bluetooth", "discoverDevices", []);
  });
};

exports.cancelDiscovery = function() {
  return new Promise(function(success,error) {
    exec(success, error, "Bluetooth", "cancelDiscovery", []);
  });
};

exports.enableDiscovery = function() {
  return new Promise(function(success,error) {
    exec(success, error, "Bluetooth", "enableDiscovery", []);
  });
};


exports.startListening = function(onConnected,onDisconnected) {
	exec(onConnected, null, "Bluetooth", "setOnConnected", []);
	exec(onDisconnected, null, "Bluetooth", "setOnDisconnected", []);
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "startListening", []);
	});
};

exports.stopListening = function() {
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "stopListening", []);
	});
};

exports.getListening = function() {
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "getListening", []);
	});
};

exports.connect = function(device,onDisconnected) {
	exec(onDisconnected, null, "Bluetooth", "setOnDisconnected", []);
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "connect", [device]);
	});
};

exports.disconnect = function() {
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "disconnect", []);
	});
};

exports.getConnected = function() {
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "getConnected", []);
	});
};

exports.startReading = function(onData) {
	exec(onData, null, "Bluetooth", "setOnData", []);
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "startReading", []);
	});
};

exports.stopReading = function() {
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "stopReading", []);
	});
};

exports.getReading = function(onData) {
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "getReading", []);
	});
};

exports.write = function(data) {
	return new Promise(function(success,error) {
		exec(success, error, "Bluetooth", "write", [data]);
	});
};

exports.openSettings = function() {
  return new Promise(function(success,error) {
    exec(success, error, "Bluetooth", "openSettings", []);
  });
};
