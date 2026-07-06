<script lang="ts">
  import { onMount } from 'svelte';

  type Item = { id: number; text: string; macros: number[] };
  type Macro = { id: number; label: string };

  const DEFAULT_COUNT = 7;

  let items = $state<Item[]>([]);
  let editingId = $state<number | null>(null);
  let editOriginal = ''; // texto antes de editar, para revertir con Esc
  let nextId = 0;

  // Metadatos: lista de macros existentes y el Now cuyo modal está abierto.
  let macros = $state<Macro[]>([]);
  let metaId = $state<number | null>(null);
  let metaDraft = $state<number[]>([]); // selección en edición; se aplica al dar Ok

  onMount(async () => {
    loadMacros();
    try {
      const data: Item[] = await fetch('/api/now').then((r) => r.json());
      if (data.length) {
        items = data.map((it) => ({ ...it, macros: it.macros ?? [] }));
        nextId = data.reduce((max, it) => Math.max(max, it.id), 0) + 1;
        return;
      }
    } catch {
      // sin conexión al server: cae al seed por default
    }
    // Primera vez (DB vacía): siembra 7 filas vacías y las persiste.
    items = Array.from({ length: DEFAULT_COUNT }, () => ({ id: nextId++, text: '', macros: [] }));
    save();
  });

  async function loadMacros() {
    try {
      const chips: { id: number; label: string }[] = await fetch('/api/macro').then((r) => r.json());
      macros = chips.map((c) => ({ id: c.id, label: c.label }));
    } catch {
      macros = [];
    }
  }

  function save() {
    fetch('/api/now', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(items)
    }).catch(() => {});
  }

  function addItem() {
    const item = { id: nextId++, text: '', macros: [] };
    items.push(item);
    editOriginal = '';
    editingId = item.id; // entra directo a edición
    save();
  }

  function removeItem(id: number) {
    items = items.filter((it) => it.id !== id);
    if (editingId === id) editingId = null;
    save();
  }

  function startEdit(item: Item) {
    editOriginal = item.text;
    editingId = item.id;
  }

  // Confirmar: guarda lo editado. Lo dispara Enter, la palomita o el clic afuera (blur).
  function confirmEdit(item: Item) {
    if (editingId !== item.id) return;
    item.text = item.text.trim();
    editingId = null;
    save();
  }

  // Cancelar (Esc): revierte al texto original y sale de edición sin guardar lo tecleado.
  function cancelEdit(item: Item) {
    if (editingId !== item.id) return;
    item.text = editOriginal;
    editingId = null;
    save();
  }

  function editKeydown(e: KeyboardEvent, item: Item) {
    if (e.key === 'Enter') {
      (e.currentTarget as HTMLInputElement).blur(); // blur -> confirmEdit
    } else if (e.key === 'Escape') {
      cancelEdit(item); // revierte; el blur posterior no re-guarda (guard por editingId)
    }
  }

  function focusOnMount(el: HTMLInputElement) {
    el.focus();
    el.select();
  }

  // --- Metadatos (modal de Macros) ---
  const metaItem = $derived(items.find((it) => it.id === metaId) ?? null);

  function openMeta(item: Item) {
    loadMacros(); // refresca por si cambiaron los macros
    metaDraft = [...item.macros]; // copia editable
    metaId = item.id;
  }

  function closeMeta() {
    metaId = null; // descarta el borrador
  }

  function toggleMacro(macroId: number) {
    if (metaDraft.includes(macroId)) {
      metaDraft = metaDraft.filter((id) => id !== macroId);
    } else {
      metaDraft = [...metaDraft, macroId];
    }
  }

  // Ok: aplica el borrador al Now y persiste.
  function confirmMeta() {
    const item = items.find((it) => it.id === metaId);
    if (item) {
      item.macros = [...metaDraft];
      save();
    }
    metaId = null;
  }
</script>

