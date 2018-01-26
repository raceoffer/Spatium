package capital.spatium.plugin;

import java.util.Set;
import java.util.UUID;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

import android.Manifest;
import android.content.Context;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothServerSocket;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;

import static android.app.Activity.RESULT_CANCELED;
import static android.bluetooth.BluetoothAdapter.ACTION_DISCOVERY_FINISHED;
import static android.bluetooth.BluetoothAdapter.ACTION_DISCOVERY_STARTED;
import static android.bluetooth.BluetoothAdapter.ACTION_STATE_CHANGED;
import static android.bluetooth.BluetoothAdapter.EXTRA_STATE;

public class Bluetooth extends CordovaPlugin {
  private BluetoothAdapter mBluetoothAdapter;
  private CallbackContext  mEnableCallback = null;
  private CallbackContext  mSettingsCallback = null;
  private CallbackContext  mDataCallback = null;
  private CallbackContext  mConnectedCallback = null;
  private CallbackContext  mDisconnectedCallback = null;
  private CallbackContext  mDiscoveredCallback = null;

  private CallbackContext  mStateCallback = null;

  private CallbackContext  mPermissionCallback = null;
  private CallbackContext  mFinishedCallback = null;
  private CallbackContext  mDiscoveryCallback = null;

  private BluetoothServerSocket mBluetoothServerSocket = null;
  private BluetoothSocket       mBluetoothSocket = null;

  private BufferedReader mBufferedReader = null;
  private PrintWriter mPrintWriter = null;

  private boolean mListening = false;
  private boolean mReading = false;

  private static final int REQUEST_BT_SETTINGS = 2;
  private static final int REQUEST_ENABLE_BT = 3;
  private static final int REQUEST_PERMISSION_BT = 4;
  private static final int REQUEST_DISCOVERY_BT = 5;

  private BroadcastReceiver mDiscoveryReceiver = null;
  private BroadcastReceiver mStateReceiver = null;

  @Override
  public void initialize(CordovaInterface cordova, CordovaWebView webView) {
    super.initialize(cordova, webView);

    mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
  }

  @Override
  public boolean execute(String action, JSONArray args, final CallbackContext callbackContext) throws JSONException {
    if ("getSupported".equals(action)) {
      getSupported(callbackContext);
      return true;
    } else if ("getEnabled".equals(action)) {
      getEnabled(callbackContext);
      return true;
    } else if ("getState".equals(action)) {
      getState(callbackContext);
      return true;
    } else if ("enable".equals(action)) {
      enable(callbackContext);
      return true;
    } else if ("listPairedDevices".equals(action)) {
      listPairedDevices(callbackContext);
      return true;
    } else if ("discoverDevices".equals(action)) {
      discoverDevices(callbackContext);
      return true;
    } else if ("cancelDiscovery".equals(action)) {
      cancelDiscovery(callbackContext);
      return true;
    } else if ("enableDiscovery".equals(action)) {
      enableDiscovery(callbackContext);
      return true;
    } else if ("startListening".equals(action)) {
      startListening(callbackContext);
      return true;
    } else if ("stopListening".equals(action)) {
      stopListening(callbackContext);
      return true;
    } else if ("setOnConnected".equals(action)) {
      setOnConnected(callbackContext);
      return true;
    } else if ("setOnDisconnected".equals(action)) {
      setOnDisconnected(callbackContext);
      return true;
    } else if ("setOnState".equals(action)) {
      setOnState(callbackContext);
      return true;
    } else if ("setOnDiscoveryFinished".equals(action)) {
      setOnDiscoveryFinished(callbackContext);
      return true;
    } else if ("getListening".equals(action)) {
      getListening(callbackContext);
      return true;
    } else if ("openSettings".equals(action)) {
      openSettings(callbackContext);
      return true;
    } else if ("connect".equals(action)) {
      String device;
      String address;
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
    } else if ("setOnData".equals(action)) {
      setOnData(callbackContext);
      return true;
    } else if ("setOnDiscovered".equals(action)) {
      setOnDiscovered(callbackContext);
      return true;
    } else if ("startReading".equals(action)) {
      startReading(callbackContext);
      return true;
    } else if ("stopReading".equals(action)) {
      stopReading(callbackContext);
      return true;
    } else if ("getReading".equals(action)) {
      getReading(callbackContext);
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

  private void getState(final CallbackContext callbackContext) {
    if(mBluetoothAdapter == null) {
      callbackContext.error("Bluetooth is not supported");
      return;
    }

    PluginResult result = new PluginResult(PluginResult.Status.OK, mBluetoothAdapter.getState());
    callbackContext.sendPluginResult(result);
  }

  private void setOnState(CallbackContext callbackContext) {
    mStateCallback = callbackContext;
    if(mStateReceiver == null) {
      mStateReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
          String action = intent.getAction();
          if (ACTION_STATE_CHANGED.equals(action)) {
            int state = intent.getIntExtra(EXTRA_STATE, -1);
            if(mStateCallback != null) {
              PluginResult result = new PluginResult(PluginResult.Status.OK, state);
              result.setKeepCallback(true);
              mStateCallback.sendPluginResult(result);
            }
          }
        }
      };
      webView.getContext().registerReceiver(mStateReceiver, new IntentFilter(ACTION_STATE_CHANGED));
    }
  }

