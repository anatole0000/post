<template>
  <div class="p-6 bg-gray-100 min-h-screen">
    <h1 class="text-3xl font-bold text-blue-900 mb-6">Quản lý bài viết (Admin)</h1>

    <!-- Danh sách bài viết -->
    <div v-if="posts.length" class="space-y-4">
      <div
        v-for="post in posts"
        :key="post._id"
        class="bg-white shadow-md rounded-lg p-4 flex justify-between items-start border border-blue-200"
      >
        <div class="flex-1">
          <h2 class="text-xl font-semibold text-blue-800 mb-1">{{ post.title }}</h2>
          <p class="text-sm text-gray-700">{{ post.content }}</p>
        </div>
        <div class="ml-4 space-x-2 mt-2">
          <button @click="editPost(post)" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded transition">
            ✏️ Sửa
          </button>
          <button @click="deletePost(post._id)" class="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded transition">
            🗑️ Xoá
          </button>
        </div>
      </div>

      <!-- Phân trang -->
      <div class="mt-6 flex items-center space-x-4 justify-center">
        <button
          :disabled="page === 1"
          @click="page-- && fetchPosts()"
          class="px-4 py-1 rounded bg-blue-500 text-white disabled:opacity-50"
        >
          ◀ Trang trước
        </button>
        <span class="text-blue-900 font-medium">Trang {{ page }} / {{ totalPages }}</span>
        <button
          :disabled="page === totalPages"
          @click="page++ && fetchPosts()"
          class="px-4 py-1 rounded bg-blue-500 text-white disabled:opacity-50"
        >
          Trang sau ▶
        </button>
      </div>
    </div>

    <div v-else class="text-gray-600 text-center mt-8">Không có bài viết nào</div>

    <!-- Form sửa bài viết -->
    <div v-if="editingPost" class="mt-10 p-6 bg-white rounded-lg shadow border border-blue-300">
      <h2 class="text-2xl font-bold text-blue-800 mb-4">✍️ Chỉnh sửa bài viết</h2>
      <input
        v-model="editingPost.title"
        class="border border-gray-300 focus:border-blue-500 focus:ring-blue-300 p-2 rounded w-full mb-3"
        placeholder="Tiêu đề"
      />
      <textarea
        v-model="editingPost.content"
        class="border border-gray-300 focus:border-blue-500 focus:ring-blue-300 p-2 rounded w-full mb-4"
        placeholder="Nội dung"
        rows="5"
      />
      <div class="space-x-3">
        <button @click="submitEdit" class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded transition">
          💾 Lưu
        </button>
        <button @click="cancelEdit" class="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded transition">
          ❌ Hủy
        </button>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const token = userStore.token

const posts = ref([])
const page = ref(1)
const totalPages = ref(1)

const editingPost = ref(null)

const fetchPosts = async () => {
  try {
    const res = await axios.get(`/admin/posts?page=${page.value}&limit=5`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    posts.value = res.data.posts
    totalPages.value = res.data.totalPages
  } catch (err) {
    console.error('Fetch posts error:', err)
  }
}

const deletePost = async (postId) => {
  if (!confirm('Xoá bài viết này?')) return

  try {
    await axios.delete(`/admin/posts/${postId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    fetchPosts()
  } catch (err) {
    console.error('Delete post error:', err)
  }
}

const editPost = (post) => {
  editingPost.value = { ...post } // sao chép để không ảnh hưởng gốc
}

const cancelEdit = () => {
  editingPost.value = null
}

const submitEdit = async () => {
  try {
    const { _id, title, content } = editingPost.value
    await axios.put(`/admin/posts/${_id}`, { title, content }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    editingPost.value = null
    fetchPosts()
  } catch (err) {
    console.error('Update post error:', err)
  }
}

onMounted(fetchPosts)
</script>
