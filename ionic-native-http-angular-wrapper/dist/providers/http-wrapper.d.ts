import { HTTP as nativeHttp } from '@ionic-native/http';
import { Http as angularHttp, RequestOptionsArgs } from "@angular/http";
import { Observable } from "rxjs/Observable";
import "rxjs";
export declare class HttpWrapper {
    private native;
    private angular;
    protected nativeIsAvailable: boolean | null;
    nativeHttp: nativeHttp | any;
    angularHttp: angularHttp | any;
    forceAngular: boolean;
    constructor(native: nativeHttp, angular: angularHttp);
    isNativeHttpAvailable(): boolean;
    get(url: string, options?: RequestOptionsArgs): Observable<any>;
    post(url: string, body: any, options?: RequestOptionsArgs): Observable<any>;
    put(url: string, body: any, options?: RequestOptionsArgs): Observable<any>;
    delete(url: string, options?: RequestOptionsArgs): Observable<any>;
    request(url: string, options: RequestOptionsArgs, data?: Object): Observable<any>;
}
