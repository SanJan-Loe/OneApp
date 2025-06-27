import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import useLogger from '../composables/useLogger'

describe('useLogger', () => {
  it('should add log entry', () => {
    const { addLog, logs } = useLogger()
    addLog('Test message')
    
    expect(logs.value.length).toBe(1)
    expect(logs.value[0].message).toBe('Test message')
    expect(logs.value[0].type).toBe('info')
  })

  it('should add error log with stack', () => {
    const { addLog, logs } = useLogger()
    const error = new Error('Test error')
    addLog('Error occurred', 'error', error)
    
    expect(logs.value.length).toBe(1)
    expect(logs.value[0].type).toBe('error')
    expect(logs.value[0].stack).toBeDefined()
  })

  it('should clear logs', () => {
    const { addLog, logs, clearLogs } = useLogger()
    addLog('Test message')
    clearLogs()
    
    expect(logs.value.length).toBe(0)
  })

  it('should filter error logs', () => {
    const { addLog, getErrorLogs } = useLogger()
    addLog('Info message', 'info')
    addLog('Error message', 'error')
    
    const errorLogs = getErrorLogs()
    expect(errorLogs.length).toBe(1)
    expect(errorLogs[0].message).toBe('Error message')
  })
})
