import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { WebUILaunchParams } from '../src/types/electron'

/**
 * 严格类型化的Electron API
 */
contextBridge.exposeInMainWorld('electronAPI', {
    launchWebUI: (params: WebUILaunchParams) => ipcRenderer.invoke('start-webui-service', params),
    getCondaEnvs: () => ipcRenderer.invoke('get-conda-envs'),
    getCurrentCondaEnv: () => ipcRenderer.invoke('get-current-conda-env'),
    setCondaEnv: (envPath: string) => ipcRenderer.invoke('set-conda-env', envPath),
    getWebUIStatus: () => ipcRenderer.invoke('get-webui-status'),
    onWebUILog: (callback: (message: string) => void) => {
        ipcRenderer.on('webui-log', (event: IpcRendererEvent, message: string) => callback(message))
        return () => ipcRenderer.removeListener('webui-log', (event: IpcRendererEvent, message: string) => callback(message))
    },
    windowControls: {
        startDrag: () => ipcRenderer.send('start-drag'),
        minimize: () => ipcRenderer.send('minimize-window'),
        maximize: () => ipcRenderer.send('maximize-window'),
        close: () => ipcRenderer.send('close-window')
    }
})

// 类型声明
declare global {
    interface Window {
        electronAPI: {
            launchWebUI(params: WebUILaunchParams): Promise<void>
            getCondaEnvs(): Promise<string[]>
            getCurrentCondaEnv(): Promise<string | null>
            setCondaEnv(envPath: string): Promise<void>
            getWebUIStatus(): Promise<boolean>
            onWebUILog(callback: (message: string) => void): () => void
            windowControls: {
                startDrag(): void
                minimize(): void
                maximize(): void
                close(): void
            }
        }
    }
}
