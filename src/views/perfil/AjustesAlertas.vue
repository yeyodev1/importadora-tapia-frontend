<script setup lang="ts">
import { computed } from 'vue'
import { usePreferenciasAlerta } from '@/composables/usePreferenciasAlerta'
import { desbloquearAudio, sonarAlarma } from '@/utils/alarma'

/** Encender/apagar y subir/bajar el sonido de las alertas de pedidos (por dispositivo). */
const { sonidoActivo, volumen } = usePreferenciasAlerta()

const PASO = 10

const icono = computed(() => {
  if (!sonidoActivo.value || volumen.value === 0) return 'fa-volume-xmark'
  return volumen.value < 50 ? 'fa-volume-low' : 'fa-volume-high'
})

async function probar(rafagas = 3) {
  await desbloquearAudio()
  sonarAlarma(volumen.value / 100, rafagas)
}

function cambiar(delta: number) {
  volumen.value = Math.min(100, Math.max(0, volumen.value + delta))
  if (volumen.value > 0) probar(1)
}

function alSoltar(e: Event) {
  volumen.value = Number((e.target as HTMLInputElement).value)
  if (volumen.value > 0) probar(1)
}

function alternar() {
  sonidoActivo.value = !sonidoActivo.value
  if (sonidoActivo.value && volumen.value === 0) volumen.value = 50
  if (sonidoActivo.value) probar(1)
}
</script>

<template>
  <section class="ajustes">
    <header class="ajustes__head">
      <span class="ajustes__ico" :class="{ 'is-off': !sonidoActivo }"><i class="fa-solid" :class="icono"></i></span>
      <div class="ajustes__txt">
        <h3>Sonido de alertas</h3>
        <p>{{ sonidoActivo ? 'Suena cuando llega una orden nueva o cambia un pedido.' : 'Apagado: verás el aviso en pantalla, pero sin sonido.' }}</p>
      </div>
      <button
        type="button"
        class="switch"
        role="switch"
        :aria-checked="sonidoActivo"
        :aria-label="sonidoActivo ? 'Desactivar sonido de alertas' : 'Activar sonido de alertas'"
        :class="{ 'is-on': sonidoActivo }"
        @click="alternar"
      >
        <span class="switch__dot"></span>
        <span class="switch__txt">{{ sonidoActivo ? 'Activado' : 'Desactivado' }}</span>
      </button>
    </header>

    <div class="volumen" :class="{ 'is-off': !sonidoActivo }">
      <div class="volumen__top">
        <span>Volumen</span>
        <b>{{ volumen }}%</b>
      </div>
      <div class="volumen__ctrl">
        <button type="button" class="volumen__btn" aria-label="Bajar volumen" :disabled="!sonidoActivo || volumen <= 0" @click="cambiar(-PASO)">
          <i class="fa-solid fa-minus"></i>
        </button>
        <input
          class="volumen__rango"
          type="range"
          min="0"
          max="100"
          step="5"
          :value="volumen"
          :disabled="!sonidoActivo"
          :style="{ '--p': `${volumen}%` }"
          aria-label="Volumen de la alerta"
          @input="volumen = Number(($event.target as HTMLInputElement).value)"
          @change="alSoltar"
        />
        <button type="button" class="volumen__btn" aria-label="Subir volumen" :disabled="!sonidoActivo || volumen >= 100" @click="cambiar(PASO)">
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
    </div>

    <div class="ajustes__pie">
      <button type="button" class="probar" :disabled="!sonidoActivo || volumen === 0" @click="probar()">
        <i class="fa-solid fa-play"></i> Probar sonido
      </button>
      <small>Se guarda en este dispositivo. Si no suena, sube el volumen del celular y quita el modo silencio.</small>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.ajustes {
  display: flex; flex-direction: column; gap: 18px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 20px; box-shadow: var(--shadow-card); margin-bottom: 16px;

  &__head { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  &__ico {
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    width: 46px; height: 46px; border-radius: 12px; background: var(--accent-soft); color: $primary; font-size: 1.1rem;
    &.is-off { background: var(--border); color: var(--text-faint); }
  }
  &__txt { flex: 1; min-width: 160px;
    h3 { font-size: 1rem; font-weight: 800; }
    p { font-family: $font-secondary; font-size: 0.78rem; color: var(--text-soft); margin-top: 2px; }
  }
  &__pie { display: flex; flex-direction: column; gap: 8px;
    small { font-family: $font-secondary; font-size: 0.72rem; color: var(--text-faint); }
    @media (min-width: 560px) { flex-direction: row; align-items: center; gap: 14px; }
  }
}

.switch {
  display: inline-flex; align-items: center; gap: 10px; min-height: 44px; padding: 6px 14px 6px 6px;
  border: 1.5px solid var(--border-strong); border-radius: 999px; background: var(--surface); cursor: pointer;
  font-family: $font-principal; font-size: 0.8rem; font-weight: 700; color: var(--text-soft);
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
  &__dot {
    position: relative; width: 44px; height: 26px; border-radius: 999px; background: var(--border-strong); transition: background 0.2s ease;
    &::after {
      content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%;
      background: $white; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25); transition: transform 0.2s ease;
    }
  }
  &.is-on { border-color: $primary; background: var(--accent-soft); color: $primary;
    .switch__dot { background: $primary; &::after { transform: translateX(18px); } } }
  @media (max-width: 559px) { width: 100%; justify-content: center; }
}

.volumen {
  display: flex; flex-direction: column; gap: 10px; transition: opacity 0.2s ease;
  &.is-off { opacity: 0.45; }
  &__top { display: flex; justify-content: space-between; align-items: baseline;
    span { font-family: $font-secondary; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-faint); }
    b { font-size: 1.3rem; font-weight: 800; font-variant-numeric: tabular-nums; }
  }
  &__ctrl { display: flex; align-items: center; gap: 12px; }
  &__btn {
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid var(--border-strong); background: var(--surface);
    color: var(--text); font-size: 0.9rem; cursor: pointer; transition: border-color 0.2s ease, color 0.2s ease;
    &:hover:not(:disabled) { border-color: $primary; color: $primary; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
  &__rango {
    flex: 1; min-width: 0; height: 8px; border-radius: 999px; appearance: none; -webkit-appearance: none; cursor: pointer;
    background: linear-gradient(to right, $primary var(--p), var(--border-strong) var(--p));
    &:disabled { cursor: not-allowed; }
    &::-webkit-slider-thumb {
      -webkit-appearance: none; width: 26px; height: 26px; border-radius: 50%;
      background: $white; border: 3px solid $primary; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }
    &::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: $white; border: 3px solid $primary; }
    &:focus-visible { outline: 2px solid $primary; outline-offset: 4px; }
  }
}

.probar {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 10px 18px;
  border: none; border-radius: 10px; background: $primary; color: $white; cursor: pointer;
  font-family: $font-principal; font-size: 0.82rem; font-weight: 700; flex-shrink: 0;
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}
</style>
