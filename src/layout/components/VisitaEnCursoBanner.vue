<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useVisitasStore } from '@/stores/visitas'
import { useUserStore } from '@/stores/user'

/**
 * Recordatorio en toda la app: si el vendedor marcó llegada y aún no marca
 * salida, se le muestra arriba con acceso directo a "Marcar salida".
 */
const route = useRoute()
const visitas = useVisitasStore()
const userStore = useUserStore()

function refrescar() {
  if (!userStore.isAdmin && document.visibilityState === 'visible') visitas.fetch(true)
}

onMounted(() => {
  if (!userStore.isAdmin) visitas.fetch()
  document.addEventListener('visibilitychange', refrescar)
})
onBeforeUnmount(() => document.removeEventListener('visibilitychange', refrescar))

const enCurso = computed(() => (userStore.isAdmin ? null : visitas.enCurso))

const desde = computed(() => {
  const v = enCurso.value
  if (!v) return ''
  const d = new Date(v.entrada.ts)
  const hora = d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
  const hoy = new Date().toDateString() === d.toDateString()
  return hoy ? `desde las ${hora}` : `desde el ${d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })} a las ${hora}`
})
const deOtroDia = computed(() => !!enCurso.value && new Date(enCurso.value.entrada.ts).toDateString() !== new Date().toDateString())
</script>

<template>
  <div v-if="enCurso" class="visita-banner" :class="{ 'is-vieja': deOtroDia }" role="status">
    <i class="fa-solid visita-banner__icono" :class="deOtroDia ? 'fa-triangle-exclamation' : 'fa-location-dot'" aria-hidden="true"></i>
    <p class="visita-banner__txt">
      <strong>{{ deOtroDia ? 'Olvidaste marcar la salida' : 'Visita en curso' }}</strong>
      {{ enCurso.clienteNombre || 'Cliente sin nombre' }} · {{ desde }}
    </p>
    <RouterLink v-if="route.path !== '/visitas'" to="/visitas" class="visita-banner__btn">Marcar salida</RouterLink>
  </div>
</template>

<style lang="scss" scoped>
.visita-banner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 10px 16px;
  background: var(--accent-soft);
  border-bottom: 1px solid rgba($primary, 0.25);
  font-family: $font-secondary;
  font-size: 0.8rem;
  color: var(--text);

  &.is-vieja {
    background: $alert-warning-bg;
    border-bottom-color: rgba($alert-warning, 0.4);
    .visita-banner__icono { color: darken($alert-warning, 12%); }
  }

  &__icono { font-size: 1.1rem; color: $primary; }

  &__txt {
    flex: 1 1 180px;
    min-width: 0;
    strong { display: block; font-weight: 800; }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 0 14px;
    border-radius: 9px;
    background: $primary;
    color: $white;
    font-weight: 700;
    text-decoration: none;
    &:hover { background: darken($primary, 6%); }
  }
}
</style>
