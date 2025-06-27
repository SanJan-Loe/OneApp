import type { ElectronAPI } from '@/types'

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export function useElectron() {
  const invoke = <T = void>(channel: string, ...args: any[]): Promise<T> => {
    return window.electronAPI[channel](...args)
  }

  const on = (channel: string, callback: (...args: any[]) => void) => {
    const eventName = `on${channel.charAt(0).toUpperCase()}${channel.slice(1)}`
    if (window.electronAPI[eventName]) {
      return window.electronAPI[eventName](callback)
    }
    console.error(`Event ${channel} not exposed via electronAPI`)
    return () => {}
  }

  return {
    invoke,
    on,
    electronAPI: window.electronAPI
  }
}
