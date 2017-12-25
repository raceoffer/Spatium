package capital.spatium.plugin;

import java.util.Set;
import java.util.UUID;
import java.io.OutputStream;
import java.io.InputStream;
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

  private BluetoothServerSocket mBluetoothServerSocket = null;
  private BluetoothSocket       mBluetoothSocket = null;

  private boolean mListening = false;
  private boolean mReading = false;

  private static final int REQUEST_CONNECT_DEVICE_SECURE = 1;
  private static final int REQUEST_CONNECT_DEVICE_INSECURE = 2;
  private static final int REQUEST_ENABLE_BT = 3;

  @Override
  public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    super.initialize(cordova, webView);

    mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
  }

	@Override
	public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
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
    } else if ("stopListening".equals(action)) {
      stopListening(callbackContext);
      return true;
    } else if ("getListening".equals(action)) {
      getListening(callbackContext);
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
    } else if ("disconnect".equals(action)) {
      disconnect(callbackContext);
      return true;
    } else if ("getConnected".equals(action)) {
      getConnected(callbackContext);
      return true;
    } else if ("startReading".equals(action)) {
      startReading(callbackContext);
      return true;
    } else if ("stopReading".equals(action)) {
      stopReading(callbackContext);
      return true;
    } else if ("write".equals(action)) {
      try {
        String data = args.getString(0);
        write(data, callbackContext);
      } catch (Exception e) {
        callbackContext.error("Invalid arguments");
      }
      return true;
    }

    return false;
  }

  private void getDeviceInfo(final CallbackContext callbackContext) {
    callbackContext.success("Dummy android bluetooth info");
  }

  private void getSupported(final CallbackContext callbackContext) {
    PluginResult result = new PluginResult(PluginResult.Status.OK, mBluetoothAdapter != null);
    callbackContext.sendPluginResult(result);
  }

  private void getEnabled(final CallbackContext callbackContext) {
    if(mBluetoothAdapter == null) {
      callbackContext.error("Bluetooth is not supported");
      return;
    }

    PluginResult result = new PluginResult(PluginResult.Status.OK, mBluetoothAdapter.isEnabled());
    callbackContext.sendPluginResult(result);
  }

  private void listPairedDevices(final CallbackContext callbackContext) {
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
    callbackContext.sendPluginResult(result);
  }

  private void startListening(final CallbackContext callbackContext) {
    if(mBluetoothAdapter == null || !mBluetoothAdapter.isEnabled()) {
      callbackContext.error("Bluetooth is not enabled");
      return;
    }

    cordova.getThreadPool().execute(new Runnable() {
      public void run() {
        try {
          mBluetoothServerSocket = mBluetoothAdapter.listenUsingRfcommWithServiceRecord("Spatium wallet", UUID.fromString("995f40e0-ce68-4d24-8f68-f49d2b9d661f"));

          mListening = true;
          BluetoothSocket socket = null;
          while (socket == null && mListening) {
            try {
              socket = mBluetoothServerSocket.accept(500);
            } catch (Exception e) {
              // Just ignore it
            }
          }

          if (socket != null) {
            if(mBluetoothSocket != null) {
              try {
                mBluetoothSocket.close();
              } catch (Exception e) {
                callbackContext.error("Error closing client socket");
              }
            }
            mBluetoothSocket = socket;
            callbackContext.success("Server socket connected");
          }
        } catch (Exception e) {
          callbackContext.error("Failed to start listening");
        } finally {
          try {
            mBluetoothServerSocket.close();
          } catch (Exception e) {
            callbackContext.error("Error closing socket");
          }
          mBluetoothServerSocket = null;
          mListening = false;
        }
      }
    });
  }

  private void stopListening(final CallbackContext callbackContext) {
    if(!mListening) {
      callbackContext.error("Not listening");
      return;
    }

    mListening = false;
    callbackContext.success("Stopped listening");
  }

  private void getListening(final CallbackContext callbackContext) {
    PluginResult result = new PluginResult(PluginResult.Status.OK, mBluetoothServerSocket != null);
    callbackContext.sendPluginResult(result);
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

        if(clientSocket != null) {
          if(mBluetoothSocket != null) {
            try {
              mBluetoothSocket.close();
            } catch (Exception e) {
              callbackContext.error("Error closing client socket");
            }
          }
          mBluetoothSocket = clientSocket;
          callbackContext.success("Client connected");
        }
      }
    });
  }

  private void disconnect(final CallbackContext callbackContext) {
    if(mBluetoothAdapter == null || !mBluetoothAdapter.isEnabled()) {
      callbackContext.error("Bluetooth is not enabled");
      return;
    }

    if(mBluetoothSocket == null) {
      callbackContext.error("Not connected");
      return;
    }

    try {
      mBluetoothSocket.close();
    } catch (Exception e) {
      callbackContext.error("Error closing client socket");
    }
    mBluetoothSocket = null;
    callbackContext.success("Disconnected");
  }

  private void getConnected(CallbackContext callbackContext) {
    PluginResult result = new PluginResult(PluginResult.Status.OK, mBluetoothSocket != null && mBluetoothSocket.isConnected());
    callbackContext.sendPluginResult(result);
  }
  
  private void startReading(final CallbackContext callbackContext) {
    if(mBluetoothSocket == null) {
      callbackContext.error("Not connected");
      return;
    }

    InputStream tmp = null;
    try {
      tmp = mBluetoothSocket.getInputStream();
    } catch (Exception e) {
      callbackContext.error("Failed to get the input stream");
      return;
    }

    final InputStream stream = tmp;
    cordova.getThreadPool().execute(new Runnable() {
      public void run() {

        byte[] buffer = new byte[2048];
        int bytesRead = 0;

        mReading = true;

        while (mReading) {
          try {
            bytesRead = stream.read(buffer);
            PluginResult result = new PluginResult(PluginResult.Status.OK, new String(buffer, 0, bytesRead, "UTF-8"));
            result.setKeepCallback(true);
            callbackContext.sendPluginResult(result);
          } catch (Exception e) {
            // Just ignore it for now
          }
        }
      }
    });

    mReading = false;
  }

  private void stopReading(final CallbackContext callbackContext) {
    if(!mReading) {
      callbackContext.error("Not reading");
      return;
    }

    mReading = false;
    callbackContext.success("Stopped reading");
  }

  private void write(String data, final CallbackContext callbackContext) {
    if(mBluetoothSocket == null) {
      callbackContext.error("Not connected");
      return;
    }

    OutputStream stream = null;
    try {
      stream = mBluetoothSocket.getOutputStream();
    } catch (Exception e) {
      callbackContext.error("Failed to get the output stream");
      return;
    }

    try {
      stream.write(data.getBytes("UTF-8"));
    } catch (Exception e) {
      callbackContext.error("Disconnected");
      return;
    }

    callbackContext.success("Written");
  }

  private void enable(final CallbackContext callbackContext) {
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
