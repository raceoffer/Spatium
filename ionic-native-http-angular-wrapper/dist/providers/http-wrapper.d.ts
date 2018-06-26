import { HTTP } from '@ionic-native/http';
import { HttpClient, HttpClient as angularHttp, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs/Observable";
import "rxjs";
export declare class HttpWrapper {
    private native;
    private angular;
    protected nativeIsAvailable: boolean | null;
    nativeHttp: HTTP;
    angularHttp: HttpClient;
    constructor(native: HTTP, angular: angularHttp);
    isNativeHttpAvailable(): boolean;
    get(url: string, options?: HttpRequest<any>): Observable<any>;
    post(url: string, body: any, options?: HttpRequest<any>): Observable<any>;
    put(url: string, body: any, options?: HttpRequest<any>): Observable<any>;
    delete(url: string, options?: HttpRequest<any>): Observable<any>;
    private parseOptionsForAngularHttp(options);
    private parseHeadersForNativeHttp(options);
    private parseParamsForNativeHttp(options);
    private parseBodyFromNativeHttpResponse(res, options);
    /**
     * @deprecated, use GET|PUT|POST|DELETE methods instead
     * @param {string} url
     * @param {HttpRequest} options
     * @param {Object} data
     * @returns {Observable}
     */
    request(url: string, options: HttpRequest<any>, data?: Object): Observable<any>;
}
