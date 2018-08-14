declare const nfc: any;
declare const ndef: any;

export enum Type {
  NFC,
  NDEF,
  MIME
}

function plugin() {
  return typeof nfc !== 'undefined' ? nfc : null;
}

export async function addNdefListener(callback) {
  return await new Promise((resolve, reject) => plugin() ? plugin().addNdefListener(
    callback,
    resolve,
    reject
  ) : reject('Nfc not supported'));
}

export async function addTagDiscoveredListener(callback) {
  return await new Promise((resolve, reject) => plugin() ? plugin().addTagDiscoveredListener(
    callback,
    resolve,
    reject
  ) : reject('Nfc not supported'));
}

export async function addMimeTypeListener(callback) {
  return await new Promise((resolve, reject) => plugin() ? plugin().addMimeTypeListener(
    'text/pg',
    callback,
    resolve,
    reject
  ) : reject('Nfc not supported'));
}

export async function removeNdefListener(callback) {
  return await new Promise((resolve, reject) => plugin() ? plugin().removeNdefListener(
    callback,
    resolve,
    reject
  ) : reject('Nfc not supported'));
}

export async function removeTagDiscoveredListener(callback) {
  return await new Promise((resolve, reject) => plugin() ? plugin().removeTagDiscoveredListener(
    callback,
    resolve,
    reject
  ) : reject('Nfc not supported'));
}

export async function removeMimeTypeListener(callback) {
  return await new Promise((resolve, reject) => plugin() ? plugin().removeMimeTypeListener(
    'text/pg',
    callback,
    resolve,
    reject
  ) : reject('Nfc not supported'));
}

export async function checkState() {
  return await new Promise<boolean>((resolve, reject) => plugin() ? plugin().enabled(
    () => resolve(true),
    () => resolve(false)
  ) : resolve(false));
}

export async function checkNfc() {
  return await new Promise<boolean>((resolve, reject) => plugin() ? plugin().enabled(
    () => resolve(true),
    e => {
      if (e === 'NO_NFC' || e === 'NO_NFC_OR_NFC_DISABLED') {
        resolve(false);
      } else {
        resolve(true);
      }
    }) : resolve(false));
}

export async function write(payload) {
  const mimeType = 'text/pg';

  const record = ndef.mimeMediaRecord(mimeType, payload);

  return await new Promise((resolve, reject) => plugin().write(
    [record],
    resolve,
    reject
  ));
}

export function changeNFCState() {
  plugin().showSettings();
}
