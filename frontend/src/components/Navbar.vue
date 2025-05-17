<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
    <router-link
      v-if="isLoggedIn"
      to="/chat"
      class="chat-button"
    >
      💬 Chat
    </router-link>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.loadFromStorage()
})

const isLoggedIn = computed(() => !!userStore.token)
</script>

<style scoped>
.chat-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #3b82f6; /* blue-500 */
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px; /* rounded-full */
  box-shadow: 0 6px 15px rgba(59, 130, 246, 0.7);
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
  animation: pulse 2.5s infinite;
  transition: background-color 0.3s ease;
}

.chat-button:hover {
  background-color: #2563eb; /* blue-600 */
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 6px 15px rgba(59, 130, 246, 0.7);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 1);
  }
}
</style>
