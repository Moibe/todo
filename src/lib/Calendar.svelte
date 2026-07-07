<script lang="ts">
  // Calendario de mes. Muestra las tasks agendadas (por fecha) del Now actual y
  // acepta que se arrastren tasks a un día para agendarlas (o reagendarlas).
  // Comparte datos con TasksList vía tasksStore.
  import { onMount } from 'svelte';
  import { tasksStore } from '$lib/tasksStore.svelte';

  let { nowId }: { nowId: number } = $props();

  const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  let viewY = $state(todayY);
  let viewM = $state(todayM);
  let dragOverDay = $state<number | null>(null);

  onMount(() => {
    tasksStore.load();
  });

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = (d: number) => `${viewY}-${pad(viewM + 1)}-${pad(d)}`;

  // Grilla del mes: huecos iniciales (lunes-first) + días 1..n.
  const cells = $derived.by(() => {
    const first = new Date(viewY, viewM, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < offset; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(d);
    return out;
  });

  // Tasks (de este Now) agendadas en un día dado.
  function tasksOn(d: number) {
    const ds = dateStr(d);
    return tasksStore.forNow(nowId).filter((t) => t.fecha === ds);
  }

  function prevMonth() {
    if (viewM === 0) { viewM = 11; viewY -= 1; } else { viewM -= 1; }
  }
  function nextMonth() {
    if (viewM === 11) { viewM = 0; viewY += 1; } else { viewM += 1; }
  }
  function goToday() {
    viewY = todayY;
    viewM = todayM;
  }

  const isToday = (d: number) => d === todayD && viewM === todayM && viewY === todayY;

  function onDrop(e: DragEvent, d: number) {
    e.preventDefault();
    dragOverDay = null;
    const raw = e.dataTransfer?.getData('text/plain');
    if (raw == null || raw === '') return;
    const id = Number(raw);
    if (Number.isNaN(id)) return;
    tasksStore.setDate(id, dateStr(d));
  }
</script>

<section class="calendar">
  <header class="cal-head">
    <h2>Calendario</h2>
    <button class="today-btn" type="button" onclick={goToday}>Hoy</button>
  </header>

  <div class="cal-card">
    <div class="cal-nav">
      <button class="nav-btn" type="button" aria-label="Mes anterior" onclick={prevMonth}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <span class="cal-title">{MONTHS[viewM]} {viewY}</span>
      <button class="nav-btn" type="button" aria-label="Mes siguiente" onclick={nextMonth}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>

    <div class="grid weekdays">
      {#each WEEKDAYS as wd}
        <span class="wd">{wd}</span>
      {/each}
    </div>

    <div class="grid days">
      {#each cells as cell}
        {#if cell === null}
          <span class="cell blank"></span>
        {:else}
          {@const dayTasks = tasksOn(cell)}
          <div
            class="cell day"
            class:today={isToday(cell)}
            class:drag-over={dragOverDay === cell}
            class:has-tasks={dayTasks.length > 0}
            role="gridcell"
            title={dayTasks.length ? dayTasks.map((t) => t.text || 'Sin nombre').join('\n') : undefined}
            ondragover={(e) => {
              e.preventDefault();
              dragOverDay = cell;
            }}
            ondragleave={() => {
              if (dragOverDay === cell) dragOverDay = null;
            }}
            ondrop={(e) => onDrop(e, cell)}
          >
            <span class="daynum">{cell}</span>
            {#if dayTasks.length}
              <span class="dot" aria-label={`${dayTasks.length} task(s)`}>{dayTasks.length}</span>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  </div>
</section>

<style>
  .calendar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .cal-head {
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
  .today-btn {
    flex-shrink: 0;
    padding: 0.4rem 0.9rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.9);
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .today-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.35);
  }

  .cal-card {
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }
  .cal-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .cal-title {
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.01em;
  }
  .nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  }
  .nav-btn:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.22);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.25rem;
  }
  .weekdays .wd {
    text-align: center;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: rgba(255, 255, 255, 0.45);
    padding: 0.2rem 0;
  }
  .cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    border-radius: 8px;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.85);
  }
  .cell.day {
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .cell.day:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.2);
  }
  .cell.today {
    background: rgba(37, 99, 235, 0.3);
    border-color: rgba(147, 197, 253, 0.65);
    color: #fff;
    font-weight: 700;
    box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.25) inset;
  }
  /* Resalte al arrastrar una task encima */
  .cell.drag-over {
    background: rgba(34, 197, 94, 0.28);
    border-color: rgba(134, 239, 172, 0.8);
    box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.4) inset;
  }
  .cell.has-tasks .daynum {
    font-weight: 700;
    color: #fff;
  }
  .cell.blank {
    border: none;
  }
  .dot {
    position: absolute;
    bottom: 3px;
    right: 3px;
    min-width: 15px;
    height: 15px;
    padding: 0 3px;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: rgba(147, 197, 253, 0.9);
    color: #0a2a5e;
    font-size: 0.62rem;
    font-weight: 700;
    line-height: 1;
  }
</style>
