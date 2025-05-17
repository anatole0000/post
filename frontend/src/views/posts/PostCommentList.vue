<template>
  <div class="mt-6">
    <h2 class="text-lg font-bold mb-2">💬 Bình luận</h2>
    <div v-if="comments.length === 0" class="text-gray-500">Chưa có bình luận nào.</div>
    <div v-for="comment in comments" :key="comment._id" class="border p-2 rounded mb-2">
      <p>{{ comment.content }}</p>
      <p class="text-sm text-gray-500">
        Bởi: {{ comment.author?.email || 'Ẩn danh' }} | {{ formatDate(comment.createdAt) }}
      </p>
      <div v-if="canEdit(comment)" class="flex gap-2 mt-1">
        <button @click="editComment(comment)" class="text-blue-500 text-sm">Sửa</button>
        <button @click="deleteComment(comment._id)" class="text-red-500 text-sm">Xoá</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'



import { onUnmounted } from 'vue'
import { io } from 'socket.io-client'

const comments = ref([])
const route = useRoute()
const userStore = useUserStore()
console.log(userStore.user?.email)
const socket = io()

const fetchComments = async () => {
  try {
    const { data } = await axios.get(`/posts/${route.params.id}/comments`)
    comments.value = data
  } catch (err) {
    console.error('Lỗi khi tải bình luận', err)
  }
}

onMounted(fetchComments)

const formatDate = (date) => new Date(date).toLocaleString()

const canEdit = (comment) => {
  return comment.author?._id === userStore.user?._id || userStore.user?.role === 'admin'
}

const editComment = async (comment) => {
  const content = prompt('Sửa bình luận:', comment.content)
  if (!content) return
  try {
    const { data } = await axios.put(`/posts/${route.params.id}/comments/${comment._id}`, { content })
    comment.content = data.comment.content
  } catch (err) {
    alert('Lỗi khi sửa bình luận')
  }
}

const deleteComment = async (commentId) => {
  if (!confirm('Xác nhận xoá bình luận?')) return
  try {
    await axios.delete(`/posts/${route.params.id}/comments/${commentId}`)
    comments.value = comments.value.filter(c => c._id !== commentId)
  } catch (err) {
    alert('Lỗi khi xoá bình luận')
  }
}

socket.on('new_comment', (data) => {
  if (data.postId === route.params.id) {
    fetchComments()
  }
})

onUnmounted(() => {
  socket.disconnect()
})

defineExpose({ fetchComments }) // để cha gọi lại khi cần (như sau khi thêm mới)
</script>
