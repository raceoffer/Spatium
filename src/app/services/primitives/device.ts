import { ProviderType } from '../interfaces/connection-provider';

export class Device {
  constructor(public provider: ProviderType,
              public name: string,
              public macAddress: string = null,
              public ip: string = null,
              public port: number = null,
              public paired: boolean = false) { }

  public static equals(x: Device, y: Device): boolean {
    return x.provider === y.provider &&
           x.name === y.name &&
           x.macAddress === y.macAddress &&
           x.ip === y.ip &&
           x.port === y.port &&
           x.paired === y.paired;
  }

  public static merge(x: Device, y: Device): Device {
    return new Device(
      y.provider || x.provider,
      y.name || x.name,
      y.macAddress || x.macAddress,
      y.ip || x.ip,
      y.port || x.port,
      y.paired
    );
  }

  public equals(y: Device): boolean {
    return Device.equals(this, y);
  }

  public merge(y: Device): Device {
    return Device.merge(this, y);
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
