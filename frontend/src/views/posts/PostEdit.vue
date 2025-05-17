<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">🛠️ Chỉnh sửa bài viết</h1>
    <form @submit.prevent="updatePost" class="space-y-4 max-w-2xl">
      <input
        v-model="title"
        class="w-full border p-2 rounded"
        placeholder="Tiêu đề"
      />
      <textarea
        v-model="content"
        class="w-full border p-2 rounded min-h-[200px]"
        placeholder="Nội dung"
      ></textarea>
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        :disabled="loading"
      >
        {{ loading ? 'Đang lưu...' : 'Lưu chỉnh sửa' }}
      </button>
      <p v-if="successMessage" class="text-green-600">{{ successMessage }}</p>
      <p v-if="errorMessage" class="text-red-600">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const postId = route.params.id

const title = ref('')
const content = ref('')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const fetchPost = async () => {
  try {
    const { data } = await axios.get(`/posts/${postId}`)
    title.value = data.title
    content.value = data.content
  } catch (err) {
    errorMessage.value = 'Không thể tải bài viết.'
    console.error(err)
  }
}

const updatePost = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''
  try {
    const token = localStorage.getItem('token')
    await axios.put(
      `/posts/edit/${postId}`,
      { title: title.value, content: content.value },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    successMessage.value = 'Bài viết đã được chỉnh sửa và chờ duyệt lại.'
  } catch (err) {
    errorMessage.value = 'Lỗi khi lưu bài viết.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchPost)
</script>
