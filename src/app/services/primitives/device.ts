export enum Provider {
  Bluetooth,
  Wifi
}

export class Device {
  constructor(
    public provider: Provider,
    public name: string,
    public id: string,
    public data: {
      host: string,
      port: number
    } | {
      address: string,
      paired: boolean
    }
  ) {}

  public static equals(x: Device, y: Device): boolean {
    if (x.provider !== y.provider || x.name !== y.name || x.id !== y.id) {
      return false;
    }
    let xData;
    let yData;
    switch (x.provider) {
      case Provider.Bluetooth:
        xData = x.data as { host: string, port: number };
        yData = y.data as { host: string, port: number };
        return xData.host === yData.host && xData.port === yData.port;
      case Provider.Wifi:
        xData = x.data as { address: string, paired: boolean };
        yData = y.data as { address: string, paired: boolean };
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
