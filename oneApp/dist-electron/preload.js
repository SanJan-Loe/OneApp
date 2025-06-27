"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  launchWebUI: (params) => electron.ipcRenderer.invoke("start-webui-service", params),
  getCondaEnvs: () => electron.ipcRenderer.invoke("get-conda-envs"),
  getCurrentCondaEnv: () => electron.ipcRenderer.invoke("get-current-conda-env"),
  setCondaEnv: (envPath) => electron.ipcRenderer.invoke("set-conda-env", envPath),
  getWebUIStatus: () => electron.ipcRenderer.invoke("get-webui-status"),
  onWebUILog: (callback) => {
    electron.ipcRenderer.on("webui-log", (event, message) => callback(message));
    return () => electron.ipcRenderer.removeListener("webui-log", (event, message) => callback(message));
  },
  windowControls: {
    startDrag: () => electron.ipcRenderer.send("start-drag"),
    minimize: () => electron.ipcRenderer.send("minimize-window"),
    maximize: () => electron.ipcRenderer.send("maximize-window"),
    close: () => electron.ipcRenderer.send("close-window")
  }
});
