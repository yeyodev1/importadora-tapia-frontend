<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'

/**
 * Aviso para administración: quién tiene pendiente cambiar su correo.
 * Se muestra en Equipo y en el Resumen; desaparece solo cuando todos lo cambian.
 */
defineProps<{ enlace?: boolean }>()

const usersStore = useUsersStore()
onMounted(() => usersStore.fetch())

const pendientes = computed(() => usersStore.data.filter((u) => u.debeCambiarCorreo))
</script>

<template>
  <section v-if="pendientes.length" class="pend" role="status">
    <div class="pend__head">
      <i class="fa-solid fa-envelope-circle-check" aria-hidden="true"></i>
      <strong>
        {{ pendientes.length === 1 ? '1 persona tiene pendiente' : `${pendientes.length} personas tienen pendiente` }}
        cambiar su correo
      </strong>
    </div>
    <p class="pend__ayuda">Al entrar al CRM se les pide su correo personal. Este aviso se quita solo cuando lo cambian.</p>
    <ul class="pend__lista">
      <li v-for="u in pendientes" :key="u.id">
        <b>{{ u.name }}</b>
        <span>{{ u.email }}</span>
      </li>
    </ul>
    <RouterLink v-if="enlace" to="/equipo" class="pend__link">Ver en Equipo</RouterLink>
  </section>
</template>

<style lang="scss" scoped>
.pend {
  display: flex; flex-direction: column; gap: 8px;
  margin-bottom: 16px; padding: 14px 16px; border-radius: var(--radius);
  background: #fdf4e3; border: 1px solid rgba(#C27C0E, 0.35); color: #8a5a0a;
  &__head { display: flex; align-items: flex-start; gap: 10px; font-size: 0.86rem;
    i { margin-top: 2px; font-size: 1rem; } }
  &__ayuda { font-family: $font-secondary; font-size: 0.74rem; opacity: 0.85; }
  &__lista { list-style: none; display: flex; flex-direction: column; gap: 6px;
    li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; padding: 8px 10px;
      border-radius: 8px; background: rgba(255, 255, 255, 0.6); font-size: 0.8rem; min-width: 0; }
    b { font-weight: 700; }
    span { font-family: $font-secondary; font-size: 0.74rem; overflow-wrap: anywhere; } }
  &__link { align-self: flex-start; font-family: $font-principal; font-size: 0.76rem; font-weight: 700;
    color: #8a5a0a; text-decoration: underline; }
}
</style>
