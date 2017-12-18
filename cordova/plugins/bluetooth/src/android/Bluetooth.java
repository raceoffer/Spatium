package capital.spatium.wallet.bluetooth;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaInterface;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.provider.Settings;

public class Bluetooth extends CordovaPlugin {

    public Bluetooth() {
    }

    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
    }

    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if ("getDeviceInfo".equals(action)) {
            JSONObject r = new JSONObject();
            r.put("uuid", "Device.uuid");
            r.put("version", "this.getOSVersion()");
            r.put("platform", "this.getPlatform()");
            r.put("model", "this.getModel()");
            r.put("manufacturer", "this.getManufacturer()");
	        r.put("isVirtual", "this.isVirtual()");
            r.put("serial", "this.getSerialNumber()");
            callbackContext.success(r);
        }
        else {
            callbackContext.success("error execute");
            return false;
        }
        return true;
    }

}