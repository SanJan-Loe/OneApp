import { Ref } from 'vue'

export interface Logger {
  logs: Ref<string[]>
  addLog: (message: string) => void
  clearLogs: () => void
}

export declare function useLogger(): Logger
