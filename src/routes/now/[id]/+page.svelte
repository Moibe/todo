<script lang="ts">
  import type { PageData } from './$types';
  import MilestonesList from '$lib/MilestonesList.svelte';
  import TasksList from '$lib/TasksList.svelte';
  import Calendar from '$lib/Calendar.svelte';

  let { data }: { data: PageData } = $props();
</script>

<div class="page">
  <a class="back" href="/seccion-dos">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
    Volver
  </a>

  {#if data.now}
    <h1>{data.now.text || 'Sin texto'}</h1>

    <MilestonesList nowId={data.now.id} />

    <hr class="sep" />

    <TasksList nowId={data.now.id} />

    <hr class="sep" />

    <Calendar />
  {:else}
    <h1>Now no encontrado</h1>
    <p class="muted">No existe un elemento con ese identificador.</p>
  {/if}
</div>

<style>
  .page {
    max-width: 640px;
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
  .sep {
    width: 100%;
    height: 0;
    margin: 0.25rem 0;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
  .muted {
    margin: 0;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.55);
  }
</style>
