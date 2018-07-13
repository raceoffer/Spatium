declare const NativeStorage: any;

export async function getValue(name: string) {
  return new Promise<any>((resolve, reject) => {
    NativeStorage.getItem(name, resolve, reject);
  });
}

export async function setValue(name: string, value: any) {
  return new Promise<boolean>((resolve, reject) => {
    NativeStorage.setItem(name, value, resolve, reject);
  });
}

