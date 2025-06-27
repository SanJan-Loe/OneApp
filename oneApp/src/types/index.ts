// Conda环境类型
export interface CondaEnv {
  name: string
  path: string
  version?: string
}

// 扩展IpcRenderer接口
export interface ExtendedIpcRenderer extends Electron.IpcRenderer {
  on(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void): this
  invoke<T = any>(channel: string, ...args: any[]): Promise<T>
}

// IPC通信类型
export interface ElectronAPI {
  getWebUIStatus: () => Promise<string>
  launchWebUI: (env: { path: string; name: string }) => Promise<boolean>
  startWebUIService: () => Promise<void>
  stopWebUIService: () => Promise<void>
  onWebUILog: (callback: (message: string) => void) => void
  getCondaEnvs: () => Promise<CondaEnv[]>
  getCurrentCondaEnv: () => Promise<CondaEnv | null>
  setCondaEnv: (envPath: string) => Promise<void>
  [key: string]: (...args: any[]) => any
}

// 扩展Window接口
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
