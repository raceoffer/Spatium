import { Injectable } from '@angular/core';

declare const cordova: any;
declare const device: any;
declare const window: any;
declare const Buffer: any;

@Injectable()
export class FileService {
  safeFileName(text: string): string {
    return Buffer.from(text, 'utf-8').toString('base64') + '.store';
  }

  logFileName(text: string): string {
    return 'log_' + text + '.txt';
  }

  async writeFile(filename, content) {
    return await new Promise((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        fs.root.getFile(filename, {create: true}, fileEntry => {
          fileEntry.createWriter(fileWriter => {
            const tdata = new Blob(Array.isArray(content) ? content : [content], {type: 'text/plain'});
            fileWriter.onwriteend = resolve;
            fileWriter.onerror = reject;
            fileWriter.write(tdata);
          }, reject);
        }, reject);
      }, reject);
    });
  }

  async createFile(filename) {
    return await new Promise((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        fs.root.getFile(filename, {create: true}, fileEntry => resolve(fileEntry.fullPath), reject);
      }, reject);
    });
  }

  async writeToFile(filename, content) {
    return await new Promise((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        fs.root.getFile(filename, {create: false}, fileEntry => {
          fileEntry.createWriter(fileWriter => {
            const tdata = new Blob(Array.isArray(content) ? content : [content], {type: 'text/plain'});
            fileWriter.onwriteend = resolve;
            fileWriter.onerror = reject;
            fileWriter.seek(fileWriter.length);
            fileWriter.write(tdata);
          }, reject);
        }, reject);
      }, reject);
    });
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
    const time = 24 * 60 * 60 * 1000; // 24h
    const date = new Date().getTime();

    return await new Promise((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        const reader = fs.root.createReader();
        reader.readEntries(entries => entries
          .filter(entry => entry.isFile)
          .filter(entry => entry.name.includes('log_'))
          .forEach(entry => {
            entry.file(f => {
              if (date - f.lastModifiedDate > time) {
                entry.remove();
              }
            });
          }), reject);
      }, reject);
    });
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
