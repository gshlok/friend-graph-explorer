import { useEffect, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Shuffle,
  Cpu,
  Radar,
  Activity,
  Zap,
} from 'lucide-react';

/* ===========================================================================
 * Algorithm Visualizer — a sci-fi, hacker-style live trace of the depth-2 BFS
 * friend recommender. The source user sits at the core; its friends (distance 1)
 * orbit it; friends-of-friends (distance 2) become ranked candidates. A vast,
 * dim field of "the rest of the network" surrounds the neighbourhood to make the
 * point visceral: the optimized algorithm only ever lights up a tiny local
 * cluster, while a brute-force scan would have to touch the whole field.
 * ======================================================================== */

const COL = {
  gold: '#fde047',
  teal: '#2dd4bf',
  orange: '#fb7c52',
  red: '#f0506e',
  dim: '#3a4a66',
  bg: '#8aa0c0',
};

type Kind = 'source' | 'friend' | 'candidate' | 'bg';

interface VNode {
  id: number;
  hex: string;
  kind: Kind;
  ox: number; // centred-radial offset, -1..1 (neighbourhood nodes)
  oy: number;
  fx: number; // rect fraction 0..1 (background nodes)
  fy: number;
  bg: boolean;
  twinkle: number;
}

interface VEdge {
  a: number;
  b: number;
  kind: 'sf' | 'ff' | 'fc' | 'bg';
}

type StepType =
  | 'init'
  | 'visit'
  | 'skipSource'
  | 'skipFriend'
  | 'candNew'
  | 'candInc'
  | 'rank'
  | 'done';

interface Step {
  type: StepType;
  node: number; // primary node the step acts on
  edge?: [number, number]; // edge the "data packet" travels along
  count?: number; // mutual count after this step (candidates)
  log: string;
}

interface Model {
  nodes: VNode[];
  edges: VEdge[];
  friendIds: number[];
  total: number;
  bgCount: number;
}

interface Reveal {
  state: Map<number, Kind>;
  mutual: Map<number, number>;
  touched: Set<number>;
  ops: number;
  cands: number;
}

/* ----------------------------- helpers ---------------------------------- */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (n: number) =>
  '0x' + n.toString(16).toUpperCase().padStart(2, '0');

function buildModel(k: number, m: number, bgCount: number, seed: number): Model {
  const r = rng(seed);
  const nodes: VNode[] = [];
  const edges: VEdge[] = [];

  const mk = (over: Partial<VNode>): VNode => {
    const id = nodes.length;
    const n: VNode = {
      id,
      hex: hex(id),
      kind: 'bg',
      ox: 0,
      oy: 0,
      fx: 0,
      fy: 0,
      bg: false,
      twinkle: r() * Math.PI * 2,
      ...over,
    };
    nodes.push(n);
    return n;
  };

  // Source at the core.
  mk({ kind: 'source', ox: 0, oy: 0 });

  // Friends on an inner ring.
  const friendIds: number[] = [];
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2 + (r() - 0.5) * 0.35;
    const rr = 0.42 + (r() - 0.5) * 0.08;
    const f = mk({ kind: 'friend', ox: Math.cos(a) * rr, oy: Math.sin(a) * rr });
    friendIds.push(f.id);
    edges.push({ a: 0, b: f.id, kind: 'sf' });
  }

  // A few friend-friend triangles (these generate "SKIP already-friend" events).
  for (let i = 0; i < friendIds.length; i++) {
    if (r() < 0.22) {
      const j = (i + 1 + Math.floor(r() * (friendIds.length - 1))) % friendIds.length;
      if (i !== j) edges.push({ a: friendIds[i], b: friendIds[j], kind: 'ff' });
    }
  }

  // Candidate pool — each candidate links to 1..3 friends (mutual-friend count).
  for (let j = 0; j < m; j++) {
    const nc = 1 + (r() < 0.55 ? 0 : r() < 0.8 ? 1 : 2); // weighted toward 1
    const picks = new Set<number>();
    while (picks.size < Math.min(nc, k)) picks.add(friendIds[Math.floor(r() * k)]);
    const list = [...picks];

    // Position: average direction of connected friends, pushed outward.
    let ax = 0;
    let ay = 0;
    list.forEach((fid) => {
      ax += nodes[fid].ox;
      ay += nodes[fid].oy;
    });
    const len = Math.hypot(ax, ay) || 1;
    const ang = Math.atan2(ay, ax) + (r() - 0.5) * 0.5;
    const rr = 0.78 + (r() - 0.5) * 0.16;
    const c = mk({
      kind: 'candidate',
      ox: Math.cos(ang) * rr,
      oy: Math.sin(ang) * rr,
    });
    list.forEach((fid) => edges.push({ a: fid, b: c.id, kind: 'fc' }));
    void len;
  }

  // Background field — "the rest of the network".
  const bgStart = nodes.length;
  for (let i = 0; i < bgCount; i++) {
    mk({ kind: 'bg', bg: true, fx: r(), fy: r() });
  }
  // Faint ambient links between background nodes.
  for (let i = bgStart; i < nodes.length; i++) {
    if (r() < 0.5) {
      const j = bgStart + Math.floor(r() * (nodes.length - bgStart));
      if (j !== i) edges.push({ a: i, b: j, kind: 'bg' });
    }
  }

  return { nodes, edges, friendIds, total: nodes.length, bgCount };
}

