import { exec } from 'child_process'
import { writeLog } from './logger.js'

let webuiProcess = null
let mainWindow = null

export const setMainWindow = (window) => {
    mainWindow = window
}

// 启动WebUI服务
export const startWebUIService = async (env) => {
    return new Promise((resolve, reject) => {
        try {
            // 如果已有进程在运行，先终止
            if (webuiProcess) {
                webuiProcess.kill()
            }

            if (!env || !env.path) {
                throw new Error('Invalid environment object - missing path property')
            }

            console.log(`Starting WebUI service with environment: ${env.name} (${env.path})`)

            const isWindows = process.platform === 'win32'
            const activateCmd = isWindows 
                ? `conda activate ${env.path} && `
                : `source activate ${env.path} && `
            
            webuiProcess = exec(`${activateCmd}open-webui serve`, 
                { 
                    maxBuffer: 1024 * 1024,
                    shell: true,
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
            webuiProcess.stdout.on('data', (data) => {
                const logMessage = data.toString()
                writeLog(`[WebUI] ${logMessage}`)
                if (mainWindow) {
                    mainWindow.webContents.send('webui-log', logMessage)
                }
            })

            // 转发stderr到渲染进程并写入日志
            webuiProcess.stderr.on('data', (data) => {
                const logMessage = data.toString()
                writeLog(`[WebUI-ERROR] ${logMessage}`)
                if (mainWindow) {
                    mainWindow.webContents.send('webui-log', `[ERROR] ${logMessage}`)
                }
            })

            // 进程退出时清理
            webuiProcess.on('exit', (code) => {
                writeLog(`WebUI process exited with code ${code}`)
                webuiProcess = null
            })

        } catch (error) {
            writeLog(`WebUI service error: ${error.message}`)
            reject(error.message || '启动WebUI失败')
        }
    })
}

// 停止WebUI服务
export const stopWebUIService = async () => {
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
export const getWebUIStatus = async () => {
    return new Promise((resolve) => {
        resolve('loading') // 先返回loading状态
        
        const checkStatus = (callback) => {
            // 首先检查进程是否存活
            if (webuiProcess) {
                callback('running')
                return
            }

            // 然后检查端口是否被占用
            const isWindows = process.platform === 'win32'
            const cmd = isWindows 
                ? 'netstat -ano | findstr 8080' 
                : 'lsof -i :8080 -t'
            
            exec(cmd, (error, stdout) => {
                if (error || !stdout.trim()) {
                    callback('stopped')
                } else {
                    // 进一步验证是否是我们的进程
                    const pid = isWindows 
                        ? stdout.split(/\s+/).pop()
                        : stdout.trim()
                    
                    exec(isWindows 
                        ? `tasklist /FI "PID eq ${pid}" | findstr /i "open-webui"`
                        : `ps -p ${pid} -o comm= | grep -i open-webui`, 
                    (error, stdout) => {
                        if (error || !stdout) {
                            callback('port-in-use')
                        } else {
                            callback('running')
                        }
                    })
                }
            })
        }

        // 首次检查
        checkStatus((status) => {
            if (status === 'running') {
                writeLog('WebUI service is running')
                resolve(status)
            } else if (status === 'port-in-use') {
                writeLog('Port 8080 is in use by another process')
                resolve('port-in-use')
            } else {
                // 二次验证
                setTimeout(() => checkStatus(resolve), 1000)
            }
        })
    })
}
