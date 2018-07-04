import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs/index";
import { distinctUntilChanged, filter, mapTo, skip } from "rxjs/internal/operators";

declare const cordova: any;
declare const device: any;
declare const window: any;
declare const Buffer: any;

@Injectable()
export class FileService {
  public hasLogFile: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public hasLogFileChanged: Observable<boolean> = this.hasLogFile.pipe(skip(1), distinctUntilChanged());
  public createLogFileEvent: Observable<any> = this.hasLogFileChanged.pipe(filter(hasLogFile => hasLogFile), mapTo(null));

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
            this.hasLogFile.next(true);
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

  async readFile(filename): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        fs.root.getFile(filename, {create: false}, fileEntry => {
          fileEntry.file(file => {
            const reader = new FileReader();
            reader.onloadend = (e: any) => {
              const data: string = e.target.result;
              resolve(data);
            };
            reader.readAsText(file);
          });
        }, () => resolve(null));
      });
    });
  }

  async getFile(filename): Promise<object> {
    return await new Promise<object>((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        fs.root.getFile(filename, {create: false}, fileEntry => {
          fileEntry.file(resolve, reject);
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

  async deleteOldLogFiles() {
    const time: number = 24 * 60 * 60 * 1000; // 24h
    const date: number = new Date().getTime();

    window.resolveLocalFileSystemURL(await this.getLogPath(),
      function (fileSystem) {
        const reader = fileSystem.createReader();
        reader.readEntries(
          function (entries) {
            entries
              .filter(entry => entry.isFile)
              .filter(entry => entry.name.includes('log_'))
              .forEach(entry => {
                entry.file(f => {
                  let diff = date - f.lastModifiedDate;
                  if (diff > time) {
                    entry.remove();
                  }
                });
              });
          },
          function (e) { }
        );
      }, function (e) {}
    );
  }

  async listFiles(): Promise<Array<string>> {
    return await new Promise<Array<string>>((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        const reader = fs.root.createReader();
        reader.readEntries(entries => {
          const fileNames = entries
            .filter(entry => !entry.isDirectory)
            .map(entry => entry.name);
          resolve(fileNames);
        }, reject);
      }, reject);
    });
  }

  async getLogPath(): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        const path = fs.root.nativeURL;
        resolve(path);
      }, reject);
    });
  }

  getExternalPath(): string {
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
