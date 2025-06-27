import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron'
import type { WebUILaunchParams, WindowHandlers } from '../src/types/electron'
import { 
    createMainWindow,
    registerWindowHandlers
} from './core/window'
import {
    getCondaEnvs,
    getCurrentCondaEnv,
    setCondaEnv
} from './core/conda'
import {
    startWebUIService,
    stopWebUIService,
    getWebUIStatus,
    setMainWindow
} from './core/webui'
import { writeLog } from './core/logger'

// 应用状态管理
interface AppState {
    isQuitting: boolean
    lastError?: Error
}

// 创建主应用窗口
let mainWindow: Electron.BrowserWindow | null = null
let handlers: WindowHandlers | null = null
const appState: AppState = {
    isQuitting: false
}

// 初始化应用
const initApp = async (): Promise<void> => {
    // 确保单实例应用
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
        app.quit()
        return
    }
    
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })
    try {
    // 创建主窗口
    mainWindow = createMainWindow()
    setMainWindow(mainWindow)
    
    // 注册窗口操作处理器
    handlers = registerWindowHandlers(mainWindow)

    // 添加F5调试快捷键
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F5') {
        mainWindow?.webContents.openDevTools()
      }
    })
        
        // 设置IPC事件处理器
        setupIpcHandlers()
    } catch (error) {
        console.error('App initialization failed:', error)
        process.exit(1)
    }
}

// 设置IPC事件处理器
const setupIpcHandlers = (): void => {
    if (!handlers) {
        writeLog('Window handlers not initialized')
        return
    }

    // Conda环境相关
    ipcMain.handle('get-conda-envs', getCondaEnvs)
    ipcMain.handle('get-current-conda-env', getCurrentCondaEnv)
    ipcMain.handle('set-conda-env', (event: IpcMainInvokeEvent, envPath: string) => setCondaEnv(envPath))
    
    // WebUI服务相关
    ipcMain.handle('start-webui-service', (event: IpcMainInvokeEvent, env: WebUILaunchParams) => startWebUIService(env))
    ipcMain.handle('stop-webui-service', stopWebUIService)
    ipcMain.handle('get-webui-status', getWebUIStatus)
    
    // 日志相关
    ipcMain.handle('write-log', (event: IpcMainInvokeEvent, message: string) => {
        writeLog(`[App] ${message}`)
    })

    // 错误日志处理
    ipcMain.handle('log-error', (event: IpcMainInvokeEvent, payload: { 
        message: string
        stack?: string
        timestamp: string
    }) => {
        const errorMsg = `[ERROR] ${payload.timestamp} - ${payload.message}`
        writeLog(errorMsg)
        if (payload.stack) {
            writeLog(`[STACK] ${payload.stack}`)
        }
    })
    
    // 窗口操作
    ipcMain.on('start-drag', () => handlers?.startDrag())
    ipcMain.on('minimize-window', () => handlers?.minimize())
    ipcMain.on('maximize-window', () => handlers?.maximize())
    ipcMain.on('close-window', () => handlers?.close())
}

// 应用生命周期管理
app.on('before-quit', () => {
    appState.isQuitting = true
    stopWebUIService()
    writeLog('Application shutdown')
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        initApp().catch(error => {
            console.error('Failed to reinitialize app:', error)
            process.exit(1)
        })
    }
})

// 启动应用
app.whenReady().then(() => {
    initApp().catch(error => {
        console.error('Failed to initialize app:', error)
        process.exit(1)
    })
})

// 错误处理
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)
    appState.lastError = error
    writeLog(`[CRASH] ${error.message}\n${error.stack || ''}`)
    if (!appState.isQuitting) {
        BrowserWindow.getAllWindows().forEach(win => {
            win.webContents.send('app-crashed', {
                message: error.message,
                stack: error.stack
            })
        })
    }
})

process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    console.error('Unhandled Rejection at:', promise, 'reason:', error)
    appState.lastError = error
    writeLog(`[UNHANDLED_REJECTION] ${error.message}\n${error.stack || ''}`)
})
