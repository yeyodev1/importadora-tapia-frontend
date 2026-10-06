<script setup lang="ts">
/**
 * Marco de las pantallas públicas de acceso (recuperar / restablecer
 * contraseña): mismo fondo y tarjeta que el login. Los estilos de campos,
 * botón y mensajes se aplican al contenido del slot.
 */
defineProps<{ titulo: string; subtitulo?: string }>()
</script>

<template>
  <div class="auth">
    <div class="auth__panel">
      <span class="auth__logo">IT</span>
      <h1>{{ titulo }}</h1>
      <p v-if="subtitulo" class="auth__subtitle">{{ subtitulo }}</p>
      <div class="auth__body">
        <slot />
      </div>
    </div>
    <p class="auth__foot">Importadora Tapia <em>CRM</em> · conexión cifrada</p>
  </div>
</template>

<style lang="scss" scoped>
.auth {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  padding: 24px 16px;
  background:
    radial-gradient(90% 70% at 85% -10%, rgba($primary, 0.35), transparent 55%),
    radial-gradient(70% 60% at 0% 100%, rgba($secondary, 0.16), transparent 55%),
    $primary-dark;

  &__panel {
    width: 100%;
    max-width: 380px;
    background: var(--surface);
    border-radius: 16px;
    padding: 30px 22px 26px;
    box-shadow: 0 24px 60px rgba(black, 0.35);
    animation: panel-in 0.5s var(--ease-out);

    h1 {
      margin-top: 16px;
      font-size: 1.2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, $primary, darken($primary, 12%));
    color: $white;
    font-weight: 800;
    box-shadow: 0 6px 18px rgba($primary, 0.4);
  }

  &__subtitle {
    margin-top: 4px;
    font-family: $font-secondary;
    font-size: 0.8rem;
    color: var(--text-soft);
  }

  &__body {
    margin-top: 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__foot {
    font-family: $font-secondary;
    font-size: 0.72rem;
    color: rgba($white, 0.45);

    em {
      font-style: normal;
      color: rgba($primary, 0.8);
    }
  }

  :slotted(form) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  :slotted(.auth-field) {
    display: flex;
    flex-direction: column;
    gap: 6px;

    > span {
      font-family: $font-secondary;
      font-size: 0.74rem;
      font-weight: 600;
      color: var(--text-soft);
    }

    > input {
      width: 100%;
      padding: 11px 13px;
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
  }

  :slotted(.auth-msg) {
    font-family: $font-secondary;
    font-size: 0.8rem;
    line-height: 1.5;
    border-radius: 8px;
    padding: 10px 12px;
  }

  :slotted(.auth-msg--error) {
    color: darken($alert-error, 8%);
    background: $alert-error-bg;
  }

  :slotted(.auth-msg--ok) {
    color: darken($alert-success, 12%);
    background: $alert-success-bg;
  }

  :slotted(.auth-submit) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 12px;
    border: none;
    border-radius: 9px;
    background: $primary;
    color: $white;
    font-family: $font-principal;
    font-size: 0.9rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;

    &:hover:not(:disabled) {
      background: darken($primary, 6%);
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba($primary, 0.35);
    }

    &:disabled {
      opacity: 0.85;
      cursor: default;
    }
  }

  :slotted(.auth-link) {
    align-self: center;
    font-family: $font-secondary;
    font-size: 0.8rem;
    font-weight: 600;
    color: $primary;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (min-width: 480px) {
  .auth__panel {
    padding: 34px 30px 30px;
  }
}
</style>
