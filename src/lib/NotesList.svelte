<script lang="ts">
  // Notas de un playbook. Lista PLANA en localStorage (`notes-list`) donde cada nota
  // tiene `playbookId`. Se muestran/agregan filtrando por el id del playbook actual.
  // A diferencia de los playbooks, las notas son MULTILÍNEA (textarea): Enter hace
  // salto de línea; se confirma con la palomita, con Ctrl/Cmd+Enter o al hacer clic
  // afuera (blur). Esc revierte al texto anterior.
  import { onMount } from 'svelte';

  type Note = { id: number; playbookId: number; text: string };

  let { playbookId }: { playbookId: number } = $props();

  let all = $state<Note[]>([]);
  let editingId = $state<number | null>(null);
  let editOriginal = '';
  let nextId = 0;

  const items = $derived(all.filter((n) => n.playbookId === playbookId));

  onMount(async () => {
    try {
      const list: Partial<Note>[] = await fetch('/api/notes').then((r) => r.json());
      all = list.map((n) => ({ id: n.id!, playbookId: n.playbookId!, text: n.text ?? '' }));
      nextId = all.reduce((max, n) => Math.max(max, n.id), 0) + 1;
    } catch {
      all = [];
    }
  });

  function save() {
    fetch('/api/notes', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(all)
    }).catch(() => {});
  }

  function addNote() {
    const note = { id: nextId++, playbookId, text: '' };
    all.push(note);
    editOriginal = '';
    editingId = note.id;
    save();
  }

  function removeNote(id: number) {
    all = all.filter((n) => n.id !== id);
    if (editingId === id) editingId = null;
    save();
  }

  function startEdit(note: Note) {
    editOriginal = note.text;
    editingId = note.id;
  }

  function confirmEdit(note: Note) {
    if (editingId !== note.id) return;
    note.text = note.text.trim();
    editingId = null;
    save();
  }

  function cancelEdit(note: Note) {
    if (editingId !== note.id) return;
    note.text = editOriginal;
    editingId = null;
    save();
  }

  function editKeydown(e: KeyboardEvent, note: Note) {
    if (e.key === 'Escape') {
      cancelEdit(note);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      (e.currentTarget as HTMLTextAreaElement).blur(); // blur -> confirmEdit
    }
    // Enter solo = salto de línea (default), porque las notas son multilínea.
  }

  function focusOnMount(el: HTMLTextAreaElement) {
    el.focus();
    el.select();
  }
</script>

<section class="notes">
  <header class="notes-head">
    <h2>Notas</h2>
    <button class="add" type="button" onclick={addNote}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg>
      Agregar nota
    </button>
  </header>

  {#if items.length === 0}
    <p class="empty-hint">Aún no hay notas. Agrégalas con “Agregar nota”.</p>
  {:else}
    <ul class="list">
      {#each items as note (note.id)}
        <li class="card">
          {#if editingId === note.id}
            <textarea
              class="note-input"
              rows="3"
              placeholder="Escribe una nota… (Enter = salto de línea · Ctrl/Cmd+Enter para guardar)"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              data-1p-ignore
              data-lpignore="true"
              bind:value={note.text}
              use:focusOnMount
              onblur={() => confirmEdit(note)}
              onkeydown={(e) => editKeydown(e, note)}
            ></textarea>
            <button class="icon confirm" type="button" aria-label="Confirmar" onclick={() => confirmEdit(note)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </button>
          {:else}
            <button class="note-text" class:empty={!note.text} type="button" ondblclick={() => startEdit(note)} onclick={() => startEdit(note)}>
              {note.text || 'Nota vacía'}
            </button>
            <button class="icon edit" type="button" aria-label="Editar" onclick={() => startEdit(note)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
            </button>
          {/if}

          <button class="icon del" type="button" aria-label="Eliminar" onclick={() => removeNote(note.id)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></svg>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .notes {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .notes-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  h2 {
    margin: 0;
    font-size: 1.15rem;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 0.01em;
  }

  .empty-hint {
    margin: 0;
    padding: 0.5rem 0.35rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.5);
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .card {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.5rem 0.5rem 0.5rem 0.65rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    transition: border-color 0.15s ease;
  }
  .card:hover {
    border-color: rgba(255, 255, 255, 0.32);
  }

  /* Nota fija (display) */
  .note-text {
    flex: 1;
    min-width: 0;
    text-align: left;
    padding: 0.4rem 0.4rem;
    background: transparent;
    border: none;
    color: #fff;
    font: inherit;
    font-weight: 400;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    cursor: text;
  }
  .note-text.empty {
    color: rgba(255, 255, 255, 0.35);
    font-style: italic;
  }

  .note-input {
    flex: 1;
    min-width: 0;
    padding: 0.55rem 0.7rem;
    border-radius: 8px;
    border: 1px solid rgba(147, 197, 253, 0.6);
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font: inherit;
    font-weight: 400;
    line-height: 1.5;
    outline: none;
    resize: vertical;
  }
  .note-input::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  .icon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  }
  .icon.edit:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.22);
  }
  .icon.confirm {
    color: rgba(134, 239, 172, 0.9);
  }
  .icon.confirm:hover {
    color: #fff;
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.45);
  }
  .icon.del:hover {
    color: #fff;
    background: rgba(239, 68, 68, 0.18);
    border-color: rgba(239, 68, 68, 0.4);
  }

  .add {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.9);
    font: inherit;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .add:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.35);
  }
</style>
