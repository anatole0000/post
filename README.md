# 🧠 Forum Backend API

A full-featured backend for a forum application, built with **Node.js**, **Express**, and **MongoDB**. Includes:

- ✅ User authentication with JWT
- ✅ Role-based access control with admin able to promote users (roles: user, admin, moderator, editor)
- ✅ Post creation, update, delete, search
- ✅ Comment system
- ✅ Like/Unlike posts
- ✅ Follow/Unfollow users 
- ✅ Content moderation
- ✅ Full integration testing with Jest + Supertest

---

### Frontend
- Vue 3 + Composition API
- Vue Router
- Pinia (state management)
- TailwindCSS

## 📦 Tech Stack

- **Node.js**, **Express**
- **MongoDB** with **Mongoose**
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Jest** + **Supertest** for testing
- **Dotenv** for environment config

---

## 🚀 Getting Started

### 1. Clone project

```bash
git clone https://github.com/anatole0000/post.git
cd post
cd backend
cd frontend

npm install
npm test
node server.js
