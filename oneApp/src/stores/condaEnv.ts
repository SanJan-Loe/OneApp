import { defineStore } from 'pinia'
import type { CondaEnv, CondaEnvState, CondaEnvActions } from './condaEnv.d'

export const useCondaEnvStore = defineStore('condaEnv', {
  state: (): CondaEnvState => ({
    envs: [],
    currentEnv: null,
    isLoading: false
  }),

  actions: {
    async init() {
      try {
        this.isLoading = true
        await this.loadEnvs()
        await this.loadCurrentEnv()
      } finally {
        this.isLoading = false
      }
    },

    async loadEnvs() {
      this.isLoading = true
      try {
        this.envs = await window.electronAPI.getCondaEnvs()
      } finally {
        this.isLoading = false
      }
    },

    async loadCurrentEnv() {
      this.isLoading = true
      try {
        const envPath = await window.electronAPI.getCurrentCondaEnv()
        this.currentEnv = this.envs.find(env => env.path === envPath?.path) || null
      } finally {
        this.isLoading = false
      }
    },

    async setCurrentEnv(env: string | CondaEnv) {
      this.isLoading = true
      try {
        const envPath = typeof env === 'string' ? env : env?.path
        if (!envPath) {
          throw new Error('Invalid environment path')
        }
        await window.electronAPI.setCondaEnv(envPath)
        
        // 更新当前环境
        await this.loadCurrentEnv()
      } finally {
        this.isLoading = false
      }
    }
  }
})
