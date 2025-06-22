"use strict";
const electron = require("electron");
console.log("Preload script executing");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  launchWebUI: (envPath, envName) => electron.ipcRenderer.invoke("start-webui-service", envPath, envName),
  getCondaEnvs: () => electron.ipcRenderer.invoke("get-conda-envs"),
  getCurrentCondaEnv: () => electron.ipcRenderer.invoke("get-current-conda-env"),
  setCondaEnv: (envPath) => electron.ipcRenderer.invoke("set-conda-env", envPath),
  startWebUIService: () => electron.ipcRenderer.invoke("start-webui-service"),
  stopWebUIService: () => electron.ipcRenderer.invoke("stop-webui-service"),
  getWebUIStatus: () => electron.ipcRenderer.invoke("get-webui-status"),
  onWebUILog: (callback) => electron.ipcRenderer.on("webui-log", (event, message) => callback(message)),
  // 添加拖拽相关方法
  startDrag: () => electron.ipcRenderer.send("start-drag"),
  minimizeWindow: () => electron.ipcRenderer.send("minimize-window"),
  maximizeWindow: () => electron.ipcRenderer.send("maximize-window"),
  closeWindow: () => electron.ipcRenderer.send("close-window")
});
