<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import CambiarCorreoForm from '@/components/cuenta/CambiarCorreoForm.vue'

/**
 * Pantalla completa que bloquea el CRM cuando el admin pidió que la persona
 * ponga su propio correo. No se puede cerrar (sin X, sin tocar fuera, sin
 * Escape): solo se sale guardando el correo nuevo o cerrando sesión.
 */
const router = useRouter()
const userStore = useUserStore()

/** Correo recién guardado: muestra la confirmación antes de soltar la app. */
const nuevoCorreo = ref<string | null>(null)

const visible = computed(() => userStore.isAuthenticated && (userStore.debeCambiarCorreo || !!nuevoCorreo.value))

// Sin scroll del fondo mientras la pantalla está abierta.
watch(
  visible,
  (v) => {
    document.body.style.overflow = v ? 'hidden' : ''
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  document.body.style.overflow = ''
})

function cerrarSesion() {
  nuevoCorreo.value = null
  userStore.clear()
  router.push('/login')
}
</script>

<template>
  <Teleport to="body">
    <transition name="cco">
      <div v-if="visible" class="cco" role="dialog" aria-modal="true" aria-labelledby="cco-titulo">
        <div class="cco__panel">
          <template v-if="nuevoCorreo">
            <span class="cco__icon is-ok"><i class="fa-solid fa-circle-check"></i></span>
            <h2 id="cco-titulo">¡Listo! Correo actualizado</h2>
            <p class="cco__txt">Desde ahora entra con</p>
            <p class="cco__correo">{{ nuevoCorreo }}</p>
            <p class="cco__txt">Tu contraseña sigue siendo la misma. Te enviamos un aviso a ambos correos.</p>
            <button type="button" class="cco__seguir" @click="nuevoCorreo = null">Seguir al CRM</button>
          </template>

          <template v-else>
            <span class="cco__icon"><i class="fa-solid fa-envelope-circle-check"></i></span>
            <h2 id="cco-titulo">Actualiza tu correo</h2>
            <p class="cco__txt">
              Administración te pide actualizar tu correo. Pon tu correo personal para seguir usando el CRM.
            </p>
            <p v-if="userStore.email" class="cco__actual">
              Hoy entras con <b>{{ userStore.email }}</b>
            </p>

            <CambiarCorreoForm texto-boton="Guardar mi correo" @guardado="nuevoCorreo = $event" />

            <button type="button" class="cco__salir" @click="cerrarSesion">Cerrar sesión</button>
          </template>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.cco {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 24px 16px;
  background:
    radial-gradient(90% 70% at 85% -10%, rgba($primary, 0.35), transparent 55%),
    radial-gradient(70% 60% at 0% 100%, rgba($secondary, 0.16), transparent 55%),
    $primary-dark;

  @media (min-width: 560px) {
    align-items: center;
  }

  &__panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
    max-width: 400px;
    margin: auto 0;
    padding: 28px 20px 20px;
    border-radius: 18px;
    background: var(--surface);
    box-shadow: var(--shadow-pop);
    text-align: center;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: $primary;
    font-size: 1.4rem;

    &.is-ok {
      background: rgba($secondary, 0.14);
      color: $secondary;
    }
  }

  h2 {
    font-size: 1.1rem;
    font-weight: 800;
  }

  &__txt {
    font-family: $font-secondary;
    font-size: 0.84rem;
    line-height: 1.55;
    color: var(--text-soft);
  }

  &__actual {
    width: 100%;
    margin-bottom: 6px;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba($primary-dark, 0.05);
    font-family: $font-secondary;
    font-size: 0.78rem;
    color: var(--text-soft);
    word-break: break-word;

    b {
      color: var(--text);
    }
  }

  &__correo {
    width: 100%;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--accent-soft);
    font-size: 0.95rem;
    font-weight: 800;
    color: $primary;
    word-break: break-word;
  }

  &__seguir {
    width: 100%;
    min-height: 46px;
    margin-top: 8px;
    border: none;
    border-radius: 10px;
    background: $primary;
    color: $white;
    font-family: $font-principal;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: darken($primary, 6%);
    }
  }

  &__salir {
    min-height: 40px;
    margin-top: 4px;
    padding: 0 12px;
    border: none;
    background: transparent;
    font-family: $font-secondary;
    font-size: 0.76rem;
    font-weight: 600;
    color: var(--text-faint);
    text-decoration: underline;
    cursor: pointer;

    &:hover {
      color: $alert-error;
    }
  }
}

.cco-enter-active,
.cco-leave-active {
  transition: opacity 0.25s ease;
}
.cco-enter-from,
.cco-leave-to {
  opacity: 0;
}
</style>
