<script setup lang="ts">
import { ref, computed } from 'vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import DocumentoSlot from './DocumentoSlot.vue'
import { DOCUMENTOS, minimos } from './documentos'
import type { DocumentoSolicitud, SolicitudDatos, TipoDocumento } from '@/types/solicitudes'

const props = defineProps<{ datos: SolicitudDatos; disabled: boolean }>()
const emit = defineEmits<{ ocupado: [v: boolean] }>()

const min = computed(() => minimos(props.datos.tipoPersona))
const archivosDe = (tipo: TipoDocumento) => props.datos.documentos.filter((d) => d.tipo === tipo)

/** Cuántos documentos están subiendo a la vez (para bloquear el guardado). */
const subiendo = ref(0)
function onOcupado(v: boolean) {
  subiendo.value = Math.max(0, subiendo.value + (v ? 1 : -1))
  emit('ocupado', subiendo.value > 0)
}

function agregar(doc: DocumentoSolicitud) {
  props.datos.documentos.push(doc)
}

const aQuitar = ref<DocumentoSolicitud | null>(null)
function quitar() {
  const i = props.datos.documentos.findIndex((d) => d.url === aQuitar.value?.url)
  if (i >= 0) props.datos.documentos.splice(i, 1)
  aQuitar.value = null
}
</script>

<template>
  <section class="bloque">
    <header class="bloque__head">
      <h2>Documentos</h2>
      <p>Una foto clara o un PDF de cada documento. Puedes subir varios archivos por documento.</p>
    </header>

    <DocumentoSlot
      v-for="d in DOCUMENTOS"
      :key="d.tipo"
      :def="d"
      :archivos="archivosDe(d.tipo)"
      :minimo="min[d.tipo]"
      :disabled="disabled"
      @agregar="agregar"
      @quitar="(doc) => (aQuitar = doc)"
      @ocupado="onOcupado"
    />

    <ConfirmModal
      :open="!!aQuitar"
      danger
      title="Quitar documento"
      :subject="aQuitar?.nombre || 'Archivo'"
      message="El archivo se quitará de esta solicitud."
      confirm-label="Quitar"
      second-message="El cambio queda al guardar la solicitud. ¿Seguro que quieres quitar este archivo?"
      second-label="Sí, quitar"
      @cancel="aQuitar = null"
      @confirm="quitar"
    />
  </section>
</template>

<style lang="scss" scoped>
@use './solicitud-form';
</style>
