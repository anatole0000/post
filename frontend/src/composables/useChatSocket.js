// composables/useChatSocket.js
import { io } from 'socket.io-client'
import { onUnmounted } from 'vue'

export function useChatSocket(currentUserId, onTypingCallback) {
  const socket = io('http://localhost:3000')

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
    if (currentUserId.value) {
      socket.emit('register', currentUserId.value)
    }
  })

  socket.on('typing', onTypingCallback)

  onUnmounted(() => {
    socket.disconnect()
  })

  return {
    socket
  }
}
