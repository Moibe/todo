<script lang="ts">
  // Pizarra de prueba: dibujar a mano con el mouse (canvas) + cajas de texto por
  // teclado. Prototipo en memoria (no persiste todavía). Dos herramientas: Lápiz
  // y Texto. En modo Lápiz, las cajas de texto no interceptan (pointer-events off)
  // para poder rayar libremente encima.
  import { onMount } from 'svelte';

  type Pt = { x: number; y: number };
  type Stroke = { color: string; width: number; points: Pt[] };
  type TextItem = { id: number; x: number; y: number; text: string; color: string };

  const COLORS = ['#ffffff', '#93c5fd', '#fca5a5', '#86efac', '#fde047'];

  let tool = $state<'draw' | 'text'>('draw');
  let color = $state('#ffffff');
  let texts = $state<TextItem[]>([]);

  let strokes: Stroke[] = []; // imperativo (canvas); no necesita reactividad
  let nextId = 1;

  let board: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let dpr = 1;
  let drawing = false;
  let cur: Stroke | null = null;

  onMount(() => {
    ctx = canvas.getContext('2d');
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(board);
    return () => ro.disconnect();
  });

  function resize() {
    if (!canvas || !ctx) return;
    dpr = window.devicePixelRatio || 1;
    const r = board.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    redraw();
  }

  function redraw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of strokes) drawStroke(s);
  }

  function drawStroke(s: Stroke) {
    if (!ctx || s.points.length === 0) return;
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.width;
    if (s.points.length === 1) {
      ctx.beginPath();
      ctx.arc(s.points[0].x, s.points[0].y, s.width / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
    ctx.stroke();
  }

  function localPt(e: PointerEvent): Pt {
    const r = board.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onPointerDown(e: PointerEvent) {
    if (tool === 'text') {
      const p = localPt(e);
      const id = nextId++;
      texts = [...texts, { id, x: p.x, y: p.y, text: '', color }];
      requestAnimationFrame(() => {
        (board.querySelector(`[data-tid="${id}"]`) as HTMLElement | null)?.focus();
      });
      return;
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drawing = true;
    cur = { color, width: 2.5, points: [localPt(e)] };
    strokes.push(cur);
    drawStroke(cur); // punto inicial
  }

  function onPointerMove(e: PointerEvent) {
    if (!drawing || !cur || !ctx) return;
    const p = localPt(e);
    const a = cur.points[cur.points.length - 1];
    cur.points.push(p);
    ctx.strokeStyle = cur.color;
    ctx.lineWidth = cur.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function onPointerUp() {
    drawing = false;
    cur = null;
  }

  function undo() {
    if (strokes.length) {
      strokes.pop();
      redraw();
    }
  }
  function clearAll() {
    strokes = [];
    texts = [];
    redraw();
  }
  function onTextBlur(t: TextItem) {
    if (!t.text.trim()) texts = texts.filter((x) => x.id !== t.id);
  }
</script>

<section class="whiteboard">
  <header class="wb-head">
    <h2>Pizarra <span class="tag">prueba</span></h2>
    <div class="toolbar">
      <div class="tools">
        <button class="tool" class:active={tool === 'draw'} type="button" onclick={() => (tool = 'draw')} title="Lápiz">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
        </button>
        <button class="tool" class:active={tool === 'text'} type="button" onclick={() => (tool = 'text')} title="Texto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5h16v2" /><path d="M12 5v14" /><path d="M9 19h6" /></svg>
        </button>
      </div>
      <div class="swatches">
        {#each COLORS as c}
          <button
            class="swatch"
            class:active={color === c}
            type="button"
            style="background:{c};"
            aria-label={`color ${c}`}
            onclick={() => (color = c)}
          ></button>
        {/each}
      </div>
      <button class="txt-btn" type="button" onclick={undo}>Deshacer</button>
      <button class="txt-btn danger" type="button" onclick={clearAll}>Limpiar</button>
    </div>
  </header>

  <div
    class="board"
    class:draw={tool === 'draw'}
    class:text={tool === 'text'}
    bind:this={board}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
  >
    <canvas bind:this={canvas}></canvas>
    {#each texts as t (t.id)}
      <div
        class="text-item"
        data-tid={t.id}
        contenteditable="true"
        bind:innerText={t.text}
        spellcheck="false"
        style="left:{t.x}px; top:{t.y}px; color:{t.color};"
        onpointerdown={(e) => e.stopPropagation()}
        onblur={() => onTextBlur(t)}
      ></div>
    {/each}
  </div>
  <p class="wb-hint">
    {tool === 'draw' ? 'Lápiz: clic y arrastra para rayar.' : 'Texto: haz clic en la pizarra y escribe.'}
  </p>
</section>

<style>
  .whiteboard {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .wb-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  h2 {
    margin: 0;
    font-size: 1.15rem;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 0.01em;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  .tag {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    background: rgba(147, 197, 253, 0.18);
    border: 1px solid rgba(147, 197, 253, 0.35);
    color: #cfe3ff;
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .tools,
  .swatches {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
  .tool {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }
  .tool:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
  .tool.active {
    color: #fff;
    background: rgba(37, 99, 235, 0.3);
    border-color: rgba(147, 197, 253, 0.6);
  }
  .swatch {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.25);
    cursor: pointer;
    padding: 0;
    transition: transform 0.1s ease, border-color 0.15s ease;
  }
  .swatch:hover {
    transform: scale(1.12);
  }
  .swatch.active {
    border-color: #fff;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.5);
  }
  .txt-btn {
    padding: 0.4rem 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.85);
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .txt-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.35);
  }
  .txt-btn.danger:hover {
    background: rgba(239, 68, 68, 0.18);
    border-color: rgba(239, 68, 68, 0.4);
    color: #fff;
  }

  .board {
    position: relative;
    width: 100%;
    height: 460px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.03);
    overflow: hidden;
    touch-action: none;
  }
  .board.draw {
    cursor: crosshair;
  }
  .board.text {
    cursor: text;
  }
  canvas {
    position: absolute;
    inset: 0;
  }
  .text-item {
    position: absolute;
    min-width: 1ch;
    padding: 0 2px;
    font-weight: 400;
    font-size: 1rem;
    line-height: 1.3;
    white-space: pre;
    outline: none;
    cursor: text;
  }
  .text-item:focus {
    box-shadow: 0 0 0 1px rgba(147, 197, 253, 0.7);
    border-radius: 3px;
  }
  /* En modo lápiz, las cajas de texto no interceptan el puntero: dibujas encima. */
  .board.draw .text-item {
    pointer-events: none;
  }
  .wb-hint {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.45);
  }
</style>
