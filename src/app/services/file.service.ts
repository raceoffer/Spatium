import { Injectable } from '@angular/core';

declare const cordova: any;
declare const device: any;
declare const window: any;
declare const Buffer: any;

@Injectable()
export class FileService {

  hasLogFile = false;

  constructor() { }

  safeFileName(text: string): string {
    return Buffer.from(text, 'utf-8').toString('base64') + '.store';
  }

  logFileName(text: string): string {
    return 'log_' + text + '.txt';
  }

  async writeFile(filename, content) {
    await new Promise((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        fs.root.getFile(filename, {create: true}, fileEntry => {
          fileEntry.createWriter(fileWriter => {
            const tdata = new Blob([content], {type: 'text/plain'});
            fileWriter.write(tdata);
            resolve();
          });
        });
      });
    });
  }

  async writeFileLog(path, filename, content) {
    await new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(path, dirEntry => {
        dirEntry.getFile(filename, {create: true}, fileEntry => {
          fileEntry.createWriter(fileWriter => {
            const tdata = new Blob([content], {type: 'text/plain'});
            fileWriter.write(tdata);
            resolve();
            this.hasLogFile = true;
          }, (e) => { });
        }, (e) => { });
      }, (e) => { });
    })
  }

  async writeToFileLog(path, filename, content) {
    await new Promise((resolve, reject) => {
      window.resolveLocalFileSystemURL(path, dirEntry => {
        dirEntry.getFile(filename, {create: false}, fileEntry => {
          fileEntry.createWriter(fileWriter => {
            const tdata = new Blob([content], {type: 'text/plain'});
            fileWriter.seek(fileWriter.length);
            fileWriter.write(tdata);
            resolve();
          }, (e) => { });
        }, (e) => { });
      }, (e) => { });
    })
  }

  async readFile(filename) {
    return await new Promise<string>((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        fs.root.getFile(filename, {create: false}, fileEntry => {
          fileEntry.file(file => {
            const reader = new FileReader();
            reader.onloadend = (e: any) => {
              const initiatorDDSKey = e.target.result;
              resolve(initiatorDDSKey);
            };
            reader.readAsText(file);
          });
        }, reject);
      });
    });
  }

  async getFile(filename) {
    return await new Promise<string>((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        fs.root.getFile(filename, {create: false}, fileEntry => {
          fileEntry.file();
        }, reject);
      });
    });
  }

  async deleteFile(filename) {
    return await new Promise<string>((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        fs.root.getFile(filename, {create: false}, fileEntry => {
          fileEntry.remove(resolve, reject);
        }, reject);
      });
    });
  }

  async deleteOldLogFiles () {
    const time: number = 24 * 60 *60 * 1000; // 24h
    const date: number = new Date().getTime();

    window.resolveLocalFileSystemURL(this.getExternalPath(),
      function (fileSystem) {
        var reader = fileSystem.createReader();
        reader.readEntries(
          function (entries) {
            var i;
            for (i=0; i<entries.length; i++) {
              let entry = entries[i];
              if (entry.isFile) {
                entry.file((f) => {
                  let diff = date - f.lastModifiedDate;
                  if (diff > time) {
                    entry.remove();
                  }
                });
              }
            }
          },
          function (e) { }
        );
      }, function (e) {}
    );
  }

  getExternalPath() {
    let path: string;
    switch (device.platform.toLowerCase()) {
      case 'android':
        path = cordova.file.externalApplicationStorageDirectory;
        break;
      case 'ios':
        path = cordova.file.documentsDirectory;
        break;
      case 'windows':
        path = cordova.file.dataDirectory;
        break;
      default:
        throw new Error(`Unknown platform "${device.platform}"`);
    }

    return path;
  }
}
