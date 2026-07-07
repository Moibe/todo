<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<div class="page">
  {#if data.now}
    <a class="back" href={`/now/${data.now.id}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      Volver
    </a>
  {/if}

  {#if data.milestone}
    <h1>{data.milestone.text || 'Sin nombre'}</h1>
    <p class="muted">Página del milestone. Aún sin contenido.</p>
  {:else}
    <h1>Milestone no encontrado</h1>
    <p class="muted">No existe un milestone con ese identificador.</p>
  {/if}
</div>

<style>
  .page {
    max-width: 1000px;
    margin: 0 auto;
    padding: 1.5rem 0.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .back {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.7rem 0.4rem 0.5rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.85);
    font: inherit;
    font-size: 0.9rem;
    text-decoration: none;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }
  .back:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }
  h1 {
    margin: 0;
    font-size: 1.6rem;
    color: #fff;
    letter-spacing: 0.01em;
  }
  .muted {
    margin: 0;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.55);
  }
</style>
