<template>
  <div class="w-1/4 border-r p-4 overflow-y-auto h-full flex flex-col">
    <h2 class="text-xl font-semibold mb-4">Users</h2>

    <div v-if="loading" class="text-center text-gray-500">Loading users...</div>

    <ul v-else class="flex-1 overflow-auto space-y-2">
      <li
        v-for="user in users"
        :key="user._id"
        @click="select(user)"
        :class="[
          'flex items-center gap-3 cursor-pointer p-2 rounded transition-colors',
          user._id === selectedUser?._id
            ? 'bg-blue-200 font-semibold'
            : 'hover:bg-blue-100',
        ]"
      >
        <div
          class="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center font-bold"
          :title="user.email"
        >
          {{ user.email.charAt(0).toUpperCase() }}
        </div>
        <span class="truncate">{{ user.email }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  selectedUser: Object,
})

const emit = defineEmits(['select'])

const userStore = useUserStore()
const users = ref([])
const loading = ref(false)

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await axios.get('/users', {
      headers: {
        Authorization: `Bearer ${userStore.token}`,
      },
    })
    const currentUserId = userStore.user?._id
    users.value = res.data.filter((u) => u._id !== currentUserId)
  } catch (err) {
    console.error('Fetch users error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (userStore.user) {
    fetchUsers()
  } else {
    const unwatch = watch(
      () => userStore.user,
      (newUser) => {
        if (newUser) {
          fetchUsers()
          unwatch()
        }
      }
    )
  }
})

function select(user) {
  emit('select', user)
}
</script>
