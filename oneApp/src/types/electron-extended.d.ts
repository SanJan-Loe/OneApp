import { BrowserWindow as ElectronBrowserWindow } from 'electron'

declare global {
  interface BrowserWindow extends ElectronBrowserWindow {
    beginMoveDrag: () => boolean
  }
}

declare module 'electron' {
  interface WebContents {
    on(event: 'did-fail-load', listener: (event: Event, errorCode: number, errorDescription: string) => void): this
    on(event: 'preload-error', listener: (event: Event, preloadPath: string, error: Error) => void): this
    on(event: 'console-message', listener: (event: Event, level: number, message: string) => void): this
  }
}
