<template>
  <div class="p-6">
    <h2 class="text-2xl font-semibold mb-4">Chi tiết người dùng</h2>

    <div v-if="user">
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>Role:</strong> {{ user.role }}</p>
      <p><strong>ID:</strong> {{ user._id }}</p>
      <p><strong>Ngày tạo:</strong> {{ new Date(user.createdAt).toLocaleString() }}</p>

      <div class="mt-4">
        <button @click="goBack" class="bg-gray-300 px-4 py-2 rounded">← Quay lại</button>
      </div>
    </div>

    <div v-else-if="loading">
      <p>Đang tải...</p>
    </div>

    <div v-else>
      <p class="text-red-600">Không tìm thấy người dùng</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const token = userStore.token

const user = ref(null)
const loading = ref(true)

const fetchUser = async () => {
  try {
    const res = await axios.get(`/users/admin/${route.params.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    user.value = res.data
  } catch (err) {
    console.error(err)
    user.value = null
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(fetchUser)
</script>
