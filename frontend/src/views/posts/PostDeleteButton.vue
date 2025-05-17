<template>
  <button
    @click="handleDelete"
    class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
  >
    🗑️ Xóa bài viết
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router'
import axios from 'axios'
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  postId: {
    type: String,
    required: true
  },
  redirectAfter: {
    type: Boolean,
    default: false // nếu true thì redirect sau khi xóa
  }
})

const emit = defineEmits(['deleted'])

const router = useRouter()

const handleDelete = async () => {
  if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return

  try {
    const token = localStorage.getItem('token')
    await axios.delete(`/posts/${props.postId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    alert('✅ Bài viết đã được xóa.')

    emit('deleted') // cho parent biết đã xóa (tuỳ mục đích)
    if (props.redirectAfter) router.push('/')
  } catch (err) {
    console.error(err)
    alert('❌ Không thể xóa bài viết.')
  }
}
</script>
