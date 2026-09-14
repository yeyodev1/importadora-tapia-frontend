<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SeccionTitular from './solicitudes/SeccionTitular.vue'
import SeccionReferencias from './solicitudes/SeccionReferencias.vue'
import SeccionDocumentos from './solicitudes/SeccionDocumentos.vue'
import PanelRevision from './solicitudes/PanelRevision.vue'
import { useSolicitudForm } from './solicitudes/useSolicitudForm'
import { ESTADO_LABEL, ESTADO_TONE } from './solicitudes/documentos'
import { useUserStore } from '@/stores/user'
import { useErpStore } from '@/stores/erp'
import { formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const erp = useErpStore()
const f = useSolicitudForm()

/** `/solicitudes/nueva` crea; `/solicitudes/:id` abre una existente. */
const id = computed(() => (route.params.id === 'nueva' ? '' : String(route.params.id || '')))
const clienteQuery = computed(() => (typeof route.query.cliente === 'string' ? route.query.cliente : ''))

function iniciar() {
  if (id.value) {
    if (f.actual.value?._id !== id.value) f.cargar(id.value)
    return
  }
  const actualizacion = route.query.tipo === 'actualizacion' && !!clienteQuery.value
  f.nueva({ tipo: actualizacion ? 'actualizacion' : 'nuevo' })
  if (actualizacion) prellenar(clienteQuery.value)
}

/** Actualización de un cliente del ERP: arranca con lo que Tapia ya tiene. */
function prellenar(codigo: string) {
  f.datos.clienteCodigo = codigo
  const c = erp.clientes.data.find((x) => x.per_codigo === codigo)
  if (!c) return
  const idn = String(c.per_identificacion || '').replace(/\D/g, '')
  f.datos.clienteNombre = c.per_nombre
  f.datos.negocio.nombre = f.datos.negocio.nombre || c.per_nombre
  f.datos.negocio.direccion = f.datos.negocio.direccion || c.per_direccion || ''
  f.datos.negocio.telefono = f.datos.negocio.telefono || c.per_telefono || ''
  if (idn.length === 13) f.datos.negocio.ruc = f.datos.negocio.ruc || idn
  if (idn.length >= 10) f.datos.titular.cedula = f.datos.titular.cedula || idn.slice(0, 10)
}

onMounted(async () => {
  iniciar()
  await erp.fetchClientes()
  if (!id.value && f.datos.tipo === 'actualizacion' && !f.datos.clienteNombre) prellenar(clienteQuery.value)
})
watch(() => route.fullPath, iniciar)

async function guardar(enviar: boolean) {
  const s = await f.guardar(enviar)
  if (s && !id.value) router.replace(`/solicitudes/${s._id}`)
}

const titulo = computed(() => {
  if (f.actual.value) return `Solicitud ${f.actual.value.numero}`
  return f.datos.tipo === 'nuevo' ? 'Nueva solicitud · cliente nuevo' : 'Actualización de datos'
})
const nombre = computed(
  () => [f.datos.titular.nombres, f.datos.titular.apellidos].filter(Boolean).join(' ') || f.datos.negocio.nombre,
)
const ocupado = computed(() => f.guardando.value || f.subiendo.value)
const pendientes = computed(() => f.pendientes.value)
</script>

<template>
  <div class="sol">
    <button class="volver" type="button" @click="router.push('/solicitudes')">← Solicitudes</button>

    <p v-if="f.cargando.value" class="cargando"><BaseSpinner :size="16" /> Cargando solicitud…</p>

    <EmptyState
      v-else-if="id && !f.actual.value"
      tone="error"
      title="No se pudo abrir la solicitud"
      :message="f.error.value || 'No existe o no tienes acceso.'"
      @retry="f.cargar(id)"
    />

    <template v-else>
      <header class="sol__head">
        <div class="sol__title">
          <h1>{{ titulo }}</h1>
          <p>
            {{ nombre || 'Completa los datos del cliente' }}
            <template v-if="f.actual.value"> · {{ f.actual.value.vendedorNombre }} · {{ formatDate(f.actual.value.createdAt) }}</template>
          </p>
        </div>
        <BaseBadge v-if="f.actual.value" :tone="ESTADO_TONE[f.actual.value.estado]">
          {{ ESTADO_LABEL[f.actual.value.estado] }}
        </BaseBadge>
      </header>

      <p v-if="f.datos.tipo === 'actualizacion'" class="aviso is-info">
        <i class="fa-solid fa-rotate"></i>
        <span>Actualización de datos de <b>{{ f.datos.clienteNombre || 'cliente del ERP' }}</b> (código {{ f.datos.clienteCodigo }}).</span>
      </p>
      <p v-if="f.actual.value?.estado === 'rechazada'" class="aviso is-error">
        <i class="fa-solid fa-circle-xmark"></i>
        <span><b>Rechazada:</b> {{ f.actual.value.motivoRechazo }} Corrige lo indicado y vuelve a enviarla.</span>
      </p>
      <p v-else-if="f.actual.value?.estado === 'enviada' && !userStore.isAdmin" class="aviso is-info">
        <i class="fa-solid fa-hourglass-half"></i>
        <span>En revisión por administración. Te llegará un correo con la respuesta.</span>
      </p>
      <p v-else-if="f.actual.value?.estado === 'aprobada'" class="aviso is-ok">
        <i class="fa-solid fa-circle-check"></i>
        <span>Aprobada. Ya no se puede editar.</span>
      </p>

      <PanelRevision v-if="userStore.isAdmin && f.actual.value" :solicitud="f.actual.value" @actualizada="f.actualizar" />

      <SeccionTitular :datos="f.datos" :disabled="!f.editable.value" />
      <SeccionReferencias :datos="f.datos" :disabled="!f.editable.value" />
      <SeccionDocumentos :datos="f.datos" :disabled="!f.editable.value" @ocupado="(v) => (f.subiendo.value = v)" />

      <section class="bloque">
        <header class="bloque__head"><h2>Autorización y firma</h2></header>
        <label class="autoriza">
          <input id="sol-autoriza" v-model="f.datos.autorizaBuro" type="checkbox" :disabled="!f.editable.value" />
          <span>
            El cliente firmó la autorización: «Autorizo expresamente a <b>Importadora Tapia Berzoza IMCATABE Cía. Ltda.</b>
            para que obtenga, reporte, solicite y divulgue mi comportamiento crediticio a los establecimientos de comercio,
            instituciones financieras, de crédito y cobranza, compañías de informes, empleador, personas señaladas como
            referencia y cualquier central de información autorizada por la Superintendencia de Bancos».
          </span>
        </label>
        <label class="fld">
          <span>Observación (opcional)</span>
          <textarea id="sol-observacion" v-model="f.datos.observacion" rows="2" :disabled="!f.editable.value"></textarea>
        </label>
      </section>

      <footer v-if="f.editable.value" class="barra">
        <p v-if="f.error.value" class="aviso is-error" role="alert">{{ f.error.value }}</p>
        <p v-else-if="f.aviso.value" class="aviso is-ok" role="status">{{ f.aviso.value }}</p>
        <p v-else-if="f.puedeEnviar.value && pendientes.length" class="barra__falta">
          Falta para enviar: {{ pendientes.slice(0, 3).join(', ') }}<template v-if="pendientes.length > 3"> y {{ pendientes.length - 3 }} más</template>.
        </p>
        <div class="barra__btns">
          <button type="button" class="btn-sec" :disabled="ocupado" @click="guardar(false)">
            {{ f.puedeEnviar.value ? 'Guardar borrador' : 'Guardar cambios' }}
          </button>
          <button v-if="f.puedeEnviar.value" type="button" class="btn-pri" :disabled="ocupado" @click="guardar(true)">
            <BaseSpinner v-if="f.guardando.value" :size="14" light />
            Enviar a revisión
          </button>
        </div>
        <small v-if="f.subiendo.value" class="barra__falta">Esperando que terminen de subir los archivos…</small>
      </footer>
    </template>
  </div>
</template>

<style lang="scss" scoped>
@use './solicitudes/solicitud-form';

.sol {
  display: flex; flex-direction: column; gap: 14px; max-width: 820px; margin: 0 auto; padding-bottom: 12px;
  &__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  &__title {
    min-width: 0;
    h1 { font-size: 1.2rem; font-weight: 800; letter-spacing: -0.01em; text-wrap: balance; }
    p { margin-top: 3px; font-family: $font-secondary; font-size: 0.78rem; color: var(--text-soft); }
  }
}
.volver {
  align-self: flex-start; padding: 7px 14px; border: 1px solid var(--border-strong); border-radius: 8px;
  background: var(--surface); font-family: $font-principal; font-size: 0.78rem; font-weight: 600; color: var(--text); cursor: pointer;
  &:hover { border-color: $primary; color: $primary; }
}
.cargando { display: flex; align-items: center; gap: 8px; font-family: $font-secondary; font-size: 0.82rem; color: var(--text-soft); }
.autoriza {
  display: flex; align-items: flex-start; gap: 10px; cursor: pointer;
  input { width: 22px; height: 22px; margin-top: 2px; flex-shrink: 0; accent-color: $primary; }
  span { font-family: $font-secondary; font-size: 0.78rem; line-height: 1.5; color: var(--text-soft); b { color: var(--text); } }
}
.barra {
  position: sticky; bottom: 0; z-index: 5; display: flex; flex-direction: column; gap: 8px;
  padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius);
  background: var(--surface); box-shadow: var(--shadow-pop);
  &__falta { font-family: $font-secondary; font-size: 0.74rem; color: var(--text-soft); }
  &__btns { display: flex; gap: 8px; > * { flex: 1 1 0; } }
}
.btn-sec, .btn-pri {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; padding: 0 14px;
  border-radius: 10px; font-family: $font-principal; font-size: 0.84rem; font-weight: 700; cursor: pointer;
  &:disabled { opacity: 0.6; cursor: wait; }
}
.btn-sec { border: 1px solid var(--border-strong); background: var(--surface); color: var(--text); }
.btn-pri { border: none; background: $primary; color: $white; &:hover:not(:disabled) { background: darken($primary, 6%); } }
</style>
