<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Danh sách người dùng</h1>
    <div v-if="users.length">
      <div
        v-for="user in users"
        :key="user._id"
        class="border p-3 rounded mb-2 flex justify-between items-center"
      >
        <div>
          <p class="font-semibold">{{ user.email }}</p>
          <p class="text-sm text-gray-500">Followers: {{ user.followers ? user.followers.length : 0 }}</p>
        </div>
        <button
          @click="toggleFollow(user)"
          class="px-3 py-1 rounded text-white"
          :class="isFollowing(user) ? 'bg-red-500' : 'bg-blue-500'"
        >
          {{ isFollowing(user) ? 'Unfollow' : 'Follow' }}
        </button>
      </div>
    </div>
    <div v-else>Không có người dùng nào</div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const token = userStore.token
const currentUser = ref(userStore.user)

const users = ref([])

const fetchUsers = async () => {
  try {
    const res = await axios.get('/users', {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (currentUser.value && currentUser.value._id) {
      users.value = res.data.filter(u => u._id !== currentUser.value._id)
    } else {
      users.value = res.data
    }
  } catch (err) {
    console.error(err)
  }
}

const isFollowing = (user) => {
  return currentUser.value?.following?.includes(user._id)
}

const toggleFollow = async (user) => {
  try {
    const res = await axios.post(`/users/${user._id}/follow`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })

    // refetch lại user hiện tại
    const updatedUser = await axios.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    currentUser.value = updatedUser.data

    // cập nhật followers của user kia
    if (isFollowing(user)) {
      user.followers.push(currentUser.value._id)
    } else {
      user.followers = user.followers.filter(id => id !== currentUser.value._id)
    }

    console.log(res.data.message)
  } catch (err) {
    console.error('Follow error:', err)
  }
}

onMounted(fetchUsers)
</script>
