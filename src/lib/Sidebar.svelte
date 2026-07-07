<script lang="ts">
  // Barra lateral "de vidrio" con el mismo tilt 3D que la superior. Incluye el handle
  // para replegar/mostrar. Publica su ancho real a la variable CSS --sidebar-width
  // para que el panel de contenido se ajuste solo. Items de ejemplo: reemplázalos.
  import { page } from '$app/state';

  let {
    collapsed = false,
    toggleCollapsed
  }: {
    collapsed?: boolean;
    toggleCollapsed: () => void;
  } = $props();

  // Now seleccionado: cuando estamos en /now/[id], el +page.server.ts expone
  // `now` en page.data y aquí lo mostramos como sub-item bajo "Now".
  const nowCtx = $derived((page.data as { now?: { id: number; text: string } }).now ?? null);

  let tiltX = $state(0);
  let tiltY = $state(0);
  let sidebarWidth = $state(240);
  let glowX = $state(50);
  let glowY = $state(50);
  let glowOpacity = $state(0);

  $effect(() => {
    if (typeof document !== 'undefined' && !collapsed) {
      document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    }
  });

  function handleMove(e: MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    const MAX = 1.2;
    tiltX = -ny * MAX;
    tiltY = nx * MAX;
    glowX = ((e.clientX - rect.left) / rect.width) * 100;
    glowY = ((e.clientY - rect.top) / rect.height) * 100;
    glowOpacity = 1;
  }
  function handleLeave() {
    tiltX = 0;
    tiltY = 0;
    glowOpacity = 0;
  }
  function handleCollapseClick(e: MouseEvent) {
    e.stopPropagation();
    tiltX = 0;
    tiltY = 0;
    toggleCollapsed();
  }
</script>

