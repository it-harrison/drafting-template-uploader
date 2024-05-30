// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ipcRenderer, contextBridge } from "electron";
import { tokenUIResponse, uploadUIResponse, hideContainer, tokenUpdateResponse } from "./functions";

ipcRenderer.on('upload-canceled', (_) => {
  hideContainer('loading-container');
});

ipcRenderer.on('upload-done', (_, result) => {
  hideContainer('loading-container');
  uploadUIResponse(result)
});

ipcRenderer.on('token-updated', (_, result) => {
  hideContainer('loading-container');
  tokenUpdateResponse(result);
});

contextBridge.exposeInMainWorld('api', {
  showOpenDialog: () => {
    ipcRenderer.send('show-open-file-dialog');
  },
  transmitToken: (token: string) => {
    ipcRenderer.send('store-token', token);
  }
});

ipcRenderer.send('app-loaded');

ipcRenderer.on('token-check', (_, check) => {
  tokenUIResponse(check.isToken);
});