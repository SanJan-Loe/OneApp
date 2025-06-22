<script setup>
import { onMounted } from 'vue'

const startDrag = () => {
  window.electronAPI.startDrag()
}

const minimizeWindow = () => {
  window.electronAPI.minimizeWindow()
}

const maximizeWindow = () => {
  window.electronAPI.maximizeWindow()
}

const closeWindow = () => {
  window.electronAPI.closeWindow()
}
</script>

<template>
  <div class="drag-bar" @mousedown="startDrag">
    <div class="window-controls">
      <button class="control-btn minimize" @click="minimizeWindow">─</button>
      <button class="control-btn maximize" @click="maximizeWindow">□</button>
      <button class="control-btn close" @click="closeWindow">✕</button>
    </div>
  </div>
</template>

<style scoped src="@/assets/styles/components.css"></style>
