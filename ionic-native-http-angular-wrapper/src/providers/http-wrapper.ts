import {Injectable} from '@angular/core';
import {HTTP as nativeHttp} from '@ionic-native/http';
import {Headers, Http as angularHttp, RequestMethod, RequestOptionsArgs} from "@angular/http";
import {checkAvailability} from '@ionic-native/core';
import {Observable} from "rxjs/Observable";
import { from } from 'rxjs';
import { map } from "rxjs/operators";
import "rxjs";

@Injectable()
export class HttpWrapper {
    protected nativeIsAvailable: boolean | null = null;

    public nativeHttp: nativeHttp | any = false;
    public angularHttp: angularHttp | any = false;

    public forceAngular: boolean = false;

    constructor(private native: nativeHttp, private angular: angularHttp) {
        this.nativeHttp = native;
        this.angularHttp = angular;
    }

    public isNativeHttpAvailable() {
        if (this.nativeIsAvailable === null) {
            this.nativeIsAvailable = checkAvailability('cordova.plugin.http') === true || checkAvailability('cordovaHTTP') === true;
        }
        return this.nativeIsAvailable;
    }

    public get(url: string, options?: RequestOptionsArgs): Observable<any> {
        options.method = RequestMethod.Get;
        return this.request(url, options);
    }

    public post(url: string, body: any, options?: RequestOptionsArgs): Observable<any> {
        options.method = RequestMethod.Post;
        return this.request(url, options, body);
    }

    public put(url: string, body: any, options?: RequestOptionsArgs): Observable<any> {
        options.method = RequestMethod.Put;
        return this.request(url, options, body);
    }

    public delete(url: string, options?: RequestOptionsArgs): Observable<any> {
        options.method = RequestMethod.Delete;
        return this.request(url, options);
    }

    public request(url: string, options: RequestOptionsArgs, data?: Object): Observable<any> {
        if (this.isNativeHttpAvailable() && !this.forceAngular) {
            let headers: Headers | {} | null = options.headers;
            if (headers instanceof Headers) {
                let newHeaders: any = {};
                headers.forEach(function (value, name) {
                    newHeaders[name.toString()] = value.toString();
                });
                headers = newHeaders;
            }
            switch (options.method) {
                case RequestMethod.Get:
                    if (data == null) {
                        data = options.params;
                    }
                    return from(this.nativeHttp.get(url, data, headers)).pipe(
                        map((res: any) => {
                            return {
                                json() {
                                    return JSON.parse(res.data);
                                },
                                text(ignoredEncodingHint) {
                                    return res.data.toString();
                                },
                                data: res.data,
                                headers: new Headers(res.headers)
                            }
                        })
                    )
                case RequestMethod.Post:
                    if (data == null) {
                        data = options.body != null ? options.body : {};
                    }
                    return from(this.nativeHttp.post(url, data, headers)).pipe(
                        map((res: any) => {
                            return {
                                json() {
                                    return JSON.parse(res.data);
                                },
                                text(ignoredEncodingHint) {
                                    return res.data.toString();
                                },
                                data: res.data,
                                headers: new Headers(res.headers)
                            }
                        })
                    )
                case RequestMethod.Put:
                    if (data == null) {
                        data = options.body != null ? options.body : {};
                    }
                    return from(this.nativeHttp.put(url, data, headers)).pipe(
                        map((res: any) => {
                            return {
                                json() {
                                    return JSON.parse(res.data);
                                },
                                text(ignoredEncodingHint) {
                                    return res.data.toString();
                                },
                                data: res.data,
                                headers: new Headers(res.headers)
                            }
                        })
                    )
                case RequestMethod.Delete:
                    if (data == null) {
                        data = options.body != null ? options.body : {};
                    }
                    console.log('deleting with data:',data);
                    return from(this.nativeHttp.delete(url, data, headers)).pipe(
                        map((res: any) => {
                            return {
                                json() {
                                    return JSON.parse(res.data);
                                },
                                text(ignoredEncodingHint) {
                                    return res.data.toString();
                                },
                                data: res.data,
                                headers: new Headers(res.headers)
                            }
                        })
                    )
                default:
                    throw 'Request Method not found';
            }
        } else {
            //Make an @angular/http request
            if (options.headers === undefined) {
                options.headers = new Headers();
            }
            if (data) {
                options.body = JSON.stringify(data);
            }
            return this.angularHttp.request(url, options);
        }
    }
}
