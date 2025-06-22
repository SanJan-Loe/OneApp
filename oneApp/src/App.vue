<script setup>
import { ref, onMounted } from 'vue'
import { useCondaEnvStore } from '@/stores/condaEnv'
import WindowControls from '@/components/WindowControls.vue'
import Sidebar from '@/components/Sidebar.vue'
import MainContent from '@/components/MainContent.vue'
import ErrorDialog from '@/components/ErrorDialog.vue'

// 窗口状态
const activeWindow = ref('main')
const logs = ref([])
const webUIStatus = ref('stopped')

// 添加日志
const addLog = (message) => {
  logs.value.push({
    timestamp: new Date().toLocaleTimeString(),
    message
  })
}

// 检查webui服务状态
const checkWebUIStatus = async () => {
  webUIStatus.value = await window.electronAPI.getWebUIStatus()
  return webUIStatus.value
}

// Open-WebUI功能
const launchWebUI = async () => {
  try {
    // 验证当前环境
    if (!condaEnvStore.currentEnv) {
      throw new Error('请先选择conda环境')
    }
    
    // 获取环境路径
    const env = condaEnvStore.currentEnv
    const envPath = env.path || env
    const envName = typeof env === 'object' ? env.name : env
    
    // 日志记录
    addLog(`正在启动Open-WebUI (环境: ${envName})...`)
    
    // 调用electronAPI
    const result = await window.electronAPI.launchWebUI({
      path: envPath,
      name: envName
    })
    
    // 结果处理
    if (result) {
      addLog(`Open-WebUI启动成功 (环境: ${envName})`)
      envError.value = null
    } else {
      throw new Error('启动失败，未知错误')
    }
  } catch (error) {
    envError.value = `启动Open-WebUI失败: ${error.message}`
    showErrorDialog.value = true
    addLog(envError.value)
  }
}

// Conda环境功能
const condaEnvStore = useCondaEnvStore()
const showEnvList = ref(false)

onMounted(async () => {
  try {
    addLog('Initializing conda environments...')
    await condaEnvStore.init()
    addLog(`Current conda env: ${condaEnvStore.currentEnv}`)

    // 设置WebUI日志监听
    window.electronAPI.onWebUILog((message) => {
      addLog(`[WebUI] ${message}`)
    })
  } catch (error) {
    addLog(`Failed to initialize conda envs: ${error.message}`)
  }
})

const envCache = ref([])
const envError = ref(null)
const showErrorDialog = ref(false)

// 加载并缓存所有conda环境
const loadEnvironments = async () => {
  try {
    await condaEnvStore.loadEnvs()
    await condaEnvStore.loadCurrentEnv()
    addLog(`Loaded ${condaEnvStore.envs.length} conda environments`)
    addLog(`Current env: ${condaEnvStore.currentEnv}`)
  } catch (error) {
    envError.value = '加载conda环境失败'
    showErrorDialog.value = true
    addLog(`Environment load error: ${error.message}`)
  }
}

const selectEnv = async (env) => {
  if (condaEnvStore.isLoading) return
  
  try {
    addLog(`正在切换conda环境: ${env}`)
    await condaEnvStore.setCurrentEnv(env)
    showEnvList.value = false
    addLog(`成功切换到 ${env}`)
    envError.value = null
  } catch (error) {
    envError.value = `无法切换到 ${env}: ${error.message}`
    showErrorDialog.value = true
    addLog(envError.value)
  }
}

// 初始化加载环境
onMounted(loadEnvironments)

// Open-WebUI窗口处理
const openWebUIWindow = async () => {
  activeWindow.value = 'webui'
  const status = await checkWebUIStatus()
  if (status !== 'running') {
    envError.value = 'Open-WebUI服务未运行，请先启动服务'
    showErrorDialog.value = true
    activeWindow.value = 'main'
  }
}

// 切换WebUI服务状态
const toggleWebUIService = async () => {
  try {
    if (webUIStatus.value === 'running') {
      addLog('Stopping Open-WebUI service...')
      await window.electronAPI.stopWebUIService()
      addLog('Open-WebUI service stopped')
    } else {
      addLog('Starting Open-WebUI service...')
      await window.electronAPI.startWebUIService()
      addLog('Open-WebUI service started')
    }
    await checkWebUIStatus()
  } catch (error) {
    envError.value = `WebUI服务错误: ${error.message}`
    showErrorDialog.value = true
    addLog(`WebUI service error: ${error.message}`)
  }
}

// 初始化检查服务状态
onMounted(async () => {
  try {
    addLog('Loading conda environments...')
    await condaEnvStore.loadEnvs()
    await condaEnvStore.loadCurrentEnv()
    addLog(`Current conda env: ${condaEnvStore.currentEnv}`)
    await checkWebUIStatus()
  } catch (error) {
    envError.value = `获取conda环境失败: ${error.message}`
    showErrorDialog.value = true
    addLog(`Failed to get conda envs: ${error.message}`)
  }
})
</script>

<template>
  <div class="app-container">
    <ErrorDialog 
      :message="envError" 
      :visible="showErrorDialog"
      @close="showErrorDialog = false"
    />
    <WindowControls />
    <Sidebar 
      :active-window="activeWindow"
      @update:active-window="activeWindow = $event"
      @openWebUI="openWebUIWindow"
    />
    <MainContent
      :active-window="activeWindow"
      :logs="logs"
      :webUIStatus="webUIStatus"
      :envs="condaEnvStore.envs"
      :currentEnv="condaEnvStore.currentEnv"
      :showEnvList="showEnvList"
      :isLoading="condaEnvStore.isLoading"
      @update:showEnvList="showEnvList = $event"
      @selectEnv="selectEnv"
      @launchWebUI="launchWebUI"
      @toggleWebUIService="toggleWebUIService"
      @addLog="addLog"
    />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
  position: relative;
}

.main-content {
  flex: 1;
  padding: 25px;
  position: relative;
  background-color: #f8f9fa;
}

h1 {
  color: #495057;
  font-weight: 600;
  margin-bottom: 30px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

h2 {
  color: #495057;
  font-weight: 600;
  margin-bottom: 20px;
}
</style>