  private void setOnDiscoveryFinished(final CallbackContext callbackContext) {
    mFinishedCallback = callbackContext;
  }

  private void cancelDiscovery(final CallbackContext callbackContext) {
    try {
      mBluetoothAdapter.cancelDiscovery();
      callbackContext.success();
    } catch (Exception ignored) {
      callbackContext.error("Failed to cancel discovery");
    }
  }

  private void enableDiscovery(final CallbackContext callbackContext) {
    try {
      mDiscoveryCallback = callbackContext;

      cordova.setActivityResultCallback(this);
      cordova.getActivity().startActivityForResult(new Intent(BluetoothAdapter.ACTION_REQUEST_DISCOVERABLE), REQUEST_DISCOVERY_BT);
    } catch (Exception ignored) {
      callbackContext.error("Failed to start activity");
    }
  }

  private void setOnDiscovered(final CallbackContext callbackContext) {
    mDiscoveredCallback = callbackContext;
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

  private void discoverDevices(final CallbackContext callbackContext) {
    if(mBluetoothAdapter == null || !mBluetoothAdapter.isEnabled()) {
      callbackContext.error("Bluetooth is not enabled");
      return;
    }

    try {
      if(mDiscoveryReceiver == null) {
        mDiscoveryReceiver = new BroadcastReceiver() {
          @Override
          public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (BluetoothDevice.ACTION_FOUND.equals(action)) {
              BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
              if (mDiscoveredCallback != null) {
                try {
                  JSONObject item = new JSONObject();
                  item.put("name", device.getName());
                  item.put("address", device.getAddress());

                  PluginResult result = new PluginResult(PluginResult.Status.OK, item);
                  result.setKeepCallback(true);
                  mDiscoveredCallback.sendPluginResult(result);
                } catch (Exception e) {
                  // Okay then
                }
              }
            } else if (ACTION_DISCOVERY_STARTED.equals(action)) {
              // Ignore for now
            } else if (ACTION_DISCOVERY_FINISHED.equals(action)) {
              if(mFinishedCallback != null) {
                mFinishedCallback.success();
              }
            }
          }
        };
        IntentFilter filter = new IntentFilter();
        filter.addAction(BluetoothDevice.ACTION_FOUND);
        filter.addAction(ACTION_DISCOVERY_STARTED);
        filter.addAction(ACTION_DISCOVERY_FINISHED);
        webView.getContext().registerReceiver(mDiscoveryReceiver, filter);
      }

      if(!cordova.hasPermission(Manifest.permission.ACCESS_COARSE_LOCATION)) {
        mPermissionCallback = callbackContext;
        cordova.requestPermission(this, REQUEST_PERMISSION_BT, Manifest.permission.ACCESS_COARSE_LOCATION);
      } else {
        mBluetoothAdapter.startDiscovery();
        callbackContext.success();
      }
    } catch (Exception e) {
      callbackContext.error("Failed to start discovery");
    }
  }

