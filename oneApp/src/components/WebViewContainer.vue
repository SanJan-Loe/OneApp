<script setup>
import { ref } from 'vue'

const props = defineProps({
  webUIStatus: String
})

const emit = defineEmits(['returnToMain', 'addLog'])

const webviewLoading = ref(true)
const webuiView = ref(null)

const handleWebviewLoadError = (event) => {
  webviewLoading.value = false
  emit('addLog', `Webview加载失败: ${event.errorDescription}`)
  emit('returnToMain')
}

const onWebviewReady = () => {
  webviewLoading.value = false
  emit('addLog', 'Webview DOM已准备就绪')
}
</script>

<template>
  <div class="webui-container">
    <webview
      ref="webuiView"
      src="http://localhost:8080"
      class="webui-view"
      partition="persist:webui"
      allowpopups
      webpreferences="nodeIntegration=no,contextIsolation=yes"
      @did-start-loading="() => {
        webviewLoading.value = true
        emit('addLog', '开始加载Open-WebUI页面...')
      }"
      @did-fail-load="handleWebviewLoadError"
      @did-finish-load="() => {
        webviewLoading.value = false
        emit('addLog', 'Open-WebUI页面加载完成')
      }"
      @dom-ready="onWebviewReady"
    ></webview>
    <div v-if="webviewLoading" class="webui-loading">
      <p>正在加载Open-WebUI页面...</p>
    </div>
  </div>
</template>

<style scoped>
.webui-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.webui-view {
  width: 100%;
  height: 100%;
  display: flex;
}

.webui-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #666;
}
</style>
