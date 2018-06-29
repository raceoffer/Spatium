declare const window: any;

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
    window.plugins.touchid.verify('spatium', '', pincode => resolve(pincode));
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