function buildSteps(model: Model): Step[] {
  const { nodes, edges, friendIds } = model;
  const friendSet = new Set(friendIds);

  // Adjacency over neighbourhood edges only (the algorithm walks these).
  const adj = new Map<number, number[]>();
  const push = (x: number, y: number) => {
    if (!adj.has(x)) adj.set(x, []);
    adj.get(x)!.push(y);
  };
  edges.forEach((e) => {
    if (e.kind === 'bg') return;
    push(e.a, e.b);
    push(e.b, e.a);
  });

  const steps: Step[] = [];
  steps.push({
    type: 'init',
    node: 0,
    log: `init recommender(source=${nodes[0].hex}) · BFS depth-limit = 2`,
  });

  const mutual = new Map<number, number>();
  let cands = 0;

  for (const fid of friendIds) {
    steps.push({
      type: 'visit',
      node: fid,
      edge: [0, fid],
      log: `visit friend ${nodes[fid].hex}  [dist 1]`,
    });
    const neighbors = adj.get(fid) || [];
    for (const n of neighbors) {
      if (n === 0) {
        steps.push({
          type: 'skipSource',
          node: 0,
          edge: [fid, 0],
          log: `  ${nodes[fid].hex} → ${nodes[0].hex}   skip · source`,
        });
      } else if (friendSet.has(n)) {
        steps.push({
          type: 'skipFriend',
          node: n,
          edge: [fid, n],
          log: `  ${nodes[fid].hex} → ${nodes[n].hex}   skip · already friend`,
        });
      } else {
        const c = (mutual.get(n) || 0) + 1;
        if (c === 1) cands++;
        mutual.set(n, c);
        steps.push({
          type: c === 1 ? 'candNew' : 'candInc',
          node: n,
          edge: [fid, n],
          count: c,
          log:
            c === 1
              ? `  ${nodes[fid].hex} → ${nodes[n].hex}   + candidate   (mutual = 1)`
              : `  ${nodes[fid].hex} → ${nodes[n].hex}   + mutual      (mutual = ${c})`,
        });
      }
    }
  }

  const ranked = [...mutual.entries()].sort((a, b) => b[1] - a[1]);
  steps.push({
    type: 'rank',
    node: 0,
    log: `rank ${cands} candidates by mutual-friend count …`,
  });
  const top = ranked
    .slice(0, 3)
    .map(([id, c]) => `${nodes[id].hex}(${c})`)
    .join('  ');
  steps.push({
    type: 'done',
    node: 0,
    log: `top picks → ${top || '—'}`,
  });

  return steps;
}

/* ----------------------------- component -------------------------------- */

