package capital.spatium.plugin;

import java.util.Set;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import android.content.Context;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.content.Intent;

public class Bluetooth extends CordovaPlugin {
  private BluetoothAdapter mBluetoothAdapter;
  private CallbackContext  mEnableCallback = null;

  private static final int REQUEST_CONNECT_DEVICE_SECURE = 1;
  private static final int REQUEST_CONNECT_DEVICE_INSECURE = 2;
  private static final int REQUEST_ENABLE_BT = 3;

  @Override
  public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    super.initialize(cordova, webView);
    mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
  }

	@Override
	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
		if ("getDeviceInfo".equals(action)) {
			getDeviceInfo(callbackContext);
			return true;
		} else if ("getSupported".equals(action)) {
		  getSupported(callbackContext);
		  return true;
    } else if ("getEnabled".equals(action)) {
      getEnabled(callbackContext);
      return true;
    } else if ("enable".equals(action)) {
      enable(callbackContext);
      return true;
    } else if ("listPairedDevices".equals(action)) {
      listPairedDevices(callbackContext);
      return true;
    }

		return false;
	}

  private void getDeviceInfo(CallbackContext callbackContext) {
    callbackContext.success("Dummy android bluetooth info");
  }

  private void getSupported(CallbackContext callbackContext) {
    PluginResult result = new PluginResult(PluginResult.Status.OK, mBluetoothAdapter != null);
    result.setKeepCallback(true);
    callbackContext.sendPluginResult(result);
  }

  private void getEnabled(CallbackContext callbackContext) {
    if(mBluetoothAdapter == null) {
      callbackContext.error("Bluetooth is not supported");
      return;
    }

    PluginResult result = new PluginResult(PluginResult.Status.OK, mBluetoothAdapter.isEnabled());
    result.setKeepCallback(true);
    callbackContext.sendPluginResult(result);
  }

  private void listPairedDevices(CallbackContext callbackContext) {
    if(mBluetoothAdapter == null || !mBluetoothAdapter.isEnabled()) {
      callbackContext.error("Bluetooth is not enabled");
      return;
    }

    JSONArray data = new JSONArray();
    Set<BluetoothDevice> devices = mBluetoothAdapter.getBondedDevices();
    for(BluetoothDevice device : devices) {
      try {
        JSONObject item = new JSONObject();
        item.put("name", device.getName());
        item.put("address", device.getAddress());
        data.put(item);
      } catch (Exception e) {
        // Okay then
      }
    }

    PluginResult result = new PluginResult(PluginResult.Status.OK, data);
    result.setKeepCallback(true);
    callbackContext.sendPluginResult(result);
  }

  private void enable(CallbackContext callbackContext) {
    if(mBluetoothAdapter == null) {
      callbackContext.error("Bluetooth is not supported");
      return;
    }

    mEnableCallback = callbackContext;
    cordova.setActivityResultCallback(this);

    Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
    cordova.getActivity().startActivityForResult(enableBtIntent, REQUEST_ENABLE_BT);
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    if( requestCode == REQUEST_ENABLE_BT ) {
      if(mBluetoothAdapter.isEnabled()) {
        mEnableCallback.success();
      } else {
        mEnableCallback.error("rejected");
      }
    }
  }
}
