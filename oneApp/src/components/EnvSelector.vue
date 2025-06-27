<script setup>
import { computed, ref } from 'vue'
import { useCondaEnvStore } from '@/stores/condaEnv'

const store = useCondaEnvStore()
const searchQuery = ref('')

const props = defineProps({
  showEnvList: Boolean
})

const emit = defineEmits(['update:showEnvList', 'selectEnv'])

const filteredEnvs = computed(() => {
  return store.envs.filter(env => 
    env.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const toggleEnvList = () => {
  if (!store.isLoading) {
    emit('update:showEnvList', !props.showEnvList)
  }
}

const selectEnv = (env) => {
  emit('selectEnv', env)
  emit('update:showEnvList', false)
}
</script>

<template>
  <div class="env-selector">
    <div 
      class="current-env" 
      @click="toggleEnvList"
      :class="{ disabled: store.isLoading }"
    >
      {{ store.currentEnv || 'Select Conda Env' }}
      <span class="arrow">▼</span>
      <span v-if="store.isLoading" class="loading-spinner"></span>
    </div>
    
    <div v-if="showEnvList && !store.isLoading" class="env-list">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索环境..."
          class="search-input"
          @click.stop
        >
      </div>
      <div 
        v-for="env in filteredEnvs" 
        :key="env" 
        class="env-item"
        @click="selectEnv(env)"
      >
        {{ env }}
      </div>
      <div v-if="filteredEnvs.length === 0" class="no-results">
        没有匹配的环境
      </div>
    </div>
  </div>
</template>

<style scoped>
.env-selector {
  position: relative;
  margin-bottom: 1rem;
}

.current-env {
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: #f8fafc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
}

.current-env:hover {
  border-color: #cbd5e1;
  background-color: #f1f5f9;
}

.current-env.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.arrow {
  margin-left: 0.5rem;
  transition: transform 0.2s;
}

.env-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.search-box {
  padding: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  outline: none;
}

.search-input:focus {
  border-color: #3b82f6;
}

.env-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.env-item:hover {
  background-color: #f8fafc;
}

.no-results {
  padding: 1rem;
  text-align: center;
  color: #64748b;
}

.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
  margin-left: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