const AlgorithmVisualizer = () => {
  const [k, setK] = useState(7);
  const [m, setM] = useState(10);
  const [bg, setBg] = useState(420);
  const [speed, setSpeed] = useState(6);
  const [seed, setSeed] = useState(1337);
  const [playing, setPlaying] = useState(true);
  const [crt, setCrt] = useState(true);

  // DOM / canvas refs
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const hudOps = useRef<HTMLSpanElement>(null);
  const hudTouched = useRef<HTMLSpanElement>(null);
  const hudPct = useRef<HTMLSpanElement>(null);
  const hudCand = useRef<HTMLSpanElement>(null);
  const hudPhase = useRef<HTMLSpanElement>(null);
  const hudBar = useRef<HTMLDivElement>(null);

  // animation state (refs to avoid 60fps re-renders)
  const modelRef = useRef<Model | null>(null);
  const stepsRef = useRef<Step[]>([]);
  const revealRef = useRef<Reveal>({
    state: new Map(),
    mutual: new Map(),
    touched: new Set(),
    ops: 0,
    cands: 0,
  });
  const committedRef = useRef(0);
  const progressRef = useRef(0);
  const playingRef = useRef(true);
  const speedRef = useRef(6);
  const stepTargetRef = useRef(0);
  const sizeRef = useRef({ w: 800, h: 600, dpr: 1 });
  const floodRef = useRef({ active: false, t: 0 });
  const rafRef = useRef<number>();

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  /* --------- (re)build the network + step program on param change -------- */
  useEffect(() => {
    const model = buildModel(k, m, bg, seed);
    modelRef.current = model;
    stepsRef.current = buildSteps(model);

    // reset trace
    committedRef.current = 0;
    progressRef.current = 0;
    stepTargetRef.current = 0;
    floodRef.current = { active: false, t: 0 };
    revealRef.current = {
      state: new Map(),
      mutual: new Map(),
      touched: new Set(),
      ops: 0,
      cands: 0,
    };
    if (termRef.current) termRef.current.innerHTML = '';
    setPlaying(true);
    playingRef.current = true;
    syncHud();
  }, [k, m, bg, seed]);

  useEffect(() => {
    playingRef.current = playing;
    if (playing) stepTargetRef.current = stepsRef.current.length;
  }, [playing]);

  /* ------------------------------ HUD ------------------------------------ */
  function syncHud() {
    const rv = revealRef.current;
    const model = modelRef.current;
    const steps = stepsRef.current;
    const total = model?.total || 1;
    const pct = ((rv.touched.size / total) * 100).toFixed(1);
    if (hudOps.current) hudOps.current.textContent = String(rv.ops);
    if (hudTouched.current)
      hudTouched.current.textContent = `${rv.touched.size}/${total}`;
    if (hudPct.current) hudPct.current.textContent = `${pct}%`;
    if (hudCand.current) hudCand.current.textContent = String(rv.cands);
    if (hudBar.current)
      hudBar.current.style.width = `${steps.length ? (committedRef.current / steps.length) * 100 : 0}%`;
    if (hudPhase.current) {
      const done = committedRef.current >= steps.length && steps.length > 0;
      hudPhase.current.textContent = done
        ? 'COMPLETE'
        : playingRef.current
          ? 'TRACING'
          : 'PAUSED';
    }
  }

  function applyStep(i: number) {
    const steps = stepsRef.current;
    const rv = revealRef.current;
    const step = steps[i];
    if (!step) return;

    switch (step.type) {
      case 'init':
        rv.state.set(0, 'source');
        rv.touched.add(0);
        break;
      case 'visit':
        rv.state.set(step.node, 'friend');
        rv.touched.add(step.node);
        rv.ops++;
        break;
      case 'skipSource':
      case 'skipFriend':
        rv.ops++;
        break;
      case 'candNew':
        rv.state.set(step.node, 'candidate');
        rv.mutual.set(step.node, step.count || 1);
        rv.touched.add(step.node);
        rv.ops++;
        rv.cands++;
        break;
      case 'candInc':
        rv.mutual.set(step.node, step.count || 1);
        rv.ops++;
        break;
      default:
        break;
    }

    // terminal feed
    const term = termRef.current;
    if (term) {
      const line = document.createElement('div');
      const colorClass =
        step.type === 'init' || step.type === 'rank' || step.type === 'done'
          ? 'text-primary'
          : step.type === 'visit'
            ? 'text-[#2dd4bf]'
            : step.type === 'candNew' || step.type === 'candInc'
              ? 'text-[#fb7c52]'
              : 'text-[#f0506e]';
      line.className = `terminal-line whitespace-pre ${colorClass}`;
      const tick = String(i).padStart(3, '0');
      line.textContent = `[${tick}] ${step.log}`;
      term.appendChild(line);
      while (term.childElementCount > 240) term.removeChild(term.firstChild!);
      term.scrollTop = term.scrollHeight;
    }
    syncHud();
  }

  /* ----------------------- mount: rAF loop + resize ---------------------- */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext('2d')!;

    let last = performance.now();

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = rect.width;
      const h = rect.height;
      // Only size the backing buffer. The display size is handled by the
      // canvas's `w-full h-full` (100% of the wrap) — setting an explicit px
      // width here would feed the grid track's min-content and grow the column
      // unboundedly on each resize.
      canvas.width = Math.round(w * dpr); // note: setting width clears the canvas
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h, dpr };
      // Repaint the current frame immediately so a resize never leaves the
      // canvas blank (matters when rAF is throttled, e.g. a background tab).
      draw(ctx, last);
    };

    // One simulation + render step. Pure of scheduling so it can be driven by
    // rAF (smooth, foreground) or a timer fallback (when the tab is hidden).
    const frame = (now: number) => {
      const dt = Math.min(now - last, 60);
      last = now;
      const steps = stepsRef.current;
      const N = steps.length;

      // advance playhead
      const rate = playingRef.current ? speedRef.current : 7;
      const target = playingRef.current ? N : stepTargetRef.current;
      if (progressRef.current < target) {
        progressRef.current = Math.min(target, progressRef.current + (dt / 1000) * rate);
      }
      // commit whole steps as we cross integer boundaries
      while (committedRef.current < Math.floor(progressRef.current) && committedRef.current < N) {
        applyStep(committedRef.current);
        committedRef.current++;
      }
      if (playingRef.current && committedRef.current >= N && N > 0) {
        playingRef.current = false;
        setPlaying(false);
        syncHud();
      }

      // brute-force ghost flood
      if (floodRef.current.active && floodRef.current.t < 1) {
        floodRef.current.t = Math.min(1, floodRef.current.t + dt / 2600);
      }

      draw(ctx, now);
    };

    // Size + paint the very first frame synchronously so the canvas is never
    // blank, even before rAF schedules (or if it is throttled).
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    frame(last);

    const loop = (now: number) => {
      frame(now);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    // keyboard controls
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepOnce();
      } else if (e.key.toLowerCase() === 'r') {
        restart();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------ drawing -------------------------------- */
  function nodePx(n: VNode, w: number, h: number): [number, number] {
    if (n.bg) return [n.fx * w, n.fy * h];
    const rad = Math.min(w, h) * 0.46;
    return [w / 2 + n.ox * rad, h / 2 + n.oy * rad];
  }

  function draw(ctx: CanvasRenderingContext2D, now: number) {
    const { w, h } = sizeRef.current;
    const model = modelRef.current;
    if (!model) return;
    const steps = stepsRef.current;
    const rv = revealRef.current;
    const t = now / 1000;

    // ---- background ----
    const grad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, Math.max(w, h) * 0.7);
    grad.addColorStop(0, '#0c1424');
    grad.addColorStop(1, '#070b14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // drifting grid
    const cell = 42;
    const off = (t * 14) % cell;
    ctx.strokeStyle = 'rgba(45,212,191,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -off; x < w; x += cell) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = -off; y < h; y += cell) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // central core glow
    const coreG = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) * 0.5);
    coreG.addColorStop(0, 'rgba(45,212,191,0.10)');
    coreG.addColorStop(1, 'rgba(45,212,191,0)');
    ctx.fillStyle = coreG;
    ctx.fillRect(0, 0, w, h);

    // rotating radar sweep
    ctx.save();
    ctx.translate(w / 2, h / 2);
    const sweep = (t * 0.55) % (Math.PI * 2);
    const sweepR = Math.min(w, h) * 0.5;
    const sg = ctx.createConicGradient
      ? ctx.createConicGradient(sweep, 0, 0)
      : null;
    if (sg) {
      sg.addColorStop(0, 'rgba(45,212,191,0.16)');
      sg.addColorStop(0.06, 'rgba(45,212,191,0.0)');
      sg.addColorStop(1, 'rgba(45,212,191,0.0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, sweepR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const flood = floodRef.current;

    // ---- background field ----
    for (let i = model.total - model.bgCount; i < model.total; i++) {
      const n = model.nodes[i];
      if (!n || !n.bg) continue;
      const [x, y] = nodePx(n, w, h);
      const floodedIdx = (i - (model.total - model.bgCount)) / Math.max(1, model.bgCount);
      const isFlooded = flood.active && floodedIdx < flood.t;
      const tw = 0.12 + 0.1 * Math.sin(t * 1.5 + n.twinkle);
      if (isFlooded) {
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,80,110,0.85)`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,80,110,0.12)`;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138,160,192,${tw})`;
        ctx.fill();
      }
    }

    // background ambient edges
    ctx.strokeStyle = 'rgba(138,160,192,0.035)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    model.edges.forEach((e) => {
      if (e.kind !== 'bg') return;
      const [x1, y1] = nodePx(model.nodes[e.a], w, h);
      const [x2, y2] = nodePx(model.nodes[e.b], w, h);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    });
    ctx.stroke();

    // expanding red ring for brute-force ghost
    if (flood.active) {
      const rr = flood.t * Math.max(w, h) * 0.75;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, rr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(240,80,110,${0.5 * (1 - flood.t)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // in-flight step (for the travelling data packet)
    const inflightIdx = committedRef.current;
    const inflight = inflightIdx < steps.length ? steps[inflightIdx] : null;
    const frac = progressRef.current - inflightIdx;

    // ---- neighbourhood edges ----
    model.edges.forEach((e) => {
      if (e.kind === 'bg') return;
      const na = model.nodes[e.a];
      const nb = model.nodes[e.b];
      const [x1, y1] = nodePx(na, w, h);
      const [x2, y2] = nodePx(nb, w, h);
      const aOn = rv.state.has(e.a);
      const bOn = rv.state.has(e.b);
      const live = aOn && bOn;

      if (e.kind === 'fc') {
        // friend → candidate, dashed flow when discovered
        if (live) {
          ctx.save();
          ctx.setLineDash([5, 6]);
          ctx.lineDashOffset = -(t * 26) % 11;
          ctx.strokeStyle = 'rgba(251,124,82,0.55)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.strokeStyle = 'rgba(251,124,82,0.07)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      } else {
        // source-friend / friend-friend
        ctx.strokeStyle = live ? 'rgba(45,212,191,0.5)' : 'rgba(45,212,191,0.10)';
        ctx.lineWidth = live ? 1.8 : 0.9;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });

    // bright active edge + travelling packet
    if (inflight && inflight.edge && frac > 0) {
      const [a, b] = inflight.edge;
      const [x1, y1] = nodePx(model.nodes[a], w, h);
      const [x2, y2] = nodePx(model.nodes[b], w, h);
      const pc =
        inflight.type === 'visit'
          ? COL.teal
          : inflight.type === 'candNew' || inflight.type === 'candInc'
            ? COL.orange
            : COL.red;
      // beam
      ctx.strokeStyle = pc;
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (x2 - x1) * frac, y1 + (y2 - y1) * frac);
      ctx.stroke();
      ctx.globalAlpha = 1;
      // packet with glow
      const px = x1 + (x2 - x1) * frac;
      const py = y1 + (y2 - y1) * frac;
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fillStyle = hexA(pc, 0.25);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = pc;
      ctx.fill();
    }

    // ---- nodes ----
    for (let i = 0; i < model.total - model.bgCount; i++) {
      const n = model.nodes[i];
      const st = rv.state.get(n.id);
      const [x, y] = nodePx(n, w, h);

      if (!st) {
        // not yet reached — show faint placeholder for neighbourhood nodes
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(138,160,192,0.18)';
        ctx.fill();
        continue;
      }

      if (st === 'source') {
        const pr = 1 + Math.sin(t * 3) * 0.12;
        for (let ring = 0; ring < 3; ring++) {
          const rr = (18 + ring * 12) * pr + ((t * 30) % 36);
          ctx.beginPath();
          ctx.arc(x, y, rr % 60, 0, Math.PI * 2);
          ctx.strokeStyle = hexA(COL.gold, 0.18 * (1 - ((rr % 60) / 60)));
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        glowDot(ctx, x, y, 11, COL.gold);
      } else if (st === 'friend') {
        glowDot(ctx, x, y, 7, COL.teal);
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = hexA(COL.teal, 0.4);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (st === 'candidate') {
        const mc = rv.mutual.get(n.id) || 1;
        const r = 5 + Math.min(mc, 4) * 1.6;
        glowDot(ctx, x, y, r, COL.orange);
        // mutual-count pips
        ctx.fillStyle = '#0b1220';
        ctx.font = '700 9px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(mc), x, y + 0.5);
      }

      // hex label for source & friends
      if (st === 'source' || st === 'friend') {
        ctx.fillStyle = st === 'source' ? COL.gold : 'rgba(200,220,235,0.7)';
        ctx.font = '600 9px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(n.hex, x, y + 14);
      }
    }

    // skip flash on the in-flight target
    if (inflight && (inflight.type === 'skipFriend' || inflight.type === 'skipSource') && frac > 0.5) {
      const n = model.nodes[inflight.node];
      const [x, y] = nodePx(n, w, h);
      const a = 1 - (frac - 0.5) * 2;
      ctx.strokeStyle = hexA(COL.red, a);
      ctx.lineWidth = 2;
      const s = 7;
      ctx.beginPath();
      ctx.moveTo(x - s, y - s);
      ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y - s);
      ctx.lineTo(x - s, y + s);
      ctx.stroke();
    }
  }

  function glowDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    color: string
  ) {
    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, Math.PI * 2);
    ctx.fillStyle = hexA(color, 0.18);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  /* ----------------------------- controls -------------------------------- */
  function togglePlay() {
    const N = stepsRef.current.length;
    if (committedRef.current >= N) {
      restart();
      setPlaying(true);
      playingRef.current = true;
      return;
    }
    setPlaying((p) => !p);
  }

  function stepOnce() {
    setPlaying(false);
    playingRef.current = false;
    stepTargetRef.current = Math.min(stepsRef.current.length, committedRef.current + 1);
  }

  function restart() {
    committedRef.current = 0;
    progressRef.current = 0;
    stepTargetRef.current = 0;
    floodRef.current = { active: false, t: 0 };
    revealRef.current = {
      state: new Map(),
      mutual: new Map(),
      touched: new Set(),
      ops: 0,
      cands: 0,
    };
    if (termRef.current) termRef.current.innerHTML = '';
    syncHud();
  }

  const reroll = () => setSeed((s) => (s * 1103515245 + 12345) & 0x7fffffff);
  const ghost = () => {
    floodRef.current = { active: true, t: 0 };
  };

  /* ------------------------------ render --------------------------------- */
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-primary/10 animate-flicker">
                <Cpu className="w-6 h-6 text-primary" />
              </div>
              <h1
                className="glitch text-3xl font-bold tracking-tight font-mono"
                data-text="RECOMMENDER.TRACE"
              >
                RECOMMENDER.TRACE
              </h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-2xl">
              A live, step-by-step trace of the{' '}
              <span className="text-primary font-medium">depth-2 BFS</span> friend
              recommender. The core lights up only its local neighbourhood —
              friends, then friends-of-friends — while the vast field around it is
              the rest of the network the algorithm never has to touch.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="px-2 py-1 rounded bg-primary/10 text-primary">O(k²)</span>
            <span className="hidden sm:inline">
              SPACE play · → step · R reset
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-5">
          {/* Stage */}
          <div className="space-y-4 min-w-0">
            <div
              ref={wrapRef}
              className={`relative rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_40px_rgba(45,212,191,0.08)] crt-vignette crt-beam ${
                crt ? 'crt-scanlines' : ''
              }`}
              style={{ height: 560 }}
              onClick={togglePlay}
            >
              <canvas ref={canvasRef} className="block w-full h-full" />

              {/* HUD overlay */}
              <div className="absolute top-3 left-3 z-40 pointer-events-none font-mono text-[11px] space-y-1.5">
                <HudStat label="OPS" inner={hudOps} color="text-primary" />
                <HudStat label="TOUCHED" inner={hudTouched} color="text-foreground" />
                <HudStat label="EXPLORED" inner={hudPct} color="text-[#2dd4bf]" />
                <HudStat label="CANDIDATES" inner={hudCand} color="text-[#fb7c52]" />
              </div>
              <div className="absolute top-3 right-3 z-40 pointer-events-none font-mono text-[11px] text-right">
                <div className="px-2 py-1 rounded bg-black/40 border border-primary/20 inline-flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-primary" />
                  <span ref={hudPhase} className="text-primary">
                    TRACING
                  </span>
                </div>
              </div>

              {/* legend */}
              <div className="absolute bottom-9 left-3 z-40 pointer-events-none flex gap-3 text-[10px] font-mono text-muted-foreground">
                <Dot c={COL.gold} l="source" />
                <Dot c={COL.teal} l="friend · d1" />
                <Dot c={COL.orange} l="candidate · d2" />
                <Dot c={COL.bg} l="untouched" />
              </div>

              {/* progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-40">
                <div
                  ref={hudBar}
                  className="h-full bg-gradient-to-r from-[#2dd4bf] to-[#fb7c52] transition-[width] duration-100"
                  style={{ width: '0%' }}
                />
              </div>
            </div>

            {/* Transport */}
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={togglePlay} className="gap-2 font-mono">
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {playing ? 'PAUSE' : 'PLAY'}
              </Button>
              <Button variant="secondary" onClick={stepOnce} className="gap-2 font-mono">
                <SkipForward className="w-4 h-4" /> STEP
              </Button>
              <Button variant="secondary" onClick={restart} className="gap-2 font-mono">
                <RotateCcw className="w-4 h-4" /> RESET
              </Button>
              <Button variant="secondary" onClick={reroll} className="gap-2 font-mono">
                <Shuffle className="w-4 h-4" /> RE-ROLL
              </Button>
              <Button
                variant="outline"
                onClick={ghost}
                className="gap-2 font-mono border-[#f0506e]/40 text-[#f0506e] hover:bg-[#f0506e]/10 hover:text-[#f0506e]"
              >
                <Radar className="w-4 h-4" /> BRUTE-FORCE GHOST
              </Button>
            </div>
          </div>

          {/* Right rail: controls + terminal */}
          <div className="space-y-4">
            {/* Controls */}
            <div className="glass-card rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Zap className="w-4 h-4 text-primary" /> PARAMETERS
              </div>
              <CtrlSlider
                label="Friends (degree k)"
                value={k}
                min={3}
                max={14}
                onChange={setK}
              />
              <CtrlSlider
                label="Candidate pool"
                value={m}
                min={3}
                max={20}
                onChange={setM}
              />
              <CtrlSlider
                label="Network size"
                value={bg}
                min={0}
                max={900}
                step={20}
                onChange={setBg}
              />
              <CtrlSlider
                label="Trace speed"
                value={speed}
                min={1}
                max={24}
                onChange={setSpeed}
                suffix=" steps/s"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground font-mono">
                  CRT scanlines
                </span>
                <Switch checked={crt} onCheckedChange={setCrt} />
              </div>
            </div>

            {/* Terminal */}
            <div className="glass-card rounded-xl overflow-hidden border-primary/20">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 bg-black/30">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f0506e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fde047]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2dd4bf]" />
                </div>
                <span className="text-[11px] font-mono text-muted-foreground ml-1">
                  trace://recommender.log
                </span>
              </div>
              <div
                ref={termRef}
                className="h-[300px] overflow-y-auto px-3 py-2 text-[11px] leading-relaxed font-mono bg-black/40"
              />
              <div className="px-3 py-1.5 border-t border-border/40 bg-black/30 text-[11px] font-mono text-primary">
                <span>$</span> <span className="blink-caret">▍</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------- small bits -------------------------------- */

function hexA(hex: string, a: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function HudStat({
  label,
  inner,
  color,
}: {
  label: string;
  inner: React.RefObject<HTMLSpanElement>;
  color: string;
}) {
  return (
    <div className="px-2 py-1 rounded bg-black/40 border border-border/30 flex items-center gap-2 backdrop-blur-sm">
      <span className="text-muted-foreground">{label}</span>
      <span ref={inner} className={`${color} font-semibold tabular-nums`}>
        0
      </span>
    </div>
  );
}

function Dot({ c, l }: { c: string; l: string }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}` }}
      />
      {l}
    </span>
  );
}

function CtrlSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix = '',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-primary font-semibold tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}

export default AlgorithmVisualizer;
