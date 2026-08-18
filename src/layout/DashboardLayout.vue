<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
import AppTopbar from './components/AppTopbar.vue'
import ErpStatusBanner from './components/ErpStatusBanner.vue'
import { useUserStore } from '@/stores/user'
import { useSystemStore } from '@/stores/system'

const sidebarOpen = ref(false)
const router = useRouter()
const userStore = useUserStore()
const system = useSystemStore()

let estadoTimer: number | undefined

/** Sesión expirada (401 del backend): limpiar y volver al login. */
function onTokenExpired() {
  userStore.clear()
  router.push('/login')
}

onMounted(() => {
  userStore.hydrate()
  window.addEventListener('auth:token-expired', onTokenExpired)
  // Verifica el estado del ERP al entrar y cada 60 segundos.
  system.check()
  estadoTimer = window.setInterval(() => system.check(), 60000)
})

onBeforeUnmount(() => {
  window.removeEventListener('auth:token-expired', onTokenExpired)
  if (estadoTimer) window.clearInterval(estadoTimer)
})
</script>

<template>
  <div class="layout">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="layout__main">
      <AppTopbar @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <ErpStatusBanner />

      <main class="layout__content">
        <RouterView v-slot="{ Component }">
          <transition name="route" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.layout {
  min-height: 100vh;

  &__main {
    display: flex;
    flex-direction: column;
    min-height: 100vh;

    @media (min-width: 961px) {
      margin-left: var(--sidebar-width);
    }
  }

  &__content {
    flex: 1;
    padding: 24px;
    max-width: 1280px;
    width: 100%;
    margin: 0 auto;

    @media (max-width: 640px) {
      padding: 16px;
    }
  }
}
</style>
