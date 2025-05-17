<template>
  <div class="min-h-screen flex flex-col bg-gray-50 text-gray-900">
    <Header />
    <main class="flex-grow p-6">
      <router-view />
    </main>
    <Navbar />
    <Footer />
  </div>
</template>

<script setup>
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import Navbar from './components/Navbar.vue'
</script>

<style></style>
