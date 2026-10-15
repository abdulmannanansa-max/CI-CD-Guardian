import { useEffect, useRef } from 'react';

const labels = ['COMMIT', 'BUILD', 'TEST', 'SECURITY', 'DEPLOY'];
const eventWords = ['build ok', 'test failed', 'root cause: flaky test', 'auto-flagged'];

export default function PipelineBackdrop({ active, connecting, failed, hoveredExample }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ active, connecting, failed, hoveredExample });
  stateRef.current = { active, connecting, failed, hoveredExample };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const theme = getComputedStyle(document.documentElement);
    const palette = { green: theme.getPropertyValue('--mint').trim(), red: theme.getPropertyValue('--coral').trim(), node: theme.getPropertyValue('--cobalt').trim(), amber: theme.getPropertyValue('--citron').trim(), line: 'rgba(var(--text-muted-rgb),.45)', text: 'rgba(var(--text-rgb),.82)' };
    const particles = [];
    const bursts = [];
    const nodePulse = labels.map(() => 0);
    let width = 0; let height = 0; let dpr = 1; let raf = 0; let lastFrame = 0; let lastSpawn = 0; let scanner = 0; let lastFailed = false; let wasConnecting = false; let pointer = { x: 0, y: 0 };
    const points = () => labels.map((_, index) => ({ x: width * (.08 + index * .21) + pointer.x * -5, y: height * (index % 2 ? .78 : .22) + pointer.y * -4 }));

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width; height = rect.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0, true);
    }
    function draw(time, staticFrame = false) {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      const nodes = points();
      ctx.lineWidth = 2; ctx.strokeStyle = palette.line; ctx.shadowBlur = 12; ctx.shadowColor = 'var(--lilac)';
      ctx.beginPath(); ctx.moveTo(nodes[0].x, nodes[0].y);
      for (let i = 1; i < nodes.length; i += 1) {
        const midX = (nodes[i - 1].x + nodes[i].x) / 2;
        ctx.bezierCurveTo(midX, nodes[i - 1].y, midX, nodes[i].y, nodes[i].x, nodes[i].y);
      }
      ctx.stroke(); ctx.shadowBlur = 0;
      nodes.forEach((node, i) => {
        const pulse = staticFrame ? 0 : nodePulse[i];
        ctx.beginPath(); ctx.arc(node.x, node.y, 6 + pulse * 4, 0, Math.PI * 2);
        ctx.fillStyle = pulse > .05 ? palette.green : pulse < -.05 ? palette.red : 'rgba(var(--mint-rgb),.98)';
        ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = pulse > .05 ? palette.green : pulse < -.05 ? palette.red : palette.node; ctx.stroke();
        ctx.fillStyle = palette.text; ctx.font = '10px "DM Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText(labels[i], node.x, node.y + 24);
      });
      if (!staticFrame) {
        for (const p of particles) {
          const segment = Math.min(nodes.length - 2, Math.floor(p.progress * (nodes.length - 1)));
          const local = p.progress * (nodes.length - 1) - segment;
          const a = nodes[segment]; const b = nodes[segment + 1];
          const x = a.x + (b.x - a.x) * local; const y = a.y + (b.y - a.y) * local;
          const jitter = p.failed && !p.caught ? (Math.random() - .5) * 5 : 0;
          ctx.beginPath(); ctx.moveTo(x - 11, y); ctx.lineTo(x + jitter, y + jitter);
          ctx.strokeStyle = p.failed && !p.caught ? 'rgba(var(--coral-rgb),.45)' : 'rgba(var(--mint-rgb),.45)'; ctx.lineWidth = 2; ctx.stroke();
          ctx.beginPath(); ctx.arc(x + jitter, y + jitter, 3, 0, Math.PI * 2); ctx.fillStyle = p.failed && !p.caught ? palette.red : palette.green; ctx.fill();
          if (p.tag && p.progress < .16 && p.progress > .03) { ctx.fillStyle = palette.text; ctx.textAlign = 'left'; ctx.font = '10px "DM Mono", monospace'; ctx.fillText(p.tag, x, y - 10); }
          if (p.eventLife > 0) { ctx.globalAlpha = Math.min(1, p.eventLife); ctx.fillStyle = p.failed && !p.caught ? palette.red : palette.green; ctx.textAlign = 'center'; ctx.font = '10px "DM Mono", monospace'; ctx.fillText(p.eventText, x, y - 13); ctx.globalAlpha = 1; p.eventLife -= .006; }
          if (p.failed && !p.caught && p.progress > p.failAt) p.progress = p.failAt;
        }
        for (let i = bursts.length - 1; i >= 0; i -= 1) {
          const burst = bursts[i]; ctx.beginPath(); ctx.arc(burst.x, burst.y, 4 + (1 - burst.life) * 18, 0, Math.PI * 2); ctx.strokeStyle = `rgba(44,255,179,${burst.life})`; ctx.lineWidth = 2; ctx.stroke(); burst.life -= .04; if (burst.life <= 0) bursts.splice(i, 1);
        }
        const beamX = width * scanner; const beam = ctx.createLinearGradient(beamX - 18, 0, beamX + 18, 0); beam.addColorStop(0, `${palette.amber}00`); beam.addColorStop(.5, `${palette.amber}b8`); beam.addColorStop(1, `${palette.amber}00`);
        ctx.fillStyle = beam; ctx.fillRect(beamX - 18, 0, 36, height); ctx.fillStyle = palette.amber; ctx.globalAlpha = .62; ctx.fillRect(beamX, 0, 1, height); ctx.globalAlpha = 1;
        if (beamX > 0 && beamX < width) {
          particles.forEach((p) => { if (p.failed && !p.caught) { const segment = Math.min(nodes.length - 2, Math.floor(p.progress * (nodes.length - 1))); const local = p.progress * (nodes.length - 1) - segment; const x = nodes[segment].x + (nodes[segment + 1].x - nodes[segment].x) * local; if (Math.abs(x - beamX) < 10) { p.caught = true; p.failed = false; bursts.push({ x: beamX, y: nodes[segment].y + (nodes[segment + 1].y - nodes[segment].y) * local, life: 1 }); } } });
        }
        if (stateRef.current.failed && !lastFailed) { nodePulse.forEach((_, i) => { nodePulse[i] = -1; }); }
        lastFailed = stateRef.current.failed;
        if (stateRef.current.connecting) { nodePulse.forEach((_, i) => { nodePulse[i] = Math.max(nodePulse[i], ((time / 170) | 0) % 5 === i ? 1 : 0); }); }
      }
    }
    function frame(time) {
      raf = 0;
      if (document.hidden) return;
      if (time - lastFrame < 1000 / 60) { raf = requestAnimationFrame(frame); return; }
      const dt = Math.min((time - (lastFrame || time)) / 1000, .05); lastFrame = time;
      const state = stateRef.current;
      if (time - lastSpawn > (state.active ? 330 : 1000) && particles.length < 40) {
        const fails = Math.random() < .25;
        particles.push({ progress: 0, failed: fails, failAt: .22 + Math.random() * .55, caught: false, speed: state.connecting ? .48 : .23, tag: state.hoveredExample, eventText: fails ? '' : eventWords[0], eventLife: fails ? 0 : .55 }); lastSpawn = time;
      }
      if (state.connecting) { if (!wasConnecting) scanner = 0; scanner = Math.min(1, scanner + dt * 2.2); particles.forEach((p) => { p.speed = .75; }); }
      else { scanner = (scanner + dt * .13) % 1; if (wasConnecting) particles.forEach((p) => { p.speed = .23; }); }
      wasConnecting = state.connecting;
      particles.forEach((p) => {
        if (!p.failed || p.caught) p.progress += dt * p.speed;
        else if (p.progress < p.failAt) {
          p.progress = Math.min(p.failAt, p.progress + dt * p.speed);
          if (p.progress >= p.failAt && !p.eventText) { const nodeIndex = Math.max(0, Math.min(4, Math.round(p.failAt * 4))); nodePulse[nodeIndex] = -1; p.eventText = Math.random() < .5 ? eventWords[1] : eventWords[2]; p.eventLife = 1; }
        }
        if (p.caught && p.eventText !== eventWords[3]) { p.eventText = eventWords[3]; p.eventLife = 1; }
      });
      for (let i = particles.length - 1; i >= 0; i -= 1) if (particles[i].progress >= 1) particles.splice(i, 1);
      nodePulse.forEach((_, i) => { nodePulse[i] *= .92; });
      draw(time);
      raf = requestAnimationFrame(frame);
    }
    const onPointer = (event) => { if (!reduced.matches) pointer = { x: (event.clientX / window.innerWidth - .5), y: (event.clientY / window.innerHeight - .5) }; };
    const onVisibility = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!reduced.matches && !raf) { lastFrame = 0; raf = requestAnimationFrame(frame); } };
    const onMotion = () => { cancelAnimationFrame(raf); raf = 0; if (reduced.matches) draw(0, true); else if (!document.hidden) raf = requestAnimationFrame(frame); };
    const onResize = () => resize();
    resize();
    if (!reduced.matches && !document.hidden) raf = requestAnimationFrame(frame);
    window.addEventListener('resize', onResize); window.addEventListener('mousemove', onPointer); document.addEventListener('visibilitychange', onVisibility); reduced.addEventListener?.('change', onMotion);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); window.removeEventListener('mousemove', onPointer); document.removeEventListener('visibilitychange', onVisibility); reduced.removeEventListener?.('change', onMotion); };
  }, []);

  return <canvas ref={canvasRef} className="pipeline-backdrop" aria-hidden="true" />;
}
