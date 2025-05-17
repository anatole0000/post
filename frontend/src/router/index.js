import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'  // <-- nhớ import này

import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Home from '../views/Home.vue'
import PostsList from '../views/posts/PostsList.vue'
import PostDetail from '../views/posts/PostDetail.vue'
import PostEdit from '../views/posts/PostEdit.vue'
import PostCreate from '../views/posts/PostCreate.vue'
import PostSearch from '../views/posts/PostSearch.vue'
import PostComments from '../views/posts/PostCommentSection.vue'
import ChatPage from '../pages/ChatPage.vue'
import AdminPostManager from '../admin/AdminPostManager.vue'
import UserList from '../user/UserList.vue'

const routes = [
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/', component: Home },
  { path: '/posts', name: 'PostsList', component: PostsList },
  { path: '/posts/search', name: 'PostSearch', component: PostSearch },
  { path: '/posts/:id', name: 'PostDetail', component: PostDetail, props: true },
  { path: '/posts/:id/edit', name: 'PostEdit', component: PostEdit, props: true },
  { path: '/posts/:id/request-edit', name: 'PostRequestEdit', component: PostEdit, props: true },
  { path: '/create-post', name: 'PostCreate', component: PostCreate },
  { path: '/posts/:id/comments', name: 'PostComments', component: PostComments, props: true },
  { path: '/chat', name: 'ChatPage', component: ChatPage },
  { path: '/admin/posts', name: 'AdminPostManager', component: AdminPostManager, meta: { requiresAdmin: true } },
  { path: '/users', name: 'UserList', component: UserList },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  console.log('Token:', userStore.token)
  console.log('User:', userStore.user)

  const isAdmin = userStore.user?.role === 'admin'
  

  if (to.meta.requiresAdmin && !isAdmin) {
    return next('/')
  }
  next()
})

export default router
