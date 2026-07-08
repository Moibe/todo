<script lang="ts">
  // Barra superior "de vidrio" con tilt 3D al pasar el mouse + responsive (en móvil
  // colapsa a solo-íconos). Los items son de ejemplo: reemplázalos por los de tu app.
  import { page } from '$app/state';

  let tiltX = $state(0);
  let tiltY = $state(0);
  let glowX = $state(50);
  let glowY = $state(50);
  let glowOpacity = $state(0);

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

  // Edita estos items por las secciones reales de tu app. La navegación real vive
  // en el Sidebar; aquí el brand ya enlaza a "/", así que se dejó vacío.
  const items: { href: string; label: string }[] = [];
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<header
  class="topnav"
  style="transform: perspective(900px) rotateX({tiltX}deg) rotateY({tiltY}deg); --glow-x: {glowX}%; --glow-y: {glowY}%; --glow-opacity: {glowOpacity};"
  onmousemove={handleMove}
  onmouseleave={handleLeave}
>
  <div class="sheen" aria-hidden="true"></div>
  <a href="/" class="brand" aria-label="Inicio">
    <span class="brand-ico" aria-hidden="true"></span>
    <span class="brand-title">todo</span>
  </a>

  {#if items.length}
    <nav class="topnav-nav">
      {#each items as it (it.href)}
        <a href={it.href} class="nav-item" aria-current={page.url.pathname === it.href ? 'page' : undefined}>
          {it.label}
        </a>
      {/each}
    </nav>
  {/if}
</header>

<style>
  .topnav {
    position: fixed;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    height: var(--topnav-height, 64px);
    padding: 0 1.25rem;
    box-sizing: border-box;
    display: flex;
    align-items: center;
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
    z-index: 9;
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

  .brand {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    color: rgba(255, 255, 255, 0.98);
    text-decoration: none;
    border-radius: 8px;
    padding: 0.25rem 0.4rem;
    transition: background 0.18s ease;
  }
  .brand:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  .brand-ico {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.85);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
  .brand-title {
    font-size: 1.2rem;
    letter-spacing: 0.005em;
    text-shadow:
      0 0 10px rgba(255, 255, 255, 0.28),
      0 0 24px rgba(255, 255, 255, 0.14);
  }

  .topnav-nav {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-left: 1.25rem;
    padding-left: 1.25rem;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
  }

  .nav-item {
    display: inline-block;
    padding: 0.45rem 0.8rem;
    color: rgba(255, 255, 255, 0.88);
    text-decoration: none;
    font-size: 0.9rem;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
    white-space: nowrap;
  }
  .nav-item:hover {
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(255, 255, 255, 0.16);
    color: #fff;
  }
  .nav-item[aria-current='page'] {
    color: #fff;
    background: rgba(37, 99, 235, 0.18);
    border-color: rgba(37, 99, 235, 0.45);
    box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.18) inset;
  }

  /* En pantallas chicas: solo íconos (oculta texto y título) para que no se desborde. */
  @media (max-width: 680px) {
    .topnav {
      padding: 0 0.6rem;
    }
    .brand {
      gap: 0;
      padding: 0.25rem;
    }
    .brand-title {
      display: none;
    }
    .topnav-nav {
      margin-left: 0.5rem;
      padding-left: 0.5rem;
      gap: 0.1rem;
    }
    .nav-item {
      padding: 0.45rem 0.5rem;
    }
  }
  @media (max-width: 360px) {
    .topnav {
      padding: 0 0.4rem;
    }
    .topnav-nav {
      margin-left: 0.35rem;
      padding-left: 0.35rem;
    }
    .nav-item {
      padding: 0.45rem 0.35rem;
    }
  }
</style>
