import { app, ipcMain } from 'electron'
import { 
    createMainWindow,
    registerWindowHandlers
} from './core/window.js'
import {
    getCondaEnvs,
    getCurrentCondaEnv,
    setCondaEnv
} from './core/conda.js'
import {
    startWebUIService,
    stopWebUIService,
    getWebUIStatus,
    setMainWindow
} from './core/webui.js'
import { writeLog } from './core/logger.js'

// 创建主应用窗口
let mainWindow = null
let handlers = null

// 初始化应用
const initApp = async () => {
    // 创建主窗口
    mainWindow = createMainWindow()
    setMainWindow(mainWindow)
    
    // 注册窗口操作处理器
    handlers = registerWindowHandlers(mainWindow)
    
    // 设置IPC事件处理器
    setupIpcHandlers()
    
    // 应用退出时清理
    app.on('before-quit', () => {
        stopWebUIService()
        writeLog('Application shutdown')
    })
}

// 设置IPC事件处理器
const setupIpcHandlers = () => {
    if (!handlers) {
        writeLog('Window handlers not initialized')
        return
    }
    // Conda环境相关
    ipcMain.handle('get-conda-envs', getCondaEnvs)
    ipcMain.handle('get-current-conda-env', getCurrentCondaEnv)
    ipcMain.handle('set-conda-env', (event, envPath) => setCondaEnv(envPath))
    
    // WebUI服务相关
    ipcMain.handle('start-webui-service', (event, env) => startWebUIService(env))
    ipcMain.handle('stop-webui-service', stopWebUIService)
    ipcMain.handle('get-webui-status', getWebUIStatus)
    
    // 日志相关
    ipcMain.handle('write-log', (event, message) => {
        writeLog(`[App] ${message}`)
    })
    
    // 窗口操作
    ipcMain.on('start-drag', () => handlers.startDrag())
    ipcMain.on('minimize-window', () => handlers.minimize())
    ipcMain.on('maximize-window', () => handlers.maximize())
    ipcMain.on('close-window', () => handlers.close())
}

// 启动应用
app.whenReady().then(() => {
    initApp()
})
