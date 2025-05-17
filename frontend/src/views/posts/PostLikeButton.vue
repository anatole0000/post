<template>
  <button
    @click="toggleLike"
    :disabled="loading"
    class="px-3 py-1 border rounded text-sm"
    :class="isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'"
  >
    ❤️ {{ likesCount }} {{ isLiked ? 'Đã thích' : 'Thích' }}
  </button>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import axios from 'axios'

const props = defineProps({
  post: Object, // chứa cả likes[] và _id
  currentUserId: String,
})

const likesCount = ref(props.post.likes?.length || 0)
const isLiked = ref(false)
const loading = ref(false)

watchEffect(() => {
  if (props.post?.likes && props.currentUserId) {
    isLiked.value = props.post.likes.includes(props.currentUserId)
    likesCount.value = props.post.likes.length
  }
})

const toggleLike = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const { data } = await axios.post(
      `/posts/${props.post._id}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    likesCount.value = data.likesCount
    isLiked.value = !isLiked.value
  } catch (err) {
    console.error('Lỗi like bài viết:', err)
    alert('Bạn cần đăng nhập để thích bài viết.')
  } finally {
    loading.value = false
  }
}

</script>