  @Override
  public void onDestroy() {
    if (this.mDiscoveryReceiver != null) {
      try {
        webView.getContext().unregisterReceiver(this.mDiscoveryReceiver);
        this.mDiscoveryReceiver = null;
      } catch (Exception e) {
        // well okay
      }
    }
  }

  private void startListening(final CallbackContext callbackContext) {
    if(mBluetoothAdapter == null || !mBluetoothAdapter.isEnabled()) {
      callbackContext.error("Bluetooth is not enabled");
      return;
    }

    if(mBluetoothSocket != null) {
      callbackContext.error("Cannot listen while already connected");
      return;
    }

    cordova.getThreadPool().execute(new Runnable() {
      public void run() {
        try {
          mBluetoothServerSocket = mBluetoothAdapter.listenUsingRfcommWithServiceRecord("Spatium wallet", UUID.fromString("995f40e0-ce68-4d24-8f68-f49d2b9d661f"));

          mListening = true;
          while (mBluetoothSocket == null && mListening) {
            try {
              BluetoothSocket socket = mBluetoothServerSocket.accept(500);
              if(mBluetoothSocket == null) {
                mBufferedReader = new BufferedReader(new InputStreamReader(socket.getInputStream(), "UTF-8"));
                mPrintWriter = new PrintWriter(new OutputStreamWriter(socket.getOutputStream(), "UTF-8"), true);
                mBluetoothSocket = socket;
              } else {
                socket.close();
              }
            } catch (Exception e) {
              // Just ignore it
            }
          }

          if(mBluetoothSocket != null && mConnectedCallback != null)
            mConnectedCallback.success("Server socket connected");
        } catch (Exception e) {
          callbackContext.error("Listening failed");
        } finally {
          try {
            mBluetoothServerSocket.close();
          } catch (Exception ignored) {}
          mBluetoothServerSocket = null;
          mListening = false;
        }
      }
    });

    callbackContext.success();
  }

  private void stopListening(final CallbackContext callbackContext) {
    if(!mListening) {
      callbackContext.error("Not listening");
      return;
    }

    mListening = false;
    callbackContext.success();
  }

  private void getListening(final CallbackContext callbackContext) {
    PluginResult result = new PluginResult(PluginResult.Status.OK, mListening);
    callbackContext.sendPluginResult(result);
  }

  private void connect(String device, String address, final CallbackContext callbackContext) {
    if(mBluetoothAdapter == null || !mBluetoothAdapter.isEnabled()) {
      callbackContext.error("Bluetooth is not enabled");
      return;
    }

    if(mBluetoothSocket != null) {
      callbackContext.error("Already connected");
      return;
    }

    final BluetoothDevice targetDevice = mBluetoothAdapter.getRemoteDevice(address);

    if(targetDevice == null) {
      callbackContext.error("Failed to find the device");
      return;
    }

    cordova.getThreadPool().execute(new Runnable() {
      public void run() {
        try {
          BluetoothSocket clientSocket = targetDevice.createRfcommSocketToServiceRecord(UUID.fromString("995f40e0-ce68-4d24-8f68-f49d2b9d661f"));
          clientSocket.connect();

          if(mBluetoothSocket == null) {
            mBufferedReader = new BufferedReader(new InputStreamReader(clientSocket.getInputStream(), "UTF-8"));
            mPrintWriter = new PrintWriter(new OutputStreamWriter(clientSocket.getOutputStream(), "UTF-8"), true);
            mBluetoothSocket = clientSocket;
            callbackContext.success();
          } else {
            callbackContext.error("Failed to conect: interrupted");
            clientSocket.close();
          }
        } catch (Exception e) {
          callbackContext.error("Failed to conect to remote socket");
        }
      }
    });
  }

