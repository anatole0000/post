<template>
  <div class="container mt-4">
    <h1 class="h4 fw-bold mb-4">📋 Danh sách bài viết</h1>

    <!-- Nhúng form tìm kiếm -->
    <PostSearch @search="handleSearch" />

    <!-- Danh sách bài viết -->
    <div v-if="loading" class="text-center mt-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else>
      <div
        v-for="post in posts"
        :key="post._id"
        class="card mb-3 shadow-sm"
      >
        <div class="card-body">
          <h5 class="card-title">{{ post.title }}</h5>
          <h6 class="card-subtitle mb-2 text-muted">
            Tác giả: {{ post.author?.email }} - Vai trò: {{ post.author?.role }}
          </h6>
          <router-link :to="`/posts/${post._id}`" class="card-link text-decoration-none">
            Xem chi tiết
          </router-link>
        </div>
      </div>

      <!-- Phân trang -->
      <nav class="d-flex justify-content-center align-items-center mt-4 gap-2">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage <= 1"
          class="btn btn-outline-secondary btn-sm"
        >
          ◀ Trước
        </button>

        <span class="px-2">Trang {{ currentPage }} / {{ totalPages }}</span>

        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage >= totalPages"
          class="btn btn-outline-secondary btn-sm"
        >
          Sau ▶
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import PostSearch from './PostSearch.vue'

const posts = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const loading = ref(false)
const searchParams = ref(null)

const fetchPosts = async (page = 1) => {
  loading.value = true
  try {
    let url = `/posts?page=${page}&limit=5`
    if (searchParams.value) {
      const query = new URLSearchParams({ ...searchParams.value, page, limit: 5 })
      url = `/posts/search?${query.toString()}`
    }

    const { data } = await axios.get(url)
    posts.value = data.posts
    currentPage.value = data.currentPage || page
    totalPages.value = data.totalPages || 1
  } catch (err) {
    console.error('Lỗi khi tải bài viết:', err)
    alert('Không thể tải danh sách bài viết.')
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    fetchPosts(page)
  }
}

const handleSearch = (params) => {
  searchParams.value = params
  fetchPosts(1)
}

onMounted(() => {
  fetchPosts()
})
</script>
