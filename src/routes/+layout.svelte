<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import favicon from '$lib/assets/favicon.svg';
  import TopNav from '$lib/TopNav.svelte';
  import Sidebar from '$lib/Sidebar.svelte';
  import Starfield from '$lib/Starfield.svelte';

  let { children }: { children: Snippet } = $props();
  let collapsed = $state(false);

  // La pantalla de acceso se muestra sola (sin navbar/sidebar) sobre el starfield.
  const isAcceso = $derived(page.url.pathname === '/acceso');

  // View Transitions cuando el browser las soporta para animar el repliegue.
  function withTransition(fn: () => void) {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(fn);
    } else {
      fn();
    }
  }
  function toggleCollapsed() {
    withTransition(() => {
      collapsed = !collapsed;
    });
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<!-- Filtro compartido: distorsiona lo que hay detrás como si se viera a través de
     vidrio mojado. Lo referencian TopNav/Sidebar vía backdrop-filter: url(#wet-glass). -->
<svg class="wet-glass-defs" aria-hidden="true">
  <filter id="wet-glass">
    <!-- ruido más grande y pre-blureado antes de desplazar: así ondula en vez de
         "pixelar" los puntos chicos (estrellas) que hay detrás del vidrio. -->
    <feTurbulence type="fractalNoise" baseFrequency="0.007 0.012" numOctaves="2" seed="7" result="noise" />
    <feGaussianBlur in="noise" stdDeviation="4" result="softNoise" />
    <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="9" xChannelSelector="R" yChannelSelector="G" />
  </filter>
</svg>

<Starfield />
{#if isAcceso}
  <main class="auth-main">
    {@render children()}
  </main>
{:else}
  <TopNav />
  <Sidebar {collapsed} {toggleCollapsed} />
  <main class={collapsed ? 'collapsed' : ''}>
    <div class="work-scroll">
      {@render children()}
    </div>
  </main>
{/if}

<style>
  :global(:root) {
    --topnav-height: 64px;
  }

  .wet-glass-defs {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }

  :global(html, body) {
    margin: 0;
    padding: 0;
    height: 100%;
  }
  :global(body) {
    min-height: 100vh;
    background: linear-gradient(135deg, #0a2a5e 0%, #030d1f 100%);
    background-attachment: fixed;
    color: rgba(255, 255, 255, 0.95);
    font-family: Roboto, system-ui, -apple-system, 'Segoe UI', sans-serif;
    font-weight: 700;
  }

  :global(*) {
    scrollbar-width: auto;
    scrollbar-color: rgba(255, 255, 255, 0.55) rgba(255, 255, 255, 0.1);
  }
  :global(::-webkit-scrollbar) {
    width: 14px;
    height: 14px;
  }
  :global(::-webkit-scrollbar-track) {
    background: rgba(255, 255, 255, 0.07);
    border-radius: 999px;
  }
  :global(::-webkit-scrollbar-thumb) {
    background: rgba(255, 255, 255, 0.55);
    border-radius: 999px;
    border: 3px solid transparent;
    background-clip: padding-box;
  }
  :global(::-webkit-scrollbar-thumb:hover) {
    background: rgba(255, 255, 255, 0.78);
    background-clip: padding-box;
  }

  main {
    position: fixed;
    top: calc(2rem + var(--topnav-height));
    right: 1rem;
    bottom: 1rem;
    box-sizing: border-box;
    background: rgba(255, 255, 255, 0.012);
    backdrop-filter: blur(8px) saturate(110%);
    -webkit-backdrop-filter: blur(8px) saturate(110%);
    border: 1px solid #fff;
    border-radius: 16px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 4px 16px rgba(0, 0, 0, 0.12);
    overflow: hidden;
    transition: left 0.22s ease-out;
    left: calc(var(--sidebar-width, 240px) + 2rem);
  }
  main.collapsed {
    left: 2rem;
  }

  /* Pantalla de acceso: contenedor a pantalla completa, centrado, sin el panel glass. */
  main.auth-main {
    position: fixed;
    inset: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: none;
    border: none;
    border-radius: 0;
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    overflow: auto;
  }

  .work-scroll {
    position: absolute;
    top: 16px;
    bottom: 16px;
    left: 0;
    right: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 16px;
  }
</style>
