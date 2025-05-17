<template>
  <div class="mt-6">
    <h2 class="text-xl font-semibold mb-2">💬 Bình luận</h2>

    <div v-if="!token" class="text-gray-500 italic mb-4">
      Bạn cần <router-link to="/login" class="text-blue-500">đăng nhập</router-link> để bình luận.
    </div>

    <div v-else class="mb-4">
      <textarea v-model="commentContent" rows="3" class="w-full p-2 border rounded mb-2" placeholder="Nhập bình luận..."></textarea>
      <button @click="submitComment" :disabled="submitting" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Gửi
      </button>
      <div v-if="error" class="text-red-500 mt-1">{{ error }}</div>
    </div>

    <div v-if="post.comments?.length">
      <div v-for="(c, i) in post.comments" :key="i" class="border-t pt-2 mt-2">
        <p class="text-sm text-gray-600">
          {{ c.author?.email }} ({{ c.author?.role }}) - {{ formatDate(c.createdAt) }}
        </p>
        <p class="text-base whitespace-pre-wrap">{{ c.content }}</p>
      </div>
    </div>
    <div v-else class="text-gray-500">Chưa có bình luận nào.</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import { inject } from 'vue'

const props = defineProps({
  post: Object,
  postId: String
})

const commentContent = ref('')
const submitting = ref(false)
const error = ref('')
const token = localStorage.getItem('token')
const emit = defineEmits(['comment-submitted'])

const submitComment = async () => {
  if (!commentContent.value.trim()) {
    error.value = 'Nội dung bình luận không được để trống.'
    return
  }

  submitting.value = true
  error.value = ''

  try {
    const { data } = await axios.post(
      `/posts/${props.postId}/comments`,
      { content: commentContent.value },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    props.post.comments = data.comments || data.post?.comments || [] // fallback
    commentContent.value = ''
    emit('comment-submitted')
  } catch (err) {
    console.error('Lỗi gửi bình luận:', err)
    error.value = 'Không thể gửi bình luận.'
  } finally {
    submitting.value = false
  }
}

function formatDate(date) {
  return new Date(date).toLocaleString()
}
</script>
