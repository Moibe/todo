<script lang="ts">
  // Tasks de un Now. Usa el store compartido (tasksStore) para que el calendario
  // vea los mismos datos. Cada fila (en modo display) es ARRASTRABLE hacia un día
  // del calendario para agendarla; si ya tiene fecha, muestra una pill para verla
  // o quitarla.
  import { onMount } from 'svelte';
  import { tasksStore, type Task } from '$lib/tasksStore.svelte';

  let { nowId }: { nowId: number } = $props();

  let editingId = $state<number | null>(null);
  let editOriginal = '';

  const items = $derived(tasksStore.forNow(nowId));

  onMount(() => {
    tasksStore.load();
  });

  function addItem() {
    const id = tasksStore.add(nowId);
    editOriginal = '';
    editingId = id;
  }

  function removeItem(id: number) {
    if (editingId === id) editingId = null;
    tasksStore.remove(id);
  }

  function startEdit(item: Task) {
    editOriginal = item.text;
    editingId = item.id;
  }

  function confirmEdit(item: Task) {
    if (editingId !== item.id) return;
    editingId = null;
    tasksStore.setText(item.id, item.text.trim());
  }

  function cancelEdit(item: Task) {
    if (editingId !== item.id) return;
    item.text = editOriginal;
    editingId = null;
    tasksStore.save();
  }

  function editKeydown(e: KeyboardEvent, item: Task) {
    if (e.key === 'Enter') {
      (e.currentTarget as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      cancelEdit(item);
    }
  }

  function focusOnMount(el: HTMLInputElement) {
    el.focus();
    el.select();
  }

  function onDragStart(e: DragEvent, item: Task) {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData('text/plain', String(item.id));
    e.dataTransfer.effectAllowed = 'move';
  }

  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fmtFecha(f: string) {
    const [, m, d] = f.split('-').map(Number);
    return `${d} ${MESES[m - 1]}`;
  }
</script>

<section class="tasks">
  <header class="tk-head">
    <h2>Tasks</h2>
    <button class="add" type="button" onclick={addItem}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg>
      Agregar task
    </button>
  </header>

  {#if items.length === 0}
    <p class="empty-hint">Este Now aún no tiene tasks. Agrégalas con “Agregar task”.</p>
  {:else}
    <ol class="list">
      {#each items as item, i (item.id)}
        <li
          class="row"
          class:draggable={editingId !== item.id}
          draggable={editingId !== item.id}
          ondragstart={(e) => onDragStart(e, item)}
        >
          <span class="num">{i + 1}</span>

          {#if editingId === item.id}
            <input
              class="item-input"
              type="text"
              placeholder="Nombre de la task…"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              data-1p-ignore
              data-lpignore="true"
              bind:value={item.text}
              use:focusOnMount
              onblur={() => confirmEdit(item)}
              onkeydown={(e) => editKeydown(e, item)}
            />
            <button class="icon confirm" type="button" aria-label="Confirmar" onclick={() => confirmEdit(item)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </button>
          {:else}
            <span class="text" class:empty={!item.text} ondblclick={() => startEdit(item)}>
              {item.text || 'Sin nombre'}
            </span>
            {#if item.fecha}
              <button
                class="date-pill"
                type="button"
                title="Quitar del calendario"
                onclick={() => tasksStore.setDate(item.id, null)}
              >
                {fmtFecha(item.fecha)}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            {/if}
            <button class="icon edit" type="button" aria-label="Editar" onclick={() => startEdit(item)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
            </button>
          {/if}

          <button class="icon del" type="button" aria-label="Eliminar" onclick={() => removeItem(item.id)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></svg>
          </button>
        </li>
      {/each}
    </ol>
    <p class="drag-hint">Tip: arrastra una task al calendario para agendarla.</p>
  {/if}
</section>

<style>
  .tasks {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .tk-head {
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

  .empty-hint,
  .drag-hint {
    margin: 0;
    padding: 0.25rem 0.35rem;
    font-weight: 400;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.45);
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    padding: 0 0.35rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .row:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.35);
  }
  .row.draggable {
    cursor: grab;
  }
  .row.draggable:active {
    cursor: grabbing;
  }
  .num {
    flex-shrink: 0;
    width: 1.5rem;
    text-align: right;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.45);
    font-variant-numeric: tabular-nums;
  }

  .text {
    flex: 1;
    min-width: 0;
    padding: 0.55rem 0.6rem;
    color: #fff;
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .text.empty {
    color: rgba(255, 255, 255, 0.35);
    font-style: italic;
  }

  .date-pill {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    border: 1px solid rgba(147, 197, 253, 0.4);
    background: rgba(37, 99, 235, 0.22);
    color: #cfe3ff;
    font: inherit;
    font-size: 0.72rem;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .date-pill:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.45);
    color: #fff;
  }

  .item-input {
    flex: 1;
    min-width: 0;
    padding: 0.55rem 0.9rem;
    border-radius: 10px;
    border: 1px solid rgba(147, 197, 253, 0.6);
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font: inherit;
    font-weight: 400;
    outline: none;
  }
  .item-input::placeholder {
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
