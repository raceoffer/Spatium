import { Injectable } from '@angular/core';
import { HTTP as nativeHttp } from '@ionic-native/http';
import { Headers, Http as angularHttp, RequestMethod } from "@angular/http";
import { checkAvailability } from '@ionic-native/core';
import { Observable } from "rxjs/Observable";
import { from } from 'rxjs';
import { map } from "rxjs/operators";
import "rxjs";
var HttpWrapper = /** @class */ (function () {
    function HttpWrapper(native, angular) {
        this.native = native;
        this.angular = angular;
        this.nativeIsAvailable = null;
        this.nativeHttp = false;
        this.angularHttp = false;
        this.forceAngular = false;
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
        options.method = RequestMethod.Get;
        return this.request(url, options);
    };
    HttpWrapper.prototype.post = function (url, body, options) {
        options.method = RequestMethod.Post;
        return this.request(url, options, body);
    };
    HttpWrapper.prototype.put = function (url, body, options) {
        options.method = RequestMethod.Put;
        return this.request(url, options, body);
    };
    HttpWrapper.prototype.delete = function (url, options) {
        options.method = RequestMethod.Delete;
        return this.request(url, options);
    };
    HttpWrapper.prototype.request = function (url, options, data) {
        if (this.isNativeHttpAvailable() && !this.forceAngular) {
            var headers = options.headers;
            if (headers instanceof Headers) {
                var newHeaders_1 = {};
                headers.forEach(function (value, name) {
                    newHeaders_1[name.toString()] = value.toString();
                });
                headers = newHeaders_1;
            }
            switch (options.method) {
                case RequestMethod.Get:
                    if (data == null) {
                        data = options.params;
                    }
                    return from(this.nativeHttp.get(url, data, headers)).pipe(
                        map(function (res) {
                            return {
                                json: function () {
                                    return JSON.parse(res.data);
                                },
                                text: function (ignoredEncodingHint) {
                                    return res.data.toString();
                                },
                                data: res.data,
                                headers: new Headers(res.headers)
                            };
                        })
                    )
                case RequestMethod.Post:
                    if (data == null) {
                        data = options.body != null ? options.body : {};
                    }
                    return from(this.nativeHttp.post(url, data, headers)).pipe(
                        map(function (res) {
                            return {
                                json: function () {
                                    return JSON.parse(res.data);
                                },
                                text: function (ignoredEncodingHint) {
                                    return res.data.toString();
                                },
                                data: res.data,
                                headers: new Headers(res.headers)
                            };
                        })
                    )
                case RequestMethod.Put:
                    if (data == null) {
                        data = options.body != null ? options.body : {};
                    }
                    return from(this.nativeHttp.put(url, data, headers)).pipe(
                        map(function (res) {
                            return {
                                json: function () {
                                    return JSON.parse(res.data);
                                },
                                text: function (ignoredEncodingHint) {
                                    return res.data.toString();
                                },
                                data: res.data,
                                headers: new Headers(res.headers)
                            };
                        })
                    )
                case RequestMethod.Delete:
                    if (data == null) {
                        data = options.body != null ? options.body : {};
                    }
                    console.log('deleting with data:', data);
                    return from(this.nativeHttp.delete(url, data, headers)).pipe(
                        map(function (res) {
                            return {
                                json: function () {
                                    return JSON.parse(res.data);
                                },
                                text: function (ignoredEncodingHint) {
                                    return res.data.toString();
                                },
                                data: res.data,
                                headers: new Headers(res.headers)
                            };
                        })
                    )
                default:
                    throw 'Request Method not found';
            }
        }
        else {
            //Make an @angular/http request
            if (options.headers === undefined) {
                options.headers = new Headers();
            }
            if (data) {
                options.body = JSON.stringify(data);
            }
            return this.angularHttp.request(url, options);
        }
    };
    HttpWrapper.decorators = [
        { type: Injectable },
    ];
    /** @nocollapse */
    HttpWrapper.ctorParameters = function () { return [
        { type: nativeHttp, },
        { type: angularHttp, },
    ]; };
    return HttpWrapper;
}());
export { HttpWrapper };
//# sourceMappingURL=http-wrapper.js.map