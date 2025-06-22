import fs from 'fs'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取日志文件路径
export const getLogPath = () => {
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`
  return path.join(__dirname, '../../logs', `app-${dateStr}.log`)
}

// 写入日志到文件
export const writeLog = (message) => {
  try {
    const logPath = getLogPath()
    const logDir = path.dirname(logPath)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    fs.appendFileSync(logPath, `${new Date().toISOString()} - ${message}\n`)
  } catch (error) {
    console.error('Failed to write log:', error)
  }
}
