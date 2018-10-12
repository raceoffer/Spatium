declare const cordova: any;

export enum Permission {
  Camera,
  Storage,
  CoarseLocation
}

function mapPermission(permission: Permission) {
  switch (permission) {
    case Permission.Camera:
      return cordova.plugins.permissions.CAMERA;
    case Permission.Storage:
      return cordova.plugins.permissions.WRITE_EXTERNAL_STORAGE;
    case Permission.CoarseLocation:
      return cordova.plugins.permissions.ACCESS_COARSE_LOCATION;
  }
}

export async function checkPermission(permission: Permission) {
  return await new Promise<boolean>((resolve, reject) => {
    cordova.plugins.permissions.checkPermission(
      mapPermission(permission),
      status => resolve(status.hasPermission),
      reject);
  });
}

export async function requestPermission(permission: Permission) {
  return await new Promise<boolean>((resolve, reject) => {
    cordova.plugins.permissions.requestPermission(
      mapPermission(permission),
      status => resolve(status.hasPermission),
      reject);
  });
}
