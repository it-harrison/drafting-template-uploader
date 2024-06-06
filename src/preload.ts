// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { ipcRenderer, contextBridge } from "electron";
import { tokenUIResponse, uploadUIResponse, hideContainer, tokenUpdateResponse, sleepTimer, updateProgBar } from "./functions";

ipcRenderer.on('upload-canceled', (_) => {
  hideContainer('loading-container');
});

ipcRenderer.on('upload-done', (_, result) => {
  hideContainer('prog-bar');
  uploadUIResponse(result)
});

ipcRenderer.on('upload-progress', (_, result) => {
  hideContainer('loading-container');
  updateProgBar(result);
});

ipcRenderer.on('token-updated', (_, result) => {
  hideContainer('loading-container');
  tokenUpdateResponse(result);
});

contextBridge.exposeInMainWorld('api', {
  showOpenDialog: (dst: boolean) => {
    ipcRenderer.send('show-open-file-dialog', dst);
  },
  transmitToken: (token: string) => {
    ipcRenderer.send('store-token', token);
  }
});

ipcRenderer.send('app-loaded');

ipcRenderer.on('token-check', (_, check) => {
  tokenUIResponse(check.isToken);
});

ipcRenderer.on('sleep-start', (_, seconds) => {
  sleepTimer(seconds);
});