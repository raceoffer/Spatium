declare const window: any;
declare const device: any;

export async function checkAvailable() {
  return new Promise<boolean>((resolve, ignored) => {
    window.plugins.touchid.isAvailable(() => resolve(true), () => resolve(false));
  });
}

export async function checkExisting() {
  return new Promise<boolean>((resolve, ignored) => {
    window.plugins.touchid.has('spatium', () => resolve(true), () => resolve(false));
  });
}

export async function getTouchPassword() {
  return new Promise<string>((resolve) => {
    // !!! On iOS the message is required by the OS
    let message = 'Unlock Spatium secret';
    message = device.platform === 'iOS' ? message : '';
       
    window.plugins.touchid.verify('spatium', message, pincode => resolve(pincode));
  });
}

export async function saveTouchPassword(pincode) {
  return new Promise((success, error) => {
    window.plugins.touchid.save('spatium', pincode, true, success, error);
  });
}

export async function deleteTouch() {
  return new Promise((resolve, reject) => {
    window.plugins.touchid.delete('spatium', resolve, reject);
  });
}
