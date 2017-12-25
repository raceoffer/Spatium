package capital.spatium.plugin;

import java.util.Set;
import java.util.UUID;
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
import android.bluetooth.BluetoothServerSocket;
import android.bluetooth.BluetoothSocket;
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
    } else if ("startListening".equals(action)) {
		  startListening(callbackContext);
      return true;
    } else if ("connect".equals(action)) {
      String device  = null;
      String address = null;
      try {
        device = args.getJSONObject(0).getString("name");
        address = args.getJSONObject(0).getString("address");
        connect(device,address,callbackContext);
      } catch (Exception e) {
        callbackContext.error("Invalid arguments");
      }
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

  private void startListening(final CallbackContext callbackContext) {
    if(mBluetoothAdapter == null || !mBluetoothAdapter.isEnabled()) {
      callbackContext.error("Bluetooth is not enabled");
      return;
    }

    cordova.getThreadPool().execute(new Runnable() {
      public void run() {
        BluetoothServerSocket serverSocket = null;
        try {
          serverSocket = mBluetoothAdapter.listenUsingRfcommWithServiceRecord("Spatium wallet", UUID.fromString("995f40e0-ce68-4d24-8f68-f49d2b9d661f"));
        } catch (Exception e) {
          callbackContext.error("Failed to start listening");
          return;
        }
        BluetoothSocket socket = null;
        while (true) {
          try {
            socket = serverSocket.accept();
          } catch (Exception e) {
            callbackContext.error("Socket's accept method failed");
            break;
          }

          if (socket != null) {
            callbackContext.success("Server connected");

            try {
              serverSocket.close();
            } catch (Exception e) {
              callbackContext.error("Failed to stop listening");
            }
            break;
          }
        }
      }
    });
  }

  private void connect(String device, String address, final CallbackContext callbackContext) {
    if(mBluetoothAdapter == null || !mBluetoothAdapter.isEnabled()) {
      callbackContext.error("Bluetooth is not enabled");
      return;
    }

    BluetoothDevice tmp = null;
    Set<BluetoothDevice> devices = mBluetoothAdapter.getBondedDevices();
    for(BluetoothDevice bondedDevice : devices) {
      if(bondedDevice.getName().equals(device) && bondedDevice.getAddress().equals(address)) {
        tmp = bondedDevice;
      }
    }

    if(tmp == null) {
      callbackContext.error("The device is unpaired");
      return;
    }

    final BluetoothDevice foundDevice = tmp;

    cordova.getThreadPool().execute(new Runnable() {
      public void run() {
        BluetoothSocket clientSocket = null;
        try {
          clientSocket = foundDevice.createRfcommSocketToServiceRecord(UUID.fromString("995f40e0-ce68-4d24-8f68-f49d2b9d661f"));
        } catch (Exception e) {
          callbackContext.error("Failed to conect to bs");
        }

        try {
          clientSocket.connect();
        } catch (Exception e) {
          callbackContext.error("Socket's connect method failed");
          return;
        }

        callbackContext.success("Client connected");
      }
    });
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
