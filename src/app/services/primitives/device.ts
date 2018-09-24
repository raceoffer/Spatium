export enum Provider {
  Bluetooth,
  Wifi
}

export interface WifiConnectionData {
  host: string;
  port: number;
}

export interface BluetoothConnectionData {
  address: string;
  paired: boolean;
}

export function isWifiConnectionData(
  connectionData: WifiConnectionData| BluetoothConnectionData
): connectionData is WifiConnectionData {
  return (connectionData as WifiConnectionData).host !== undefined;
}

export function isBluetoothConnectionData(
  connectionData: WifiConnectionData| BluetoothConnectionData
): connectionData is BluetoothConnectionData {
  return (connectionData as BluetoothConnectionData).address !== undefined;
}

export class Device {
  constructor(
    public provider: Provider,
    public name: string,
    public id: string,
    public data: WifiConnectionData | BluetoothConnectionData
  ) {}

  public static equals(x: Device, y: Device): boolean {
    if (x.provider !== y.provider || x.name !== y.name || x.id !== y.id) {
      return false;
    }
    let xData;
    let yData;
    switch (x.provider) {
      case Provider.Bluetooth:
        xData = x.data as BluetoothConnectionData;
        yData = y.data as BluetoothConnectionData;
        return xData.host === yData.host && xData.port === yData.port;
      case Provider.Wifi:
        xData = x.data as WifiConnectionData;
        yData = y.data as WifiConnectionData;
        return xData.address === yData.address && xData.paired === yData.paired;
    }
  }

  public equals(y: Device): boolean {
    return Device.equals(this, y);
  }
}

export function equals(x: Map<string, Device>, y: Map<string, Device>): boolean {
  if (x.size !== y.size) {
    return false;
  }

  for (const name of Array.from(x.keys())) {
    if (!Device.equals(x.get(name), y.get(name))) {
      return false;
    }
  }

  return true;
}
