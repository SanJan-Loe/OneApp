<script setup>
defineProps({
  webUIStatus: String
})

defineEmits(['toggleWebUIService'])
</script>

<template>
  <div class="service-controls">
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
        webUIStatus === 'port-in-use' ? '端口8080被占用' :
        webUIStatus === 'loading' ? '服务状态检测中...' :
        '服务已停止'
      }}
    </span>
  </div>
</template>

<style scoped>
.service-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.service-button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.service-button.start {
  background-color: #4ade80;
  color: white;
}

.service-button.stop {
  background-color: #f87171;
  color: white;
}

.service-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.status-indicator {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.9rem;
}

.status-indicator.running {
  background-color: #dcfce7;
  color: #166534;
}

.status-indicator.port-in-use {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-indicator.loading {
  background-color: #e0e7ff;
  color: #4338ca;
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-left: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
