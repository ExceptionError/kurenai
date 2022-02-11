import { contextBridge, ipcRenderer } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import * as FileType from 'file-type';

declare const __static: string;

const isDevelopment = process.env.NODE_ENV !== 'production';

contextBridge.exposeInMainWorld('api', {
  show: () => {
    ipcRenderer.invoke('show');
  },
  file: () => {
    return ipcRenderer.invoke('file');
  },
  folder: () => {
    return ipcRenderer.invoke('folder');
  },
  drop: (filePaths: string[]) => {
    return ipcRenderer.invoke('drop', filePaths);
  },
  baseName: (filePath: string): string => path.basename(filePath, path.extname(filePath)),
  getStatic: (val: string) => {
    if (isDevelopment) {
      return url.resolve(window.location.origin, val);
    }
    return path.resolve(__static, val);
  },
  getAudio: async (val: string) => {
    const buffer = fs.readFileSync(val);
    const fileType = await FileType.fromBuffer(buffer);
    if (!fileType) {
      throw new Error('failed');
    }
    const base64data = new Buffer(buffer).toString('base64');
    return `data:${fileType.mime};base64,${base64data}`;
  },
});