<section class="now">
  <header class="now-head">
    <h1>Now</h1>
    <button class="add" type="button" onclick={addItem}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg>
      Agregar elemento
    </button>
  </header>

  <ol class="list">
    {#each items as item, i (item.id)}
      <li class="row">
        <span class="num">{i + 1}</span>
        <a class="icon play" href={`/now/${item.id}`} aria-label="Abrir Now">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </a>

        {#if editingId === item.id}
          <input
            class="item-input"
            type="text"
            placeholder="Escribe algo…"
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
            {item.text || 'Sin texto'}
          </span>
          <button class="icon edit" type="button" aria-label="Editar" onclick={() => startEdit(item)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
          </button>
          <button class="icon meta" class:has-meta={item.macros.length > 0} type="button" aria-label="Metadatos" title="Metadatos" onclick={() => openMeta(item)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" /><circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none" /></svg>
          </button>
        {/if}

        <button class="icon del" type="button" aria-label="Eliminar" onclick={() => removeItem(item.id)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></svg>
        </button>
      </li>
    {/each}
  </ol>
</section>

{#if metaItem}
  <div
    class="modal-overlay"
    role="button"
    tabindex="-1"
    onclick={closeMeta}
    onkeydown={(e) => e.key === 'Escape' && closeMeta()}
  >
    <div class="modal" role="dialog" aria-modal="true" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
      <header class="modal-head">
        <h2>Metadatos</h2>
        <button class="icon" type="button" aria-label="Cerrar" onclick={closeMeta}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </header>

      <p class="modal-sub">¿A qué Macro(s) pertenece este Now?</p>

      {#if macros.length === 0}
        <p class="empty-macros">No hay macros. Crea algunos en la página de Macros.</p>
      {:else}
        <ul class="macro-list">
          {#each macros as macro (macro.id)}
            <li>
              <label class="macro-option">
                <input
                  type="checkbox"
                  checked={metaDraft.includes(macro.id)}
                  onchange={() => toggleMacro(macro.id)}
                />
                <span>{macro.label || '(sin nombre)'}</span>
              </label>
            </li>
          {/each}
        </ul>
      {/if}

      <footer class="modal-foot">
        <button class="btn ghost" type="button" onclick={closeMeta}>Cancelar</button>
        <button class="btn ok" type="button" onclick={confirmMeta}>Ok</button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .now {
    max-width: 640px;
    margin: 0 auto;
    padding: 1.5rem 0.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .now-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  h1 {
    margin: 0;
    font-size: 1.6rem;
    color: #fff;
    letter-spacing: 0.01em;
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
  .num {
    flex-shrink: 0;
    width: 1.5rem;
    text-align: right;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.45);
    font-variant-numeric: tabular-nums;
  }

  /* Texto fijo */
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

  /* Input solo mientras editas */
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
  .icon.meta {
    position: relative;
  }
  .icon.meta:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.22);
  }
  .icon.meta.has-meta {
    color: rgba(147, 197, 253, 0.95);
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
  .icon.play {
    color: rgba(147, 197, 253, 0.9);
    text-decoration: none;
  }
  .icon.play:hover {
    color: #fff;
    background: rgba(37, 99, 235, 0.28);
    border-color: rgba(147, 197, 253, 0.5);
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

  /* --- Modal de metadatos --- */
  .modal-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(3, 10, 30, 0.6);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    z-index: 50;
  }
  .modal {
    width: 100%;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    padding: 1.25rem;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: #16244a;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }
  .modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .modal-head h2 {
    margin: 0;
    font-size: 1.15rem;
    color: #fff;
  }
  .modal-sub {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }
  .empty-macros {
    margin: 0;
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
    font-size: 0.9rem;
  }
  .macro-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .macro-option {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.7rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #fff;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .macro-option:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.25);
  }
  .macro-option input {
    width: 16px;
    height: 16px;
    accent-color: #2563eb;
    cursor: pointer;
  }
  .modal-foot {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
    margin-top: 0.25rem;
  }
  .btn {
    padding: 0.5rem 1.1rem;
    border-radius: 8px;
    border: 1px solid transparent;
    font: inherit;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .btn.ghost {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.22);
    color: rgba(255, 255, 255, 0.8);
  }
  .btn.ghost:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.4);
  }
  .btn.ok {
    background: #2563eb;
    color: #fff;
  }
  .btn.ok:hover {
    background: #1d4ed8;
  }
</style>
