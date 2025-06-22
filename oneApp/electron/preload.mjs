import { contextBridge, ipcRenderer } from 'electron'

console.log('Preload script executing') // Debug log

contextBridge.exposeInMainWorld('electronAPI', {
    launchWebUI: (envPath, envName) => ipcRenderer.invoke('start-webui-service', envPath, envName),
    getCondaEnvs: () => ipcRenderer.invoke('get-conda-envs'),
    getCurrentCondaEnv: () => ipcRenderer.invoke('get-current-conda-env'),
    setCondaEnv: (envPath) => ipcRenderer.invoke('set-conda-env', envPath),
    startWebUIService: () => ipcRenderer.invoke('start-webui-service'),
    stopWebUIService: () => ipcRenderer.invoke('stop-webui-service'),
    getWebUIStatus: () => ipcRenderer.invoke('get-webui-status'),
    onWebUILog: (callback) => ipcRenderer.on('webui-log', (event, message) => callback(message)),
    // 添加拖拽相关方法
    startDrag: () => ipcRenderer.send('start-drag'),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window')
})
