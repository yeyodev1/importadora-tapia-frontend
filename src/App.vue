<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
onMounted(() => userStore.hydrate())
</script>

<template>
  <RouterView />
</template>
