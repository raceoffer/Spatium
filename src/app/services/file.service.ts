import { Injectable } from '@angular/core';

declare const window: any;
declare const Buffer: any;

@Injectable()
export class FileService {
  constructor() { }

  safeFileName(text: string): string {
    return Buffer.from(text, 'utf-8').toString('base64') + '.store';
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

  async deleteFile(filename) {
    return await new Promise<string>((resolve, reject) => {
      window.requestFileSystem(window.LocalFileSystem.PERSISTENT, 0, fs => {
        fs.root.getFile(filename, {create: false}, fileEntry => {
          fileEntry.remove(resolve, reject);
        }, reject);
      });
    });
  }
}
