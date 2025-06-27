import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron'
import type { Event } from 'electron'
import path from 'path'
import { writeLog } from './logger'

interface WindowHandlers {
  startDrag: () => void
  minimize: () => void
  maximize: () => void
  close: () => void
}

export function createMainWindow(): BrowserWindow {
    const mainWindow = new BrowserWindow({
        width: 1500,
        height: 900,
        icon: "electron/resource/images/code.ico",
        frame: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: 'transparent',
            symbolColor: '#495057', 
            height: 30
        },
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.resolve(__dirname, 'preload.js')
        },
        show: false
    })

    const devServerUrl = process.env['VITE_DEV_SERVER_URL']
    if (devServerUrl) {
        console.log('Loading dev server URL:', devServerUrl)
        mainWindow.loadURL(devServerUrl)
    } else {
        console.log('Loading production index.html')
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
    }

    mainWindow.webContents.on('did-finish-load', () => {
        writeLog('Main window loaded successfully')
        mainWindow.show()
    })
    
    mainWindow.webContents.on('did-fail-load', (event: Electron.Event, errorCode: number, errorDescription: string) => {
      writeLog(`Failed to load: ${errorDescription} (code ${errorCode})`)
    })
    
    mainWindow.webContents.on('preload-error', (event: Electron.Event, preloadPath: string, error: Error) => {
        writeLog(`Preload script error (${preloadPath}): ${error.message}`)
    })
    
    mainWindow.webContents.on('console-message', (event: Electron.Event, level: number, message: string) => {
        writeLog(`Renderer console [${level}]: ${message}`)
    })
    
    const preloadPath = path.join(__dirname, '../dist-electron/preload.js')
    const exists = require('fs').existsSync(preloadPath)
    writeLog(`Main window created with preload: ${preloadPath}`)
    writeLog(`Preload file exists: ${exists}`)
    console.log(`[DEBUG] Preload path: ${preloadPath}`)
    console.log(`[DEBUG] Preload exists: ${exists}`)
    if (!exists) {
        console.error('[ERROR] Preload script not found at:', preloadPath)
    }
    return mainWindow
}

export function registerWindowHandlers(win: BrowserWindow | null): WindowHandlers {
    return {
        startDrag: () => {
            if (win) {
                if (win.isMaximized()) win.unmaximize()
                win.setPosition(win.getPosition()[0], win.getPosition()[1] - 1)
            }
        },
        minimize: () => {
            win && win.minimize()
        },
        maximize: () => {
            win && (win.isMaximized() ? win.unmaximize() : win.maximize())
        },
        close: () => {
            win && win.close()
        }
    }
}
