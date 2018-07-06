import { NgModule } from '@angular/core';
import { HttpWrapper } from './providers/http-wrapper';
import { HTTP as nativeHttp } from "@ionic-native/http";
var NativeHttpWrapper = /** @class */ (function () {
    function NativeHttpWrapper() {
    }
    NativeHttpWrapper.decorators = [
        { type: NgModule, args: [{
                    providers: [
                        HttpWrapper,
                        nativeHttp
                    ]
                },] },
    ];
    /** @nocollapse */
    NativeHttpWrapper.ctorParameters = function () { return []; };
    return NativeHttpWrapper;
}());
export { NativeHttpWrapper };
//# sourceMappingURL=native-http-wrapper.module.js.map