<template>
  <div class="container mt-4" style="max-width: 700px;">
    <div v-if="loading" class="text-secondary text-center py-4">
      Đang tải...
    </div>

    <div v-else-if="post" class="card shadow-sm border-primary">
      <div class="card-body">
        <h1 class="card-title display-6 mb-3 text-primary">{{ post.title }}</h1>
        
        <p class="text-muted mb-4">
          <span class="me-3">✍️ Tác giả: <strong>{{ post.author?.email }}</strong> ({{ post.author?.role }})</span>
          <span>📅 Ngày tạo: {{ formatDate(post.createdAt) }}</span>
        </p>

        <div class="card-text mb-4" style="white-space: pre-wrap;">
          {{ post.content }}
        </div>

        <div class="d-flex gap-3 align-items-center">
          <PostDeleteButton
            v-if="canDelete"
            :post-id="post._id"
            :redirect-after="true"
            class="btn btn-danger"
          />

          <PostLikeButton
            v-if="post"
            :post="post"
            :current-user-id="userId"
          />
        </div>

        <hr />

        <PostCommentSection
          :post="post"
          :post-id="post._id"
          @comment-submitted="refreshComments"
          class="mb-4"
        />

        <PostCommentList ref="commentList" />
      </div>
    </div>

    <div v-else class="alert alert-danger text-center mt-4">
      Không tìm thấy bài viết.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import PostDeleteButton from './PostDeleteButton.vue'
import PostCommentSection from './PostCommentSection.vue'
import PostLikeButton from './PostLikeButton.vue'
import PostCommentList from './PostCommentList.vue'

const route = useRoute()
const post = ref(null)
const loading = ref(true)

const userId = localStorage.getItem('userId')
const userRole = localStorage.getItem('role')

const canDelete = computed(() => {
  if (!post.value || !post.value.author) return false
  return post.value.author._id === userId || userRole === 'admin'
})

const commentList = ref(null)
const refreshComments = () => {
  commentList.value?.fetchComments()
}

const fetchPost = async () => {
  try {
    const { data } = await axios.get(`/posts/${route.params.id}`)
    post.value = data
  } catch (err) {
    console.error('Lỗi khi tải bài viết:', err)
    post.value = null
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString()
}

onMounted(() => {
  fetchPost()
})
</script>
