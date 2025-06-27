import { exec, type ChildProcess } from 'child_process'
import { writeLog } from './logger'
import type { BrowserWindow } from 'electron'

// WebUI进程状态
let webuiProcess: ChildProcess | null = null
let mainWindow: BrowserWindow | null = null

// WebUI启动参数
interface WebUILaunchParams {
    path: string
    name?: string
}

export const setMainWindow = (window: BrowserWindow): void => {
    mainWindow = window
}

// 启动WebUI服务
export const startWebUIService = async (env: WebUILaunchParams): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            // 如果已有进程在运行，先终止
            if (webuiProcess) {
                webuiProcess.kill() // 忽略返回值
            }

            if (!env?.path) {
                throw new Error('Invalid environment object - missing path property')
            }

            console.log(`Starting WebUI service with environment: ${env.name || 'unknown'} (${env.path})`)

            const isWindows = process.platform === 'win32'
            const activateCmd = isWindows 
                ? `conda activate ${env.path} && `
                : `source activate ${env.path} && `
            
            webuiProcess = exec(`${activateCmd}open-webui serve`, 
                { 
                    maxBuffer: 1024 * 1024,
                    shell: "true",
                    windowsHide: false
                },
                (error, stdout, stderr) => {
                    if (error) {
                        writeLog(`WebUI service error: ${error.message}`)
                        reject(error.message)
                        return
                    }
                    resolve(stdout)
                }
            )

            // 转发stdout到渲染进程并写入日志
            webuiProcess.stdout?.on('data', (data) => {
                const logMessage = data.toString()
                writeLog(`[WebUI] ${logMessage}`)
                mainWindow?.webContents.send('webui-log', logMessage)
            })

            // 转发stderr到渲染进程并写入日志
            webuiProcess.stderr?.on('data', (data) => {
                const logMessage = data.toString()
                writeLog(`[WebUI-ERROR] ${logMessage}`)
                mainWindow?.webContents.send('webui-log', `[ERROR] ${logMessage}`)
            })

            // 进程退出时清理
            webuiProcess.on('exit', (code) => {
                writeLog(`WebUI process exited with code ${code}`)
                webuiProcess = null
            })

        } catch (error) {
            const err = error as Error
            writeLog(`WebUI service error: ${err.message}`)
            reject(err.message || '启动WebUI失败')
        }
    })
}

// 停止WebUI服务
export const stopWebUIService = async (): Promise<string> => {
    return new Promise((resolve) => {
        if (webuiProcess) {
            // 强制终止进程树
            const pid = webuiProcess.pid
            const isWindows = process.platform === 'win32'
            const killCmd = isWindows 
                ? `taskkill /PID ${pid} /T /F`
                : `pkill -P ${pid}`
            
            exec(killCmd, (error) => {
                if (error) {
                    writeLog(`Failed to kill WebUI process: ${error.message}`)
                    resolve('Failed to stop service')
                } else {
                    webuiProcess = null
                    writeLog('WebUI service stopped')
                    resolve('Service stopped')
                }
            })
        } else {
            // 如果没有进程记录，尝试通过端口查找并杀死
            exec('lsof -i :8080 -t | xargs kill -9', (error) => {
                if (error) {
                    writeLog('No running WebUI service found')
                    resolve('No running service')
                } else {
                    writeLog('WebUI service stopped (via port kill)')
                    resolve('Service stopped')
                }
            })
        }
    })
}

// 获取WebUI服务状态
export const getWebUIStatus = async (): Promise<'running' | 'stopped' | 'port-in-use' | 'loading'> => {
    return new Promise((resolve) => {
        const checkStatus = (callback: (status: 'running' | 'stopped' | 'port-in-use') => void) => {
            // 首先检查进程是否存活
            if (webuiProcess) {
                callback('running')
                return
            }

            // 改进的端口检测逻辑
            const isWindows = process.platform === 'win32'
            const cmd = isWindows 
                ? `netstat -ano | findstr :8080 | findstr LISTENING`
                : 'lsof -i :8080 -t'
            
            exec(cmd, (error, stdout) => {
                if (error || !stdout.trim()) {
                    callback('stopped')
                } else {
                    // Windows平台直接通过端口检测
                    if (isWindows) {
                        callback('running')
                        return
                    }
                    
                    // 其他平台验证进程名
                    const pid = stdout.trim()
                    exec(`ps -p ${pid} -o comm= | grep -i open-webui`, 
                    (error, stdout) => {
                        callback(error || !stdout ? 'port-in-use' : 'running')
                    })
                }
            })
        }

        // 立即检查状态，不再返回loading
        checkStatus((status) => {
            if (status === 'running') {
                writeLog('WebUI service is running')
                mainWindow?.webContents.send('webui-status-changed', 'running')
            } else if (status === 'port-in-use') {
                writeLog('Port 8080 is in use by another process')
            }
            resolve(status)
        })
    })
}
