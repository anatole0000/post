<template>
  <div class="container mt-5" style="max-width: 400px;">
    <h2 class="mb-4 text-center text-primary fw-bold">Đăng ký tài khoản</h2>
    <form @submit.prevent="register" class="bg-light p-4 rounded shadow-sm">
      <div class="mb-3">
        <label for="email" class="form-label text-dark">Email</label>
        <input
          v-model="email"
          type="email"
          id="email"
          class="form-control"
          placeholder="Nhập email"
          required
        />
      </div>
      <div class="mb-3">
        <label for="password" class="form-label text-dark">Mật khẩu</label>
        <input
          v-model="password"
          type="password"
          id="password"
          class="form-control"
          placeholder="Nhập mật khẩu"
          required
        />
      </div>
      <button type="submit" class="btn btn-primary w-100">Đăng ký</button>
      <p class="text-danger mt-3 text-center" v-if="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

async function register() {
  error.value = ''
  try {
    const res = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại')

    router.push('/login')
  } catch (err) {
    error.value = err.message
  }
}
</script>
