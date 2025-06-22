import { exec } from 'child_process'
import { writeLog } from './logger.js'

// 获取conda环境列表
export const getCondaEnvs = async () => {
    return new Promise((resolve, reject) => {
        exec('conda env list --json', (error, stdout, stderr) => {
            if (error) {
                // 尝试使用备用命令获取环境列表
                exec('conda info --envs', (error, stdout, stderr) => {
                    if (error) {
                        writeLog(`Failed to get conda envs: ${error.message}`)
                        reject(error.message)
                        return
                    }
                    try {
                        // 解析conda info --envs的输出
                        const envs = stdout.split('\n')
                            .filter(line => line.trim() && !line.startsWith('#'))
                            .map(line => line.split(/\s+/)[0])
                            .filter(env => env);
                        resolve(envs);
                    } catch (e) {
                        writeLog('Failed to parse conda env list')
                        reject('Failed to parse conda env list')
                    }
                })
                return
            }
            try {
                const envs = JSON.parse(stdout).envs
                resolve(envs.filter(env => env)) // 确保没有undefined环境
            } catch (e) {
                writeLog('Failed to parse conda env list')
                reject('Failed to parse conda env list')
            }
        })
    })
}

// 获取当前conda环境
export const getCurrentCondaEnv = async () => {
    return new Promise((resolve, reject) => {
        exec('conda info --json', (error, stdout, stderr) => {
            if (error) {
                writeLog(`Failed to get current conda env: ${error.message}`)
                reject(error.message)
                return
            }
            try {
                const info = JSON.parse(stdout)
                resolve(info.active_prefix)
            } catch (e) {
                writeLog('Failed to parse conda info')
                reject('Failed to parse conda info')
            }
        })
    })
}

// 切换conda环境
export const setCondaEnv = async (env) => {
    return new Promise((resolve) => {
        const path = typeof env === 'object' ? env.path : env
        if (!path) {
            resolve(false)
            return
        }
        exec(`conda activate ${path} && conda info --json`, (error, stdout) => {
            if (error) {
                writeLog(`Failed to switch conda env: ${error.message}`)
                resolve(false)
                return
            }
            try {
                const info = JSON.parse(stdout)
                if (info.active_prefix === path) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            } catch (e) {
                writeLog('Failed to parse conda info')
                resolve(false)
            }
        })
    })
}
