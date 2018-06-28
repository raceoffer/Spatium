declare const nfc: any;
declare const ndef: any;

export enum Type {
  NFC,
  NDEF,
  MIME
}

export async function addNdefListener(callback) {
  return await new Promise((resolve, reject) => nfc.addNdefListener(
    callback,
    resolve,
    reject
  ));
}

export async function addTagDiscoveredListener(callback) {
  return await new Promise((resolve, reject) => nfc.addTagDiscoveredListener(
    callback,
    resolve,
    reject
  ));
}

export async function addMimeTypeListener(callback) {
  return await new Promise((resolve, reject) => nfc.addMimeTypeListener(
    'text/pg',
    callback,
    resolve,
    reject
  ));
}

export async function removeNdefListener(callback) {
  return await new Promise((resolve, reject) => nfc.removeNdefListener(
    callback,
    resolve,
    reject
  ));
}

export async function removeTagDiscoveredListener(callback) {
  return await new Promise((resolve, reject) => nfc.removeTagDiscoveredListener(
    callback,
    resolve,
    reject
  ));
}

export async function removeMimeTypeListener(callback) {
  return await new Promise((resolve, reject) => nfc.removeMimeTypeListener(
    'text/pg',
    callback,
    resolve,
    reject
  ));
}

export async function checkState() {
  return await new Promise<boolean>((resolve, reject) => nfc.enabled(
    () => resolve(true),
    () => resolve(false)
  ));
}

export async function checkNfc() {
  return await new Promise<boolean>((resolve, reject) => nfc.enabled(
    () => resolve(true),
    e => {
      if (e === 'NO_NFC' || e === 'NO_NFC_OR_NFC_DISABLED') {
        resolve(false);
      } else {
        resolve(true);
      }
    }));
}

export async function write(payload) {
  const mimeType = 'text/pg';

  const record = ndef.mimeMediaRecord(mimeType, payload);

  return await new Promise((resolve, reject) => nfc.write(
    [record],
    resolve,
    reject
  ));
}

export function changeNFCState() {
  nfc.showSettings();
}
