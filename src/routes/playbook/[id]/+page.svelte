<script lang="ts">
  import { page } from '$app/state';
  import PlaybookList from '$lib/PlaybookList.svelte';
  import NotesList from '$lib/NotesList.svelte';

  type Playbook = { id: number; text: string; parentId: number | null };

  let loaded = $state(false);
  let playbook = $state<Playbook | null>(null);

  const id = $derived(Number(page.params.id));

  // $effect (no onMount) para que al navegar entre /playbook/1 y /playbook/2
  // — mismo componente reusado — el título se recargue cuando cambia el id.
  $effect(() => {
    const currentId = id;
    loaded = false;
    fetch('/api/playbooks')
      .then((r) => r.json())
      .then((list: Partial<Playbook>[]) => {
        const found = list.find((p) => p.id === currentId);
        playbook = found
          ? { id: found.id!, text: found.text ?? '', parentId: found.parentId ?? null }
          : null;
        loaded = true;
      })
      .catch(() => {
        playbook = null;
        loaded = true;
      });
  });

  // "Volver" va al playbook padre si está anidado; si es de raíz, al índice.
  const backHref = $derived(
    playbook && playbook.parentId != null ? `/playbook/${playbook.parentId}` : '/playbook'
  );
</script>

<div class="page">
  <a class="back" href={backHref}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
    Volver
  </a>

  {#if !loaded}
    <p class="muted">Cargando…</p>
  {:else if playbook}
    <h1>{playbook.text || 'Sin nombre'}</h1>
    <PlaybookList
      parentId={id}
      title="Playbooks dentro"
      primary={false}
      emptyHint="Este playbook aún no tiene playbooks dentro. Agrégalos con “Agregar playbook”."
    />

    <hr class="sep" />

    <NotesList playbookId={id} />
  {:else}
    <h1>Playbook no encontrado</h1>
    <p class="muted">No existe un playbook con ese identificador.</p>
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
