<template>
  <div class="flex h-screen">
    <ChatUserList
      @select="handleUserSelect"
      :selectedUser="selectedUser"
    />
    <ChatWindow
      v-if="selectedUser"
      :user="selectedUser"
      :messages="messages"
      @send="handleSendMessage"
    />
    <div v-else class="flex-1 flex items-center justify-center text-gray-400">
      Chọn một người dùng để bắt đầu trò chuyện
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import ChatUserList from '@/components/ChatUserList.vue'
import ChatWindow from '@/components/ChatWindow.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const selectedUser = ref(null)
const messages = ref([])
const loadingMessages = ref(false)
const errorMessage = ref(null)

const handleUserSelect = async (user) => {
  selectedUser.value = user
  messages.value = []
  errorMessage.value = null
  loadingMessages.value = true
  try {
    const res = await axios.get(`/messages/${user._id}`, {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })
    messages.value = res.data
  } catch (err) {
    console.error('Lỗi tải tin nhắn:', err)
    errorMessage.value = 'Không thể tải tin nhắn. Vui lòng thử lại.'
  } finally {
    loadingMessages.value = false
  }
}

const handleSendMessage = async (content) => {
  try {
    const res = await axios.post(
      '/messages',
      {
        recipient: selectedUser.value._id,
        content,
      },
      {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      }
    )
    messages.value.push(res.data)
  } catch (err) {
    console.error(err)
  }
}
</script>
