<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">🔍 Tìm kiếm bài viết</h1>

    <!-- Form tìm kiếm -->
    <form @submit.prevent="searchPosts" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <input v-model="keyword" placeholder="Từ khóa" class="p-2 border rounded" />
      <input v-model="author" placeholder="Tác giả ID" class="p-2 border rounded" />
      <input v-model="category" placeholder="Chuyên mục" class="p-2 border rounded" />
      <input v-model="status" placeholder="Trạng thái" class="p-2 border rounded" />
      <input v-model="from" type="date" class="p-2 border rounded" />
      <input v-model="to" type="date" class="p-2 border rounded" />
      <button type="submit" class="col-span-1 md:col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        Tìm kiếm
      </button>
    </form>

    <!-- Kết quả -->
    <div v-if="results.length">
      <div
        v-for="post in results"
        :key="post._id"
        class="mb-4 p-4 border rounded shadow-sm"
      >
        <h2 class="text-lg font-semibold">{{ post.title }}</h2>
        <p class="text-gray-500 text-sm">
          Tác giả: {{ post.author?.email }} | Vai trò: {{ post.author?.role }}<br />
          Ngày tạo: {{ formatDate(post.createdAt) }}
        </p>
        <router-link :to="`/posts/${post._id}`" class="text-blue-600 hover:underline">
          Xem chi tiết
        </router-link>
      </div>

      <!-- Phân trang -->
      <div class="flex items-center gap-2 mt-4">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage <= 1" class="px-3 py-1 border rounded bg-gray-100">
          ◀ Trước
        </button>
        <span>Trang {{ currentPage }} / {{ totalPages }}</span>
        <button @click="changePage(currentPage + 1)" :disabled="currentPage >= totalPages" class="px-3 py-1 border rounded bg-gray-100">
          Sau ▶
        </button>
      </div>
    </div>

    <div v-else-if="searched" class="text-gray-500">Không tìm thấy bài viết nào.</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const keyword = ref('')
const author = ref('')
const category = ref('')
const status = ref('')
const from = ref('')
const to = ref('')

const results = ref([])       // khai báo results
const searched = ref(false)   // để hiển thị khi chưa tìm hoặc không tìm thấy

const emit = defineEmits(['search'])

const searchPosts = () => {
  const params = {}
  if (keyword.value) params.keyword = keyword.value
  if (author.value) params.author = author.value
  if (category.value) params.category = category.value
  if (status.value) params.status = status.value
  if (from.value) params.from = from.value
  if (to.value) params.to = to.value

  emit('search', params)
  searched.value = true
}
</script>



