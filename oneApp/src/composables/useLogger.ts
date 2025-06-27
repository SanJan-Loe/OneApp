import { ref } from 'vue'
import { useElectron } from './useElectron'

interface LogEntry {
  timestamp: string
  message: string
  type?: 'info' | 'warning' | 'error'
  stack?: string
}

export default function useLogger() {
  const logs = ref<LogEntry[]>([])
  const { invoke } = useElectron()

  const addLog = (message: string, type: 'info' | 'warning' | 'error' = 'info', error?: Error) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      message,
      type
    }

    if (error) {
      entry.stack = error.stack
    }

    logs.value.push(entry)
    
    // 发送错误日志到主进程
    if (type === 'error') {
      invoke('log-error', {
        message,
        stack: error?.stack,
        timestamp: entry.timestamp
      })
    }
  }

  const clearLogs = () => {
    logs.value = []
  }

  const getErrorLogs = () => {
    return logs.value.filter(log => log.type === 'error')
  }

  return {
    logs,
    addLog,
    clearLogs,
    getErrorLogs
  }
}
