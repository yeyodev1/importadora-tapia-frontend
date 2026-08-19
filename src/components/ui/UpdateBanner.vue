<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

/**
 * Aviso de nueva versión: compara el __BUILD_ID__ embebido en el bundle con
 * /version.json (que cambia en cada deploy). Si difieren, muestra un banner
 * fijo con botón para recargar. Chequea al volver a la pestaña y cada minuto.
 */
const hayNuevaVersion = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

async function checkVersion() {
  if (hayNuevaVersion.value) return
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return
    const { buildId } = await res.json()
    if (buildId && buildId !== __BUILD_ID__) hayNuevaVersion.value = true
  } catch {
    /* sin red o en dev: ignorar */
  }
}

function actualizar() {
  window.location.reload()
}

function onVisible() {
  if (document.visibilityState === 'visible') checkVersion()
}

onMounted(() => {
  if (!import.meta.env.PROD) return
  checkVersion()
  timer = setInterval(checkVersion, 60_000)
  document.addEventListener('visibilitychange', onVisible)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisible)
})
</script>

<template>
  <Transition name="update-slide">
    <div v-if="hayNuevaVersion" class="update-banner" role="alert">
      <span class="update-banner__text">
        <i class="fa-solid fa-rotate"></i>
        Hay una nueva versión de la aplicación
      </span>
      <button type="button" class="update-banner__btn" @click="actualizar">
        Actualizar ahora
      </button>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.update-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 16px;
  background: $primary;
  color: $white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  font-family: $font-secondary;

  &__text {
    font-size: 0.86rem;
    font-weight: 600;

    i {
      margin-right: 6px;
    }
  }

  &__btn {
    padding: 8px 18px;
    border: none;
    border-radius: 999px;
    background: $white;
    color: $primary;
    font-family: $font-secondary;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    animation: update-pulse 1.6s ease-in-out infinite;

    &:hover {
      transform: scale(1.03);
    }
  }
}

@keyframes update-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.55);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 255, 255, 0);
  }
}

.update-slide-enter-active,
.update-slide-leave-active {
  transition: transform 0.3s ease;
}

.update-slide-enter-from,
.update-slide-leave-to {
  transform: translateY(-100%);
}
</style>
