<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Tạo bài viết mới</h1>
    <form @submit.prevent="submitPost" class="space-y-4 max-w-lg">
      <input
        v-model="title"
        placeholder="Tiêu đề"
        class="w-full border p-2 rounded"
        required
      />
      <textarea
        v-model="content"
        placeholder="Nội dung"
        class="w-full border p-2 rounded h-40"
        required
      ></textarea>
      <button
        type="submit"
        class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Đăng bài
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const title = ref('')
const content = ref('')

const submitPost = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    alert('Bạn cần đăng nhập để tạo bài viết')
    router.push('/login')
    return
  }

  try {
    await axios.post(
      '/posts',
      { title: title.value, content: content.value },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    alert('Tạo bài viết thành công')
    router.push('/posts')
  } catch (error) {
    if (error.response?.status === 401) {
      alert('Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.')
      router.push('/login')
    } else if (error.response?.data?.message) {
      alert(`Lỗi: ${error.response.data.message}`)
    } else {
      alert('Lỗi không xác định khi tạo bài viết')
    }
    console.error(error)
  }
}
</script>

<style scoped>
/* Bạn có thể thêm style ở đây nếu cần */
</style>
