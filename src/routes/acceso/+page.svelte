<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<section class="acceso">
  <div class="card">
    <h1>Acceso</h1>
    <p class="hint">Este espacio es privado. Ingresa la contraseña para continuar.</p>

    <form method="POST" action="?/login&redirectTo={encodeURIComponent(data.redirectTo)}" use:enhance>
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="password"
        name="password"
        placeholder="Contraseña"
        autocomplete="current-password"
        aria-label="Contraseña"
        required
        autofocus
      />
      <button type="submit" class="enter-btn">Entrar</button>
      {#if form?.error}
        <p class="error">{form.error}</p>
      {/if}
    </form>
  </div>
</section>

<style>
  .acceso {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 2rem 1.5rem;
    box-sizing: border-box;
  }

  .card {
    width: 100%;
    max-width: 26rem;
    padding: 1.75rem 1.6rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 14px;
    color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px) saturate(110%);
    -webkit-backdrop-filter: blur(8px) saturate(110%);
  }

  h1 {
    margin: 0 0 0.4rem;
    font-size: 1.3rem;
    text-shadow:
      0 0 10px rgba(255, 255, 255, 0.28),
      0 0 24px rgba(255, 255, 255, 0.14);
  }

  .hint {
    margin: 0 0 1.25rem;
    font-size: 0.85rem;
    font-weight: 400;
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.65);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  input {
    font: inherit;
    color: #fff;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 9px;
    padding: 0.6rem 0.8rem;
    color-scheme: dark;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }

  input::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  input:focus {
    outline: none;
    border-color: rgba(147, 197, 253, 0.6);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.3);
  }

  .enter-btn {
    font: inherit;
    cursor: pointer;
    padding: 0.6rem 1.1rem;
    color: #fff;
    background: rgba(37, 99, 235, 0.3);
    border: 1px solid rgba(37, 99, 235, 0.55);
    border-radius: 10px;
    transition: background 0.18s ease, border-color 0.18s ease;
  }

  .enter-btn:hover {
    background: rgba(37, 99, 235, 0.42);
    border-color: rgba(147, 197, 253, 0.7);
  }

  .error {
    margin: 0;
    color: #fca5a5;
    font-size: 0.85rem;
  }
</style>
