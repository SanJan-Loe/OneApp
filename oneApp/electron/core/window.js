import { BrowserWindow } from 'electron'
import path from 'path'
import url from 'url'
import fs from 'fs'
import { writeLog } from './logger.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 创建主窗口
export const createMainWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1500,
        height: 900,
        icon: "electron/resource/images/code.ico",
        frame: false,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#f8f9fa',
            symbolColor: '#495057',
            height: 30
        },
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.mjs'),
        },
        show: false // Don't show window until ready
    })

    // 开发环境加载开发服务器
    if (process.env['VITE_DEV_SERVER_URL']) {
        mainWindow.loadURL(process.env['VITE_DEV_SERVER_URL'])
    } else {
        // 生产环境加载打包后的文件
        mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
    }

    // Add event listeners for debugging
    mainWindow.webContents.on('did-finish-load', () => {
        writeLog('Main window loaded successfully')
        mainWindow.show()
    })
    
    mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
        writeLog(`Preload script error (${preloadPath}): ${error}`)
    })
    
    mainWindow.webContents.on('console-message', (event, level, message) => {
        writeLog(`Renderer console [${level}]: ${message}`)
    })
    
    const preloadPath = path.join(__dirname, 'preload.mjs')
    const exists = fs.existsSync(preloadPath)
    writeLog(`Main window created with preload: ${preloadPath}`)
    writeLog(`Preload file exists: ${exists}`)
    console.log(`[DEBUG] Preload path: ${preloadPath}`)
    console.log(`[DEBUG] Preload exists: ${exists}`)
    if (!exists) {
        console.error('[ERROR] Preload script not found at:', preloadPath)
    }
    return mainWindow
}

// 注册窗口操作IPC事件
export const registerWindowHandlers = (win) => {
    return {
        // 窗口拖拽
        startDrag: () => {
            win && win.isMaximized() ? win.unmaximize() : null
            win && win.beginMoveDrag()
        },
        // 最小化窗口
        minimize: () => {
            win && win.minimize()
        },
        // 最大化/还原窗口
        maximize: () => {
            win && (win.isMaximized() ? win.unmaximize() : win.maximize())
        },
        // 关闭窗口
        close: () => {
            win && win.close()
        }
    }
}
