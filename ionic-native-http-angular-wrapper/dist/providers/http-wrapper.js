import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http';
import { HttpClient, HttpHeaders, HttpRequest } from "@angular/common/http";
import { checkAvailability } from '@ionic-native/core';
import { Observable } from "rxjs/Observable";
import "rxjs";
var HttpWrapper = /** @class */ (function () {
    function HttpWrapper(native, angular) {
        this.native = native;
        this.angular = angular;
        this.nativeIsAvailable = null;
        this.nativeHttp = native;
        this.angularHttp = angular;
    }
    HttpWrapper.prototype.isNativeHttpAvailable = function () {
        if (this.nativeIsAvailable === null) {
            this.nativeIsAvailable = checkAvailability('cordova.plugin.http') === true || checkAvailability('cordovaHTTP') === true;
        }
        return this.nativeIsAvailable;
    };
    HttpWrapper.prototype.get = function (url, options) {
        var _this = this;
        if (this.isNativeHttpAvailable()) {
            console.log('native get');
            return Observable.fromPromise(this.nativeHttp.get(url, this.parseParamsForNativeHttp(options), this.parseHeadersForNativeHttp(options))).map(function (res) {
                return {
                    json: function () {
                        return JSON.parse(res.data);
                    },
                    text: function (ignoredEncodingHint) {
                        return res.data.toString();
                    },
                    body: _this.parseBodyFromNativeHttpResponse(res, options),
                    headers: new Headers(res.headers)
                };
            });
        }
        console.log('angular get');
        return this.angularHttp.get(url, this.parseOptionsForAngularHttp(options));
    };
    HttpWrapper.prototype.post = function (url, body, options) {
        var _this = this;
        if (this.isNativeHttpAvailable()) {
            return Observable.fromPromise(this.nativeHttp.post(url, body, this.parseHeadersForNativeHttp(options))).map(function (res) {
                return {
                    json: function () {
                        return JSON.parse(res.data);
                    },
                    text: function (ignoredEncodingHint) {
                        return res.data.toString();
                    },
                    body: _this.parseBodyFromNativeHttpResponse(res, options),
                    headers: new Headers(res.headers)
                };
            });
        }
        return this.angularHttp.post(url, body, this.parseOptionsForAngularHttp(options));
    };
    HttpWrapper.prototype.put = function (url, body, options) {
        var _this = this;
        if (this.isNativeHttpAvailable()) {
            return Observable.fromPromise(this.nativeHttp.put(url, body, this.parseHeadersForNativeHttp(options))).map(function (res) {
                return {
                    json: function () {
                        return JSON.parse(res.data);
                    },
                    text: function (ignoredEncodingHint) {
                        return res.data.toString();
                    },
                    body: _this.parseBodyFromNativeHttpResponse(res, options),
                    headers: new Headers(res.headers)
                };
            });
        }
        return this.angularHttp.put(url, body, this.parseOptionsForAngularHttp(options));
    };
    HttpWrapper.prototype.delete = function (url, options) {
        var _this = this;
        if (this.isNativeHttpAvailable()) {
            return Observable.fromPromise(this.nativeHttp.delete(url, this.parseParamsForNativeHttp(options), this.parseHeadersForNativeHttp(options))).map(function (res) {
                return {
                    json: function () {
                        return JSON.parse(res.data);
                    },
                    text: function (ignoredEncodingHint) {
                        return res.data.toString();
                    },
                    body: _this.parseBodyFromNativeHttpResponse(res, options),
                    headers: new Headers(res.headers)
                };
            });
        }
        return this.angularHttp.delete(url, this.parseOptionsForAngularHttp(options));
    };
    HttpWrapper.prototype.parseOptionsForAngularHttp = function (options) {
        var angularOptions = options;
        if (options instanceof HttpRequest) {
            angularOptions = {};
            angularOptions.headers = options !== undefined && options.headers !== undefined ? options.headers : {};
            angularOptions.params = options !== undefined && options.params !== undefined ? options.params : {};
        }
        if (angularOptions === undefined) {
            angularOptions = {};
            angularOptions.responseType = 'json';
        }
        if (angularOptions.responseType === undefined) {
            angularOptions.responseType = 'json';
        }
        if (angularOptions.observe === undefined) {
            angularOptions.observe = 'response';
        }
        return angularOptions;
    };
    HttpWrapper.prototype.parseHeadersForNativeHttp = function (options) {
        var headers = options !== undefined && options.headers !== undefined ? options.headers : {};
        if (headers instanceof Headers) {
            var newHeaders_1 = {};
            headers.forEach(function (value, name) {
                newHeaders_1[name.toString()] = value.toString();
            });
            headers = newHeaders_1;
        }
        return headers;
    };
    HttpWrapper.prototype.parseParamsForNativeHttp = function (options) {
        return options !== undefined && options.params !== undefined ? options.params : {};
    };
    HttpWrapper.prototype.parseBodyFromNativeHttpResponse = function (res, options) {
        if (res.data) {
            if (options === undefined || options.responseType === undefined || options.responseType === 'json') {
                return JSON.parse(res.data);
            }
            return res.data;
        }
        return null;
    };
    /**
     * @deprecated, use GET|PUT|POST|DELETE methods instead
     * @param {string} url
     * @param {HttpRequest} options
     * @param {Object} data
     * @returns {Observable}
     */
    HttpWrapper.prototype.request = function (url, options, data) {
        if (this.isNativeHttpAvailable()) {
            var headers = options.headers;
            if (headers instanceof Headers) {
                var newHeaders_2 = {};
                headers.forEach(function (value, name) {
                    newHeaders_2[name.toString()] = value.toString();
                });
                headers = newHeaders_2;
            }
            switch (options.method) {
                case 'GET':
                    if (data == null) {
                        data = options.params;
                    }
                    return Observable.fromPromise(this.nativeHttp.get(url, data, headers)).map(function (res) {
                        return {
                            json: function () {
                                return JSON.parse(res.data);
                            },
                            text: function (ignoredEncodingHint) {
                                return res.data.toString();
                            },
                            body: res.data,
                            headers: new Headers(res.headers)
                        };
                    });
                case 'POST':
                    return Observable.fromPromise(this.nativeHttp.post(url, data, headers)).map(function (res) {
                        return {
                            json: function () {
                                return JSON.parse(res.data);
                            },
                            text: function (ignoredEncodingHint) {
                                return res.data.toString();
                            },
                            body: res.data,
                            headers: new Headers(res.headers)
                        };
                    });
                case 'PUT':
                    if (data == null) {
                        data = options.params != null ? options.params : {};
                    }
                    return Observable.fromPromise(this.nativeHttp.put(url, data, headers)).map(function (res) {
                        return {
                            json: function () {
                                return JSON.parse(res.data);
                            },
                            text: function (ignoredEncodingHint) {
                                return res.data.toString();
                            },
                            body: res.data,
                            headers: new Headers(res.headers)
                        };
                    });
                case 'DELETE':
                    return Observable.fromPromise(this.nativeHttp.delete(url, data, headers)).map(function (res) {
                        return {
                            json: function () {
                                return JSON.parse(res.data);
                            },
                            text: function (ignoredEncodingHint) {
                                return res.data.toString();
                            },
                            body: res.data,
                            headers: new Headers(res.headers)
                        };
                    });
                default:
                    throw 'Request Method not found';
            }
        }
        else {
            //Make an @angular/common/http request
            var modifiedOptions = options.clone({
                'url': url
            });
            if (options.headers === undefined) {
                modifiedOptions = options.clone({
                    "headers": new HttpHeaders()
                });
            }
            if (data) {
                modifiedOptions = modifiedOptions.clone({
                    "body": JSON.stringify(data)
                });
            }
            return this.angularHttp.request(modifiedOptions);
        }
    };
    HttpWrapper.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */
    HttpWrapper.ctorParameters = function () { return [
        { type: HTTP, },
        { type: HttpClient, },
    ]; };
    return HttpWrapper;
}());
export { HttpWrapper };
//# sourceMappingURL=http-wrapper.js.map