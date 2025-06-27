import { DefineStoreOptions } from 'pinia'

interface CondaEnv {
  name: string
  path: string
  version?: string
}

export interface CondaEnvState {
  envs: CondaEnv[]
  currentEnv: CondaEnv | null
  isLoading: boolean
}

export interface CondaEnvActions {
  init(): Promise<void>
  loadEnvs(): Promise<void>
  loadCurrentEnv(): Promise<void>
  setCurrentEnv(env: string | CondaEnv): Promise<void>
}

export type CondaEnvStore = DefineStoreOptions<string, CondaEnvState, {}, CondaEnvActions>
