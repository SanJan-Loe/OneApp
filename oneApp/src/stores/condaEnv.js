import { defineStore } from 'pinia'

export const useCondaEnvStore = defineStore('condaEnv', {
  state: () => ({
    envs: [],
    currentEnv: null, // {name, path} object
    isLoading: false,
    lastUpdated: null
  }),
  actions: {
    async loadEnvs() {
      if (this.envs.length > 0 && Date.now() - this.lastUpdated < 60000) {
        return // 1分钟内缓存有效
      }
      
      this.isLoading = true
      try {
        this.envs = await window.electronAPI.getCondaEnvs()
        this.lastUpdated = Date.now()
      } catch (error) {
        console.error('Failed to load conda envs:', error)
        throw error
      } finally {
        
        this.isLoading = false
      }
    },
    async setCurrentEnv(env) {
      const envPath = typeof env === 'object' ? env.path : env
      if (!envPath || (this.currentEnv && this.currentEnv.path === envPath)) {
        return true
      }

      this.isLoading = true
      try {
        const success = await window.electronAPI.setCondaEnv(envPath)
        if (success) {
          this.currentEnv = {
            name: envPath.split(/[\\/]/).pop(),
            path: envPath
          }
        }
        return success
      } catch (error) {
        console.error('Failed to set conda env:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },
    async loadCurrentEnv() {
      try {
        const envPath = await window.electronAPI.getCurrentCondaEnv()
        if (envPath) {
          this.currentEnv = {
            name: envPath.split(/[\\/]/).pop(),
            path: envPath
          }
        }
      } catch (error) {
        console.error('Failed to load current conda env:', error)
        throw error
      }
    },
    async init() {
      await Promise.all([
        this.loadEnvs(),
        this.loadCurrentEnv()
      ])
    }
  }
})
