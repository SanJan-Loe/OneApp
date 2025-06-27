<script setup>
import { ref } from 'vue'

defineProps({
  activeWindow: String,
  logs: Array,
  webUIStatus: String,
  envs: Array,
  currentEnv: String,
  showEnvList: Boolean,
  isLoading: Boolean
})

const emit = defineEmits([
  'update:showEnvList',
  'selectEnv',
  'launchWebUI',
  'toggleWebUIService'
])

const addLog = (message) => {
  emit('addLog', message)
}

const onWebviewReady = () => {
  addLog('Webview DOM已准备就绪')
}
</script>

<template>
  <div class="main-content">
    <!-- 主窗口 -->
    <div v-if="activeWindow === 'main'" class="main-window">
      <div class="env-selector">
        <div 
          class="current-env" 
          @click="!isLoading && $emit('update:showEnvList', !showEnvList)"
          :class="{ disabled: isLoading }"
        >
          {{ currentEnv || 'Select Conda Env' }}
          <span class="arrow">▼</span>
          <span v-if="isLoading" class="loading-spinner"></span>
        </div>
        <div v-if="showEnvList && !isLoading" class="env-list">
          <div 
            v-for="env in envs" 
            :key="env" 
            class="env-item"
            @click="$emit('selectEnv', env)"
          >
            {{ env }}
          </div>
        </div>
      </div>

      <h1>OneApp.com</h1>
      <button @click="$emit('launchWebUI')" class="webui-button">
        Launch Open-WebUI
      </button>
    </div>

    <!-- 日志窗口 -->
    <div v-if="activeWindow === 'logs'" class="log-window">
      <h2>系统日志</h2>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-entry">
          <span class="timestamp">[{{ log.timestamp }}]</span>
          {{ log.message }}
        </div>
      </div>
    </div>

    <!-- Open-WebUI窗口 -->
    <div v-if="activeWindow === 'webui'" class="webui-window">
      <div class="webui-controls">
        <button 
          @click="$emit('toggleWebUIService')" 
          :class="['service-button', webUIStatus === 'running' ? 'stop' : 'start']"
          :disabled="webUIStatus === 'loading'"
        >
          {{ webUIStatus === 'running' ? '停止服务' : '启动服务' }}
          <span v-if="webUIStatus === 'loading'" class="loading-spinner"></span>
        </button>
        <span class="status-indicator" :class="webUIStatus">
          {{
            webUIStatus === 'running' ? '服务运行中 (http://localhost:8080)' :
            webUIStatus === 'port-in-use' ? '端口8080被占用 (请关闭其他程序)' :
            webUIStatus === 'loading' ? '服务状态检测中...' :
            '服务已停止'
          }}
        </span>
      </div>
      
      <div v-if="webUIStatus !== 'running'" class="webui-placeholder">
        <p v-if="webUIStatus === 'port-in-use'">
          端口8080被其他程序占用，请先关闭占用程序
        </p>
        <p v-else>
          Open-WebUI服务未运行
        </p>
        <button 
          @click="$emit('toggleWebUIService')" 
          class="start-button"
          :disabled="webUIStatus === 'port-in-use'"
        >
          {{ webUIStatus === 'port-in-use' ? '端口被占用' : '启动Open-WebUI服务' }}
        </button>
      </div>

      <webview 
        v-else
        src="http://localhost:8080" 
        class="webui-view"
        partition="persist:webui"
        allowpopups
        @did-fail-load="addLog(`Webview加载失败: ${$event.errorDescription}`)"
        @did-finish-load="addLog('Webview加载完成')"
        @dom-ready="onWebviewReady"
      ></webview>
    </div>
  </div>
</template>

<style scoped src="@/assets/styles/components.css"></style>
