<template>
  <div class="max-w-sm mx-auto mt-16 p-8 bg-white rounded-lg shadow-lg">
    <h2 class="text-3xl font-semibold mb-6 text-center text-blue-700">Đăng nhập</h2>
    <form @submit.prevent="login" class="flex flex-col gap-4">
      <input
        v-model="email"
        placeholder="Email"
        type="email"
        class="input-field"
        required
      />
      <input
        v-model="password"
        type="password"
        placeholder="Mật khẩu"
        class="input-field"
        required
      />
      <button type="submit" class="btn-primary">Đăng nhập</button>
    </form>
    <p class="text-red-600 mt-4 text-center" v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const userStore = useUserStore()

async function login() {
  error.value = ''
  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại')

    userStore.setUser(data.user, data.token)
    router.push('/')
  } catch (err) {
    error.value = err.message
  }
}
</script>

<style scoped>
.input-field {
  padding: 0.75rem 1rem;
  border: 2px solid #3b82f6; /* blue-500 */
  border-radius: 0.5rem;
  font-size: 1rem;
  outline-offset: 2px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.input-field:focus {
  border-color: #2563eb; /* blue-600 */
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.4);
}

.btn-primary {
  background-color: #3b82f6; /* blue-500 */
  color: white;
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.btn-primary:hover {
  background-color: #2563eb; /* blue-600 */
}
</style>