  private void setOnConnected(CallbackContext callbackContext) {
    mConnectedCallback = callbackContext;
  }

  private void setOnDisconnected(CallbackContext callbackContext) {
    mDisconnectedCallback = callbackContext;
  }

  private void disconnect(final CallbackContext callbackContext) {
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
    callbackContext.success();
  }

  private void getConnected(CallbackContext callbackContext) {
    PluginResult result = new PluginResult(PluginResult.Status.OK, mBluetoothSocket != null);
    callbackContext.sendPluginResult(result);
  }

  private void setOnData(CallbackContext callbackContext) {
    mDataCallback = callbackContext;
  }

  private void startReading(final CallbackContext callbackContext) {
    if(mBluetoothSocket == null) {
      callbackContext.error("Not connected");
      return;
    }

    cordova.getThreadPool().execute(new Runnable() {
      public void run() {
        try {
          mReading = true;

          while (mReading) {
            String string = mBufferedReader.readLine();

            if (mDataCallback != null) {
              PluginResult result = new PluginResult(PluginResult.Status.OK, string);
              result.setKeepCallback(true);
              mDataCallback.sendPluginResult(result);
            }
          }
        } catch (Exception e) {
          try {
            mBluetoothSocket.close();
          } catch (Exception ignored) {}
          mBluetoothSocket = null;
          if(mDisconnectedCallback != null)
            mDisconnectedCallback.success();
        } finally {
          mReading = false;
        }
      }
    });

    callbackContext.success();
  }

  private void getReading(final CallbackContext callbackContext) {
    PluginResult result = new PluginResult(PluginResult.Status.OK, mReading);
    callbackContext.sendPluginResult(result);
  }

  private void stopReading(final CallbackContext callbackContext) {
    if(!mReading) {
      callbackContext.error("Not reading");
      return;
    }

    mReading = false;
    callbackContext.success();
  }

  private void write(String data, final CallbackContext callbackContext) {
    if(mBluetoothSocket == null) {
      callbackContext.error("Not connected");
      return;
    }

    try {
	  mPrintWriter.println(data);
    } catch (Exception e) {
      callbackContext.error("Disconnected");
      return;
    }

    callbackContext.success();
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

  private void openSettings(final CallbackContext callbackContext) {
    if(mBluetoothAdapter == null) {
      callbackContext.error("Bluetooth is not supported");
      return;
    }

    mSettingsCallback = callbackContext;
    cordova.setActivityResultCallback(this);

    Intent intentOpenBluetoothSettings = new Intent(android.provider.Settings.ACTION_BLUETOOTH_SETTINGS);
    cordova.getActivity().startActivityForResult(intentOpenBluetoothSettings, REQUEST_BT_SETTINGS);
  }

  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    if (requestCode == REQUEST_ENABLE_BT) {
      if (mBluetoothAdapter.isEnabled()) {
        mEnableCallback.success();
      } else {
        mEnableCallback.error("rejected");
      }
    } else if (requestCode == REQUEST_BT_SETTINGS) {
      mSettingsCallback.success();
    } else if (requestCode == REQUEST_DISCOVERY_BT) {
      if(resultCode == RESULT_CANCELED) {
        mDiscoveryCallback.error("rejected");
      } else {
        mDiscoveryCallback.success();
      }
    }
  }

  @Override
  public void onRequestPermissionResult(int requestCode, String[] permissions, int[] grantResults) throws JSONException {
    for(int r:grantResults) {
      if(r == PackageManager.PERMISSION_DENIED) {
        mPermissionCallback.error("permission denied");
        return;
      }
    }
    if(requestCode == REQUEST_PERMISSION_BT) {
      mBluetoothAdapter.startDiscovery();
      mPermissionCallback.success();
    }
  }
}