{#if !collapsed}
  <aside
    class="sidebar"
    style="transform: perspective(900px) rotateX({tiltX}deg) rotateY({tiltY}deg); --glow-x: {glowX}%; --glow-y: {glowY}%; --glow-opacity: {glowOpacity};"
    bind:clientWidth={sidebarWidth}
    onmousemove={handleMove}
    onmouseleave={handleLeave}
  >
    <div class="sheen" aria-hidden="true"></div>
    <nav>
      <!-- Cada opción lleva un icono alusivo (SVG inline, sin deps). Al agregar una
           opción nueva, ponle también su icono. -->
      <a href="/" class="nav-item" aria-current={page.url.pathname === '/' ? 'page' : undefined}>
        <svg class="nav-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
        <span>Macro</span>
      </a>
      <a href="/seccion-dos" class="nav-item" class:in-path={!!nowCtx} aria-current={page.url.pathname === '/seccion-dos' ? 'page' : undefined}>
        <svg class="nav-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 6h10M11 12h10M11 18h10" /><path d="m3 6 1.5 1.5L7 5" /><path d="m3 12 1.5 1.5L7 11" /><path d="m3 18 1.5 1.5L7 17" /></svg>
        <span>Now</span>
      </a>
      {#if nowCtx}
        <a href={`/now/${nowCtx.id}`} class="nav-sub depth-1" aria-current="page">
          <svg class="sub-ico" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          <span class="text">{nowCtx.text || 'Sin texto'}</span>
        </a>
      {/if}
      <a href="/playbook" class="nav-item" aria-current={page.url.pathname === '/playbook' ? 'page' : undefined}>
        <svg class="nav-ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
        <span>Playbooks</span>
      </a>
    </nav>

    <div class="sidebar-footer">
      <form method="POST" action="/acceso?/logout" class="logout-form">
        <button type="submit" class="logout-btn" aria-label="Cerrar sesión" title="Cerrar sesión">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
          <span>Salir</span>
        </button>
      </form>
      <button type="button" class="collapse-btn" onclick={handleCollapseClick} aria-label="Replegar barra">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
    </div>
  </aside>
{:else}
  <button type="button" class="reveal-handle" onclick={toggleCollapsed} aria-label="Mostrar barra">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
  </button>
{/if}

<style>
  .sidebar {
    position: fixed;
    top: calc(2rem + var(--topnav-height, 64px));
    left: 1rem;
    bottom: 1rem;
    box-sizing: border-box;
    width: max-content;
    min-width: 240px;
    max-width: 380px;
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.012);
    /* url(#wet-glass) distorsiona lo que hay detrás (definido en +layout.svelte);
       -webkit- se queda con blur simple porque Safari no soporta filtros SVG aquí. */
    backdrop-filter: url(#wet-glass) blur(14px) saturate(125%);
    -webkit-backdrop-filter: blur(14px) saturate(125%);
    border: 1px solid #fff;
    border-radius: 16px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 4px 16px rgba(0, 0, 0, 0.12);
    transition: transform 0.18s ease-out;
    will-change: transform;
    user-select: none;
    overflow: hidden;
  }
  .sheen {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(
      circle 60px at var(--glow-x, 50%) var(--glow-y, 50%),
      rgba(255, 255, 255, 0.07),
      rgba(255, 255, 255, 0) 100%
    );
    opacity: var(--glow-opacity, 0);
    transition: opacity 0.25s ease;
    pointer-events: none;
    mix-blend-mode: overlay;
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  nav::-webkit-scrollbar {
    display: none;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.7rem 0.95rem;
    color: rgba(255, 255, 255, 0.92);
    text-decoration: none;
    font-family: Roboto, -apple-system, system-ui, sans-serif;
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: 0.01em;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: background 0.18s ease, border-color 0.18s ease;
  }
  .nav-ico {
    flex-shrink: 0;
    color: rgba(147, 197, 253, 0.85);
  }
  .nav-item:hover {
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(255, 255, 255, 0.16);
  }
  .nav-item[aria-current='page'] {
    color: #fff;
    background: rgba(37, 99, 235, 0.18);
    border-color: rgba(37, 99, 235, 0.45);
    box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.18) inset;
  }
  .nav-item[aria-current='page'] .nav-ico {
    color: #93c5fd;
  }
  /* Parent "Now" resaltado suave cuando hay un Now seleccionado (submenú abierto). */
  .nav-item.in-path {
    color: #fff;
    background: rgba(37, 99, 235, 0.07);
    border-color: rgba(37, 99, 235, 0.22);
  }

  /* Sub-item: el Now seleccionado, anidado bajo "Now" con línea de árbol. */
  .nav-sub {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.95rem 0.5rem 2rem;
    color: rgba(255, 255, 255, 0.82);
    text-decoration: none;
    font-size: 0.85rem;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  }
  .nav-sub:hover {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }
  .nav-sub[aria-current='page'] {
    background: rgba(37, 99, 235, 0.18);
    color: #fff;
    border-color: rgba(37, 99, 235, 0.45);
    box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.18) inset;
  }
  .sub-ico {
    flex-shrink: 0;
    color: rgba(147, 197, 253, 0.9);
  }
  .nav-sub .text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sidebar-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }
  .logout-form {
    margin: 0;
  }
  .logout-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.7rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.8);
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  }
  .logout-btn:hover {
    color: #fff;
    background: rgba(239, 68, 68, 0.16);
    border-color: rgba(239, 68, 68, 0.4);
  }
  .collapse-btn,
  .reveal-handle {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 8px;
    padding: 0.4rem 0.5rem;
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font: inherit;
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  }
  .collapse-btn:hover,
  .reveal-handle:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.24);
    color: #fff;
  }
  .reveal-handle {
    position: fixed;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    padding: 0.55rem 0.45rem;
    border-radius: 12px;
    border: 1px solid #fff;
    background: rgba(255, 255, 255, 0.012);
    backdrop-filter: blur(8px) saturate(110%);
    -webkit-backdrop-filter: blur(8px) saturate(110%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 4px 16px rgba(0, 0, 0, 0.12);
    z-index: 10;
  }
</style>
