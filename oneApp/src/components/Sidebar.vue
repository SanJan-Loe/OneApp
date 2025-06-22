<script setup>
defineProps({
  activeWindow: String
})

const emit = defineEmits(['update:activeWindow', 'openWebUI'])
</script>

<template>
  <div class="sidebar">
    <div 
      class="nav-item" 
      :class="{ active: activeWindow === 'main' }"
      @click="$emit('update:activeWindow', 'main')"
    >
      主窗口
    </div>
    <div 
      class="nav-item" 
      :class="{ active: activeWindow === 'logs' }"
      @click="$emit('update:activeWindow', 'logs')"
    >
      日志窗口
    </div>
    <div 
      class="nav-item" 
      :class="{ active: activeWindow === 'webui' }"
      @click="$emit('openWebUI')"
    >
      Open-WebUI
    </div>
  </div>
</template>

<style scoped src="@/assets/styles/components.css"></style>
