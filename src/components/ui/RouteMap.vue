<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Parada {
  lat: number
  lng: number
  label: string
  hora: string
}

const props = defineProps<{ paradas: Parada[] }>()

const el = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let capa: L.LayerGroup | null = null

function pin(n: number): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#2094D2;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:grid;place-items:center"><span style="transform:rotate(45deg);color:#fff;font:700 12px sans-serif">${n}</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  })
}

function render() {
  if (!map || !capa) return
  capa.clearLayers()
  const pts = props.paradas.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
  if (!pts.length) {
    map.setView([-2.17, -79.92], 12) // Guayaquil por defecto
    return
  }
  const latlngs: L.LatLngExpression[] = pts.map((p) => [p.lat, p.lng])
  pts.forEach((p, i) => {
    L.marker([p.lat, p.lng], { icon: pin(i + 1) })
      .bindPopup(`<b>${i + 1}. ${p.label}</b><br>${p.hora}`)
      .addTo(capa!)
  })
  if (latlngs.length > 1) {
    L.polyline(latlngs, { color: '#2094D2', weight: 3, opacity: 0.7, dashArray: '6 8' }).addTo(capa!)
  }
  map.fitBounds(L.latLngBounds(latlngs).pad(0.25))
}

onMounted(async () => {
  await nextTick()
  if (!el.value) return
  map = L.map(el.value, { scrollWheelZoom: false, attributionControl: false }).setView([-2.17, -79.92], 12)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
  capa = L.layerGroup().addTo(map)
  render()
})

watch(() => props.paradas, render, { deep: true })

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div ref="el" class="route-map"></div>
</template>

<style lang="scss" scoped>
.route-map {
  width: 100%;
  height: 340px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  overflow: hidden;
  z-index: 0;
}
</style>
