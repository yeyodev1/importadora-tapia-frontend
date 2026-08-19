<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import UpdateBanner from '@/components/ui/UpdateBanner.vue'

const userStore = useUserStore()
onMounted(() => userStore.hydrate())
</script>

<template>
  <UpdateBanner />
  <RouterView />
</template>
