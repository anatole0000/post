// src/stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,  // { _id, email, role }
    token: null,
  }),
  actions: {
    setUser(user, token) {
      this.user = user
      this.token = token
      localStorage.setItem('token', token)
      localStorage.setItem('userId', user._id)
      localStorage.setItem('role', user.role)
      localStorage.setItem('email', user.email)
    },
    loadFromStorage() {
      const token = localStorage.getItem('token')
      const _id = localStorage.getItem('userId')
      const role = localStorage.getItem('role')
      const email = localStorage.getItem('email')
      if (token && _id && role) {
        this.token = token
        this.user = { _id, role, email } // email không có thì để sau
      }
    },
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('role')
    },
  },
})
