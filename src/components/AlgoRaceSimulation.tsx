import { useEffect, useRef } from 'react';
import {
  buildSimGraph,
  computeSequences,
  type SimGraph,
  type AlgoSequence,
  type TouchKind,
} from '@/lib/simulation';

interface Props {
  // Bump to (re)start the animation.
  runKey: number;
  onComplete?: () => void;
}

// Colour per touch kind.
const KIND_COLOR: Record<TouchKind, string> = {
  source: '#fde047', // gold
  friend: '#2dd4bf', // teal (distance 1)
  rec: '#fb7c52', // orange (recommendation / distance 2)
  match: '#fb7c52', // orange (matrix found a candidate)
  visit: '#5b86c4', // blue-grey (wasted deep exploration)
  scan: '#41506b', // dim slate (matrix scanned, no match)
};

const PANEL_ORDER = ['optimized', 'fullbfs', 'fulldfs', 'matrix'];

export function AlgoRaceSimulation({ runKey, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const rafRef = useRef<number>();
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
    const graph = buildSimGraph();
    const sequences = computeSequences(graph);
    const byKey: Record<string, AlgoSequence> = {};
    sequences.forEach((s) => (byKey[s.key] = s));

    // Map work → animation duration so the optimized algorithm finishes fast
    // and the whole-graph approaches take longer (speed scaled for visibility).
    const works = sequences.map((s) => s.work);
    const minW = Math.min(...works);
    const maxW = Math.max(...works);
    const durationFor = (w: number) =>
      900 + (maxW > minW ? (w - minW) / (maxW - minW) : 0) * 3600;
    const durations: Record<string, number> = {};
    sequences.forEach((s) => (durations[s.key] = durationFor(s.work)));

    // Size canvases (HiDPI).
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sizes: Record<string, { w: number; h: number }> = {};
    for (const key of PANEL_ORDER) {
      const cv = canvasRefs.current[key];
      if (!cv) continue;
      const rect = cv.getBoundingClientRect();
      const w = rect.width || 320;
      const h = rect.height || 240;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      sizes[key] = { w, h };
      const ctx = cv.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let start: number | null = null;

    const draw = (ts: number) => {
      if (start === null) start = ts;
      const elapsed = ts - start;
      let allDone = true;

      for (const key of PANEL_ORDER) {
        const cv = canvasRefs.current[key];
        const size = sizes[key];
        const seq = byKey[key];
        if (!cv || !size || !seq) continue;
        const ctx = cv.getContext('2d')!;
        const dur = durations[key];
        const t = Math.min(elapsed / dur, 1);
        if (t < 1) allDone = false;
        const revealCount = Math.floor(t * seq.events.length);
        drawPanel(ctx, size.w, size.h, graph, seq, revealCount, t);
      }

      if (!allDone) {
        rafRef.current = requestAnimationFrame(draw);
      } else if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {PANEL_ORDER.map((key) => (
        <div
          key={key}
          className={`relative rounded-lg overflow-hidden border ${
            key === 'optimized' ? 'border-primary/40' : 'border-border/40'
          } bg-background/40`}
        >
          <canvas
            ref={(el) => (canvasRefs.current[key] = el)}
            className="w-full block"
            style={{ height: 260 }}
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Canvas drawing.
// ---------------------------------------------------------------------------
function drawPanel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  g: SimGraph,
  seq: AlgoSequence,
  revealCount: number,
  t: number
) {
  ctx.clearRect(0, 0, w, h);

  const padTop = 38;
  const padBottom = 30;
  const plotH = h - padTop - padBottom;
  const X = (i: number) => g.pos[i * 2] * w;
  const Y = (i: number) => padTop + g.pos[i * 2 + 1] * plotH;

  // Determine node state from revealed events.
  const state = new Int8Array(g.size); // 0 untouched
  const STATE_BY_KIND: Record<TouchKind, number> = {
    scan: 1,
    visit: 2,
    friend: 3,
    rec: 4,
    match: 4,
    source: 5,
  };
  let lastNode = -1;
  for (let i = 0; i < revealCount && i < seq.events.length; i++) {
    const e = seq.events[i];
    const s = STATE_BY_KIND[e.kind];
    if (s > state[e.node]) state[e.node] = s;
    lastNode = e.node;
  }
  // Frontier = the few most-recently revealed nodes (for a pulse).
  const frontier = new Set<number>();
  for (let i = Math.max(0, revealCount - 6); i < revealCount; i++) {
    frontier.add(seq.events[i].node);
  }

  const STATE_COLOR: Record<number, string> = {
    1: KIND_COLOR.scan,
    2: KIND_COLOR.visit,
    3: KIND_COLOR.friend,
    4: KIND_COLOR.rec,
    5: KIND_COLOR.source,
  };

  // Edges — dim by default, highlighted when both endpoints are touched.
  for (const [a, b] of g.edges) {
    const touched = state[a] > 0 && state[b] > 0;
    ctx.beginPath();
    ctx.moveTo(X(a), Y(a));
    ctx.lineTo(X(b), Y(b));
    if (touched) {
      ctx.strokeStyle = 'rgba(45,212,191,0.18)';
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = 'rgba(120,140,170,0.06)';
      ctx.lineWidth = 0.7;
    }
    ctx.stroke();
  }

  // Nodes.
  for (let i = 0; i < g.size; i++) {
    const s = state[i];
    const x = X(i);
    const y = Y(i);
    if (s === 0) {
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(140,160,190,0.18)';
      ctx.fill();
      continue;
    }
    const color = STATE_COLOR[s];
    const isSource = s === 5;
    const r = isSource ? 6 : s >= 3 ? 4 : 3;

    // Glow for frontier / important nodes.
    if (frontier.has(i) || isSource) {
      ctx.beginPath();
      ctx.arc(x, y, r + 5, 0, Math.PI * 2);
      ctx.fillStyle = hexA(color, 0.22);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (isSource) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.stroke();
    }
  }

  // --- Overlay: header ---
  ctx.textBaseline = 'middle';
  const accent = seq.optimized ? '#2dd4bf' : '#9fb0c9';
  ctx.font =
    '600 13px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = seq.optimized ? '#2dd4bf' : '#e8edf5';
  ctx.textAlign = 'left';
  ctx.fillText(seq.name, 12, 16);

  // complexity badge (right)
  ctx.font = '500 11px ui-monospace, monospace';
  ctx.fillStyle = '#fb7c52';
  ctx.textAlign = 'right';
  ctx.fillText(seq.complexity, w - 12, 16);

  if (seq.optimized) {
    ctx.font = '600 9px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#2dd4bf';
    ctx.textAlign = 'left';
    ctx.fillText('● OPTIMIZED', 12, 30);
  }

  // --- Overlay: footer stats ---
  const touchedNow = countTouched(state);
  const pct = Math.round((touchedNow / g.size) * 100);
  const done = t >= 1;

  // progress bar
  const barY = h - 18;
  const barX = 12;
  const barW = w - 24;
  ctx.fillStyle = 'rgba(120,140,170,0.15)';
  roundRect(ctx, barX, barY, barW, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = accent;
  roundRect(ctx, barX, barY, barW * t, 5, 2.5);
  ctx.fill();

  // explored label
  ctx.font = '600 12px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`Explored ${pct}% of network`, 12, h - 30);

  ctx.textAlign = 'right';
  if (done) {
    ctx.fillStyle = seq.optimized ? '#2dd4bf' : '#9fb0c9';
    ctx.fillText('✓ done', w - 12, h - 30);
  } else {
    ctx.fillStyle = '#9fb0c9';
    ctx.fillText(`${touchedNow} nodes`, w - 12, h - 30);
  }
}

function countTouched(state: Int8Array): number {
  let c = 0;
  for (let i = 0; i < state.length; i++) if (state[i] > 0) c++;
  return c;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
