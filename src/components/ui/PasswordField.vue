<script setup lang="ts">
import { ref } from 'vue'

const model = defineModel<string>({ required: true })
const show = ref(false)
</script>

<template>
  <div class="password">
    <input
      v-model="model"
      :type="show ? 'text' : 'password'"
      autocomplete="current-password"
      placeholder="••••••••"
      required
    />
    <button
      type="button"
      :aria-label="show ? 'Ocultar contraseña' : 'Mostrar contraseña'"
      @click="show = !show"
    >
      <i :class="show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.password {
  position: relative;

  input {
    width: 100%;
    padding: 11px 42px 11px 13px;
    border: 1px solid var(--border-strong);
    border-radius: 9px;
    font-family: $font-secondary;
    font-size: 0.88rem;
    color: var(--text);
    background: var(--surface);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba($primary, 0.14);
    }
  }

  button {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-faint);
    cursor: pointer;
    transition: color 0.2s ease;

    i {
      font-size: 0.9rem;
    }

    &:hover {
      color: var(--text);
    }
  }
}
</style>
