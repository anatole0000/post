<template>
  <div class="flex-1 flex flex-col p-4 bg-gray-50">
    <!-- Header -->
    <div class="border-b pb-2 mb-4 flex items-center gap-3">
      <div
        class="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg"
        :title="user.email"
      >
        {{ user.email.charAt(0).toUpperCase() }}
      </div>
      <h3 class="text-xl font-semibold">{{ user.email }}</h3>
    </div>

    <!-- Messages -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto mb-2 space-y-4">
      <template v-for="(group, index) in groupedMessages" :key="index">
        <div class="text-center text-gray-400 text-sm mb-2">
          {{ group.date }}
        </div>
        <div
          v-for="msg in group.messages"
          :key="msg._id"
          :class="msg.sender === currentUserId ? 'text-right' : 'text-left'"
        >
          <span
            :class="[ 
              'inline-block px-4 py-2 rounded-2xl max-w-xs break-words',
              msg.sender === currentUserId
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-gray-300 text-gray-900 rounded-bl-none',
            ]"
          >
            {{ msg.content }}
          </span>
          <div class="text-xs text-gray-400 mt-1">
            {{ formatTime(msg.createdAt) }}
          </div>
        </div>
      </template>

      <!-- Typing indicator -->
      <div v-if="isTyping" class="text-sm text-gray-500 italic">
        {{ user.email }} đang nhập...
      </div>
    </div>

    <!-- Input -->
    <form @submit.prevent="send" class="flex gap-2 mt-2">
      <input
        v-model="newMessage"
        class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Type a message..."
        autocomplete="off"
      />
      <button
        type="submit"
        class="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
        :disabled="!newMessage.trim()"
      >
        Send
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import io from 'socket.io-client'

const props = defineProps({
  user: Object,
  messages: Array,
})

const emit = defineEmits(['send'])
const userStore = useUserStore()
const currentUserId = computed(() => userStore.user?._id || '')

const newMessage = ref('')
const isTyping = ref(false)

// Kết nối socket
const socket = io('http://localhost:3000') // chỉnh lại nếu backend port khác

onMounted(() => {
  if (currentUserId.value) {
    socket.emit('register', currentUserId.value)
  }

  socket.on('typing', ({ from }) => {
    if (from === props.user._id) {
      isTyping.value = true
      clearTimeout(typingTimer)
      typingTimer = setTimeout(() => {
        isTyping.value = false
      }, 1500)
    }
  })
})

onUnmounted(() => {
  socket.disconnect()
})

// Emit typing khi đang gõ
let typingTimer
watch(newMessage, (val) => {
  if (val.trim()) {
    socket.emit('typing', {
      from: currentUserId.value,
      to: props.user._id,
    })
  }
})

// Scroll to bottom when new message
const messagesContainer = ref(null)
watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }
)

// Format giờ phút
function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Gom tin nhắn theo ngày
const groupedMessages = computed(() => {
  const groups = []
  let lastDate = null

  props.messages.forEach((msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString()
    if (date !== lastDate) {
      groups.push({
        date,
        messages: [msg],
      })
      lastDate = date
    } else {
      groups[groups.length - 1].messages.push(msg)
    }
  })

  return groups
})

// Gửi tin nhắn
function send() {
  if (newMessage.value.trim()) {
    emit('send', newMessage.value.trim())
    newMessage.value = ''
  }
}
</script>
