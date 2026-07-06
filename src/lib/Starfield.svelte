<script lang="ts">
  // Campo de estrellas discreto: puntos azules muy tenues que titilan y derivan
  // a velocidad casi imperceptible. Vive en un canvas transparente, fijo detrás
  // del chrome de vidrio (que lo ve blurreado a través del backdrop-filter).
  // De vez en cuando una estrella suelta un destello más brillante, y muy de vez
  // en cuando cruza un cometa/estrella fugaz.
  import { onMount } from 'svelte';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    type Star = {
      x: number;
      y: number;
      r: number;
      baseAlpha: number;
      twinklePhase: number;
      twinkleSpeed: number;
      driftX: number;
      driftY: number;
      hue: number;
      flareStart: number | null;
      flareDuration: number;
    };

    type Comet = {
      startX: number;
      startY: number;
      vx: number; // px/s
      vy: number; // px/s
      born: number; // segundos (timestamp de rAF / 1000)
      life: number; // duración total en segundos
    };

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let comets: Comet[] = [];
    let nextCometAt = 0;
    let raf = 0;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      // Densidad baja a propósito: se ve como un cielo, no como confeti.
      const count = Math.max(50, Math.min(170, Math.round((width * height) / 9000)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.1 + 0.25,
        baseAlpha: Math.random() * 0.45 + 0.2,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.5 + 0.12,
        driftX: (Math.random() - 0.5) * 0.008,
        driftY: (Math.random() - 0.5) * 0.008,
        hue: 205 + Math.random() * 30, // azules brillantes
        flareStart: null,
        flareDuration: 0
      }));
    }

    function scheduleNextComet(time: number) {
      // cada 7-20s en promedio: "muy de vez en cuando"
      nextCometAt = time + 7 + Math.random() * 13;
    }

    function spawnComet(time: number) {
      const fromLeft = Math.random() < 0.5;
      const angleDeg = 18 + Math.random() * 32; // trayectoria diagonal, no horizontal plana
      const angle = (angleDeg * Math.PI) / 180;
      const speed = 700 + Math.random() * 380;
      const dir = fromLeft ? 1 : -1;
      comets.push({
        startX: fromLeft ? -60 : width + 60,
        startY: Math.random() * height * 0.55,
        vx: dir * speed * Math.cos(angle),
        vy: speed * Math.sin(angle),
        born: time,
        life: 1.6
      });
    }

    function drawComet(comet: Comet, time: number) {
      const age = time - comet.born;
      const x = comet.startX + comet.vx * age;
      const y = comet.startY + comet.vy * age;
      // se apaga suave hacia el final de su vida en vez de cortarse en seco
      const fade = Math.min(1, (comet.life - age) / 0.4);
      const alpha = Math.max(0, Math.min(1, fade));
      if (alpha <= 0) return;

      const trailLen = 0.14; // segundos de "cola" hacia atrás
      const tailX = x - comet.vx * trailLen;
      const tailY = y - comet.vy * trailLen;

      const grad = ctx!.createLinearGradient(tailX, tailY, x, y);
      grad.addColorStop(0, `rgba(210, 230, 255, 0)`);
      grad.addColorStop(1, `rgba(230, 240, 255, ${0.75 * alpha})`);

      ctx!.beginPath();
      ctx!.strokeStyle = grad;
      ctx!.lineWidth = 1.6;
      ctx!.lineCap = 'round';
      ctx!.moveTo(tailX, tailY);
      ctx!.lineTo(x, y);
      ctx!.stroke();

      ctx!.beginPath();
      ctx!.fillStyle = `rgba(255, 255, 255, ${0.9 * alpha})`;
      ctx!.shadowColor = `rgba(200, 225, 255, ${0.8 * alpha})`;
      ctx!.shadowBlur = 6;
      ctx!.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx!.fill();
    }

    function frame(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const time = t / 1000;

      for (const s of stars) {
        if (!reduceMotion) {
          s.x += s.driftX;
          s.y += s.driftY;
          if (s.x < 0) s.x += width;
          if (s.x > width) s.x -= width;
          if (s.y < 0) s.y += height;
          if (s.y > height) s.y -= height;

          // destello aleatorio ocasional: muy baja probabilidad por frame y por estrella
          if (s.flareStart === null && Math.random() < 0.0006) {
            s.flareStart = time;
            s.flareDuration = 0.5 + Math.random() * 0.6;
          }
        }

        const twinkle = reduceMotion ? 1 : 0.55 + 0.45 * Math.sin(time * s.twinkleSpeed + s.twinklePhase);
        let alpha = s.baseAlpha * twinkle;
        let radius = s.r;

        if (s.flareStart !== null) {
          const elapsed = time - s.flareStart;
          if (elapsed >= s.flareDuration) {
            s.flareStart = null;
          } else {
            const flareShape = Math.sin((Math.PI * elapsed) / s.flareDuration); // sube y baja
            alpha = Math.min(1, alpha + flareShape * 0.85);
            radius = s.r + flareShape * 1.8;
          }
        }

        ctx.beginPath();
        ctx.fillStyle = `hsla(${s.hue}, 95%, 78%, ${alpha})`;
        ctx.shadowColor = `hsla(${s.hue}, 100%, 70%, ${alpha * 0.85})`;
        ctx.shadowBlur = radius * 2.5;
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) {
        if (time >= nextCometAt && comets.length < 1) {
          spawnComet(time);
          scheduleNextComet(time);
        }
        comets = comets.filter((c) => time - c.born < c.life);
        for (const comet of comets) drawComet(comet, time);
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener('resize', resize);
    scheduleNextComet(0);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  });
</script>

<canvas bind:this={canvas} class="starfield" aria-hidden="true"></canvas>

<style>
  .starfield {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    /* Por encima de las barras de vidrio (z-index 9/10): si quedara detrás, su propio
       backdrop-filter: blur() difumina estrellas de 1-2px hasta volverlas invisibles. */
    z-index: 20;
    pointer-events: none;
  }
</style>
