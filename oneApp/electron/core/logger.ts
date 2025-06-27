import fs from 'fs'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 日志等级类型
type LogLevelType = {
  DEBUG: number
  INFO: number
  WARN: number
  ERROR: number
}

// 日志等级枚举
export const LogLevel: LogLevelType = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

// 当前日志等级(开发环境默认DEBUG，生产环境默认INFO)
const currentLevel: number = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG

// 获取日志文件路径
export const getLogPath = (): string => {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`
  return path.join(__dirname, '../../logs', `app-${dateStr}.log`)
}

// 写入日志到文件
export const writeLog = (message: string, level: number = LogLevel.INFO): void => {
  if (level < currentLevel) return

  try {
    const logPath = getLogPath()
    const logDir = path.dirname(logPath)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    const levelStr = Object.keys(LogLevel).find(key => LogLevel[key as keyof LogLevelType] === level)
    const logMessage = `${new Date().toISOString()} [${levelStr}] - ${message}`

    // 开发环境输出到控制台
    if (process.env.NODE_ENV !== 'production') {
      const colors = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m',  // Green
        [LogLevel.WARN]: '\x1b[33m',  // Yellow
        [LogLevel.ERROR]: '\x1b[31m'  // Red
      }
      console.log(`${colors[level as keyof typeof colors]}${logMessage}\x1b[0m`)
    }

    fs.appendFileSync(logPath, `${logMessage}\n`)
  } catch (error) {
    console.error('Failed to write log:', error)
  }
}

// 快捷方法
export const debug = (message: string): void => writeLog(message, LogLevel.DEBUG)
export const info = (message: string): void => writeLog(message, LogLevel.INFO)
export const warn = (message: string): void => writeLog(message, LogLevel.WARN)
export const error = (message: string): void => writeLog(message, LogLevel.ERROR)
