<script lang="ts">
  import { onMount } from 'svelte';

  type Chip = { id: number; label: string; x: number; y: number };

  const LABELS = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete'];

  let chips = $state<Chip[]>(
    LABELS.map((label, i) => ({
      id: i,
      label,
      x: 24 + (i % 4) * 130,
      y: 24 + Math.floor(i / 4) * 76
    }))
  );

  onMount(async () => {
    try {
      const data: Chip[] = await fetch('/api/macro').then((r) => r.json());
      if (data.length) {
        chips = data;
      } else {
        saveState(); // primera vez (DB vacía): persiste los 7 chips por default
      }
    } catch {
      // sin conexión: se queda con el layout por default
    }
  });

  function saveState() {
    fetch('/api/macro', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(chips)
    }).catch(() => {});
  }

  let surface: HTMLDivElement | undefined = $state();
  let draggingId: number | null = $state(null);
  let editingId: number | null = $state(null);
  let editingOriginal = '';
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let draggingEl: HTMLElement | null = null;

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  // Nota: usamos listeners en window en vez de setPointerCapture — capturar el
  // puntero en el propio chip rompe la síntesis nativa de "dblclick" del navegador.
  function startDrag(e: PointerEvent, chip: Chip) {
    if (editingId === chip.id) return;
    draggingId = chip.id;
    draggingEl = e.currentTarget as HTMLElement;
    const rect = draggingEl.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    window.addEventListener('pointermove', onDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
  }

  function onDrag(e: PointerEvent) {
    if (draggingId === null || !surface || !draggingEl) return;
    const chip = chips.find((c) => c.id === draggingId);
    if (!chip) return;
    const bounds = surface.getBoundingClientRect();
    chip.x = clamp(e.clientX - bounds.left - dragOffsetX, 0, bounds.width - draggingEl.offsetWidth);
    chip.y = clamp(e.clientY - bounds.top - dragOffsetY, 0, bounds.height - draggingEl.offsetHeight);
  }

  function endDrag() {
    if (draggingId === null) return;
    window.removeEventListener('pointermove', onDrag);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
    draggingId = null;
    draggingEl = null;
    saveState();
  }

  function startEdit(chip: Chip) {
    editingOriginal = chip.label;
    editingId = chip.id;
  }

  function finishEdit(chip: Chip) {
    if (editingId !== chip.id) return;
    if (chip.label.trim() === '') chip.label = editingOriginal;
    else chip.label = chip.label.trim();
    editingId = null;
    saveState();
  }

  function editKeydown(e: KeyboardEvent, chip: Chip) {
    if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
  }

  function focusOnMount(el: HTMLInputElement) {
    el.focus();
    el.select();
  }

  // Hace que el input crezca EN VIVO con lo que se escribe: mide el texto con un
  // espejo oculto en la misma tipografía y ajusta el ancho en cada tecla.
  function autosize(input: HTMLInputElement) {
    const cs = getComputedStyle(input);
    const mirror = document.createElement('span');
    Object.assign(mirror.style, {
      position: 'absolute',
      top: '-9999px',
      left: '-9999px',
      visibility: 'hidden',
      whiteSpace: 'pre',
      fontSize: cs.fontSize,
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      letterSpacing: cs.letterSpacing
    });
    document.body.appendChild(mirror);
    const MIN = 32; // px
    const resize = () => {
      mirror.textContent = input.value || input.placeholder || '';
      input.style.width = Math.max(MIN, mirror.offsetWidth + 4) + 'px';
    };
    resize();
    input.addEventListener('input', resize);
    return {
      destroy() {
        input.removeEventListener('input', resize);
        mirror.remove();
      }
    };
  }
</script>

<div class="surface" bind:this={surface}>
  {#each chips as chip (chip.id)}
    <div
      class="chip"
      class:dragging={draggingId === chip.id}
      style="left: {chip.x}px; top: {chip.y}px;"
      onpointerdown={(e) => startDrag(e, chip)}
    >
      {#if editingId === chip.id}
        <input
          class="label-input"
          bind:value={chip.label}
          use:focusOnMount
          use:autosize
          onblur={() => finishEdit(chip)}
          onkeydown={(e) => editKeydown(e, chip)}
          onpointerdown={(e) => e.stopPropagation()}
        />
      {:else}
        <span class="label" ondblclick={() => startEdit(chip)}>{chip.label}</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .surface {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 480px;
  }

  .chip {
    position: absolute;
    padding: 0.55rem 1.15rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(6px) saturate(120%);
    -webkit-backdrop-filter: blur(6px) saturate(120%);
    font: inherit;
    font-size: 0.95rem;
    letter-spacing: 0.02em;
    cursor: grab;
    touch-action: none;
    user-select: none;
    box-shadow:
      0 2px 10px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      0 0 18px rgba(255, 255, 255, 0.45);
    transition: box-shadow 0.15s ease, transform 0.1s ease, background 0.15s ease;
  }
  .chip:hover {
    background: rgba(255, 255, 255, 0.14);
  }
  .chip.dragging {
    cursor: grabbing;
    transform: scale(1.08);
    background: rgba(37, 99, 235, 0.3);
    border-color: rgba(147, 197, 253, 0.65);
    box-shadow:
      0 10px 26px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      0 0 24px rgba(255, 255, 255, 0.6);
    z-index: 5;
    transition: none;
  }

  .label {
    color: #fff;
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
  }

  .label-input {
    width: 32px; /* la acción autosize sobre-escribe este ancho en vivo */
    min-width: 32px;
    background: transparent;
    border: none;
    outline: none;
    padding: 0;
    color: #fff;
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
    font: inherit;
    font-size: 0.95rem;
    letter-spacing: 0.02em;
    text-align: center;
    cursor: text;
  }
</style>
