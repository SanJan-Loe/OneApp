// Electron IPC通信相关类型定义
export interface WebUILaunchParams {
    path: string
    name: string
}

export interface WindowHandlers {
    startDrag: () => void
    minimize: () => void
    maximize: () => void
    close: () => void
}

declare global {
    namespace Electron {
        interface IpcMain {
            handle(channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<any> | any): void
        }
        interface App {
            whenReady(): Promise<void>
        }
        interface IpcMainInvokeEvent {
            sender: WebContents
            frameId: number
        }
    }
}
