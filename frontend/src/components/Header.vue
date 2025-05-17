<template>
  <nav class="header-nav">
    <h1 class="header-title">📝 My Blog</h1>
    <div>
      <RouterLink to="/" class="nav-link">Trang chủ</RouterLink>
      <RouterLink v-if="isLoggedIn" to="/create-post" class="nav-link">Tạo bài viết mới</RouterLink>
      <RouterLink v-if="isLoggedIn" to="/users" class="nav-link">Người dùng</RouterLink>

      
      <!-- Link quản lý bài viết chỉ dành cho admin -->
      <RouterLink v-if="isAdmin" to="/admin/posts" class="nav-link">Quản lý bài viết</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/users" class="nav-link">Quản lý người dùng</RouterLink>
      
      <RouterLink v-if="!isLoggedIn" to="/login" class="nav-link">Đăng nhập</RouterLink>
      <RouterLink v-if="!isLoggedIn" to="/register" class="nav-link">Đăng ký</RouterLink>
      <button
        v-if="isLoggedIn"
        @click="logout"
        class="logout-btn"
      >
        Đăng xuất
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const isLoggedIn = computed(() => !!userStore.token)
const isAdmin = computed(() => userStore.user?.role === 'admin')

function logout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.header-nav {
  background-color: #003366; /* xanh da trời đậm */
  color: white;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title {
  font-weight: 700;
  font-size: 1.8rem;
}
.nav-link {
  margin-right: 1rem;
  color: white;
  text-decoration: none;
  transition: color 0.3s ease;
}
.nav-link:hover {
  color: #a0d8ef;
}
.nav-link.router-link-active {
  font-weight: bold;
  text-decoration: underline;
}
.logout-btn {
  margin-left: 1rem;
  padding: 0.3rem 0.8rem;
  background-color: #cc0000;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}
.logout-btn:hover {
  background-color: #990000;
}
</style>
