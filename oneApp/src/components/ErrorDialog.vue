<script setup>
import { ref } from 'vue'

const props = defineProps({
  message: String,
  visible: Boolean
})

const emit = defineEmits(['close'])

const isExpanded = ref(false)
const maxLines = 3

const closeDialog = () => {
  emit('close')
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div v-if="visible" class="error-dialog-overlay">
    <div class="error-dialog">
      <div class="message-container">
        <div 
          class="error-message"
          :class="{ 'expanded': isExpanded }"
        >
          {{ message }}
        </div>
      </div>
      <div class="dialog-actions">
        <button 
          v-if="message && message.length > 100" 
          class="toggle-button"
          @click="toggleExpand"
        >
          {{ isExpanded ? '收起' : '展开' }}
        </button>
        <button class="confirm-button" @click="closeDialog">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.error-dialog {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  width: 400px;
  max-width: 90%;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}

.message-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

.error-message {
  color: #d32f2f;
  font-size: 16px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: v-bind(maxLines);
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}

.error-message.expanded {
  -webkit-line-clamp: unset;
}

.dialog-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.confirm-button {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-button:hover {
  background-color: #1565c0;
}

.toggle-button {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  padding: 8px;
  font-size: 14px;
}

.toggle-button:hover {
  text-decoration: underline;
}
</style>
