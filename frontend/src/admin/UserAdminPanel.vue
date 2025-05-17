<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Quản lý người dùng</h1>

    <!-- Tìm kiếm -->
    <div class="mb-4 flex gap-2">
      <input
        v-model="searchQuery"
        @keyup.enter="fetchUsers"
        placeholder="Tìm theo email..."
        class="border px-3 py-1 rounded w-64"
      />
      <button @click="fetchUsers" class="bg-blue-600 text-white px-4 py-1 rounded">
        Tìm
      </button>
    </div>

    <!-- Danh sách người dùng -->
    <div v-if="users.length">
      <table class="w-full table-auto border">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-2 border">Email</th>
            <th class="p-2 border">Role</th>
            <th class="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user._id">
            <td class="border px-2 py-1">{{ user.email }}</td>
            <td class="border px-2 py-1">
              <select v-model="user.role" @change="updateRole(user)">
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="moderator">moderator</option>
              </select>
            </td>
            <td class="border px-2 py-1">
              <button @click="viewUser(user._id)" class="text-blue-600 mr-2">Chi tiết</button>
              <button
                @click="deleteUser(user._id)"
                class="text-red-600"
                :disabled="user._id === currentUserId"
              >
                Xoá
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>Không tìm thấy người dùng nào</div>

    <!-- Phân trang -->
    <div class="mt-4 flex gap-2">
      <button
        @click="prevPage"
        :disabled="currentPage === 1"
        class="px-3 py-1 bg-gray-300 rounded"
      >
        Trước
      </button>
      <span>Trang {{ currentPage }} / {{ totalPages }}</span>
      <button
        @click="nextPage"
        :disabled="currentPage === totalPages"
        class="px-3 py-1 bg-gray-300 rounded"
      >
        Sau
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const token = userStore.token
const currentUserId = userStore.user?._id || ''
const users = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const searchQuery = ref('')
const router = useRouter()

const fetchUsers = async () => {
  try {
    const res = await axios.get('/users/admin', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: searchQuery.value,
        page: currentPage.value,
        limit: 10
      }
    })
    users.value = res.data.users
    totalPages.value = res.data.totalPages
  } catch (err) {
    console.error(err)
  }
}

const viewUser = (id) => {
  router.push(`/admin/users/${id}`)
}

const updateRole = async (user) => {
  try {
    await axios.put(`/users/admin/${user._id}`, { role: user.role }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    alert('Đã cập nhật role')
  } catch (err) {
    console.error(err)
    alert('Cập nhật thất bại')
  }
}

const deleteUser = async (id) => {
  if (!confirm('Bạn có chắc muốn xoá user này?')) return

  try {
    await axios.delete(`/users/admin/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    users.value = users.value.filter(u => u._id !== id)
    alert('Đã xoá user')
  } catch (err) {
    console.error(err)
    alert('Xoá thất bại')
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchUsers()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchUsers()
  }
}

onMounted(fetchUsers)
</script>
