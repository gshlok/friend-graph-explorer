// Simulation engine for the animated algorithm "race".
// ---------------------------------------------------------------------------
// Builds a small, layout-positioned social graph and computes, for each
// algorithm, the ORDER in which it touches nodes when answering a friend
// recommendation query from a source user. The UI replays those touch
// sequences as an animation so you can literally watch how much of the network
// each approach explores.

import { generateSocialGraph } from './benchmark';

export interface SimGraph {
  size: number;
  neighbors: Int32Array[];
  neighborSet: Set<number>[];
  edges: Array<[number, number]>;
  pos: Float32Array; // normalized [0,1] coordinates, [x0,y0, x1,y1, ...]
  source: number;
}

// kind drives the colour of a node as it gets touched.
export type TouchKind = 'source' | 'friend' | 'rec' | 'visit' | 'match' | 'scan';

export interface TouchEvent {
  node: number;
  kind: TouchKind;
  depth: number;
}

export interface AlgoSequence {
  key: string;
  name: string;
  complexity: string;
  optimized: boolean;
  events: TouchEvent[];
  work: number; // relative work — drives animation duration
  uniqueTouched: number; // distinct nodes touched (for "% of network explored")
}

// ---------------------------------------------------------------------------
// Build the graph + a force-directed layout so connected users sit near each
// other (clusters become visible, which makes the "local vs global" contrast
// obvious).
// ---------------------------------------------------------------------------
export function buildSimGraph(n = 280, m = 3): SimGraph {
  const g = generateSocialGraph(n, m);

  // Unique edge list.
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const nbrs = g.neighbors[i];
    for (let j = 0; j < nbrs.length; j++) {
      const t = nbrs[j];
      if (i < t) edges.push([i, t]);
    }
  }

  const pos = computeLayout(n, edges);

  // Pick a "typical user" as the source: a healthy degree (4–7 friends) whose
  // friends are themselves NOT mega-hubs. This keeps the depth-2 neighbourhood
  // genuinely local, so the optimized algorithm visibly touches only a small
  // slice of the network (a hub-adjacent source would explode to most of it).
  let source = 0;
  let best = Infinity;
  for (let i = 0; i < n; i++) {
    const nbrs = g.neighbors[i];
    const d = nbrs.length;
    if (d < 4 || d > 7) continue;
    let neighborDegreeSum = 0;
    for (let j = 0; j < nbrs.length; j++) neighborDegreeSum += g.neighbors[nbrs[j]].length;
    if (neighborDegreeSum < best) {
      best = neighborDegreeSum;
      source = i;
    }
  }

  return {
    size: n,
    neighbors: g.neighbors,
    neighborSet: g.neighborSet,
    edges,
    pos,
    source,
  };
}

// Fruchterman–Reingold style force-directed layout. Runs once on build.
function computeLayout(n: number, edges: Array<[number, number]>): Float32Array {
  const pos = new Float32Array(n * 2);
  const disp = new Float32Array(n * 2);

  // Seed on a circle with a little jitter.
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pos[i * 2] = Math.cos(a) * 0.4 + (Math.random() - 0.5) * 0.05;
    pos[i * 2 + 1] = Math.sin(a) * 0.4 + (Math.random() - 0.5) * 0.05;
  }

  const k = 1.1 / Math.sqrt(n); // ideal edge length
  const iterations = 140;
  let temp = 0.18;

  for (let it = 0; it < iterations; it++) {
    disp.fill(0);

    // Repulsion (O(n²) — fine for a few hundred nodes).
    for (let i = 0; i < n; i++) {
      const ix = pos[i * 2];
      const iy = pos[i * 2 + 1];
      for (let j = i + 1; j < n; j++) {
        let dx = ix - pos[j * 2];
        let dy = iy - pos[j * 2 + 1];
        let dist2 = dx * dx + dy * dy;
        if (dist2 < 1e-6) {
          dx = (Math.random() - 0.5) * 1e-3;
          dy = (Math.random() - 0.5) * 1e-3;
          dist2 = dx * dx + dy * dy;
        }
        const dist = Math.sqrt(dist2);
        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        disp[i * 2] += fx;
        disp[i * 2 + 1] += fy;
        disp[j * 2] -= fx;
        disp[j * 2 + 1] -= fy;
      }
    }

    // Attraction along edges.
    for (const [a, b] of edges) {
      let dx = pos[a * 2] - pos[b * 2];
      let dy = pos[a * 2 + 1] - pos[b * 2 + 1];
      const dist = Math.sqrt(dx * dx + dy * dy) || 1e-6;
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      disp[a * 2] -= fx;
      disp[a * 2 + 1] -= fy;
      disp[b * 2] += fx;
      disp[b * 2 + 1] += fy;
    }

    // Apply, limited by temperature (cooling).
    for (let i = 0; i < n; i++) {
      const dx = disp[i * 2];
      const dy = disp[i * 2 + 1];
      const len = Math.sqrt(dx * dx + dy * dy) || 1e-6;
      pos[i * 2] += (dx / len) * Math.min(len, temp);
      pos[i * 2 + 1] += (dy / len) * Math.min(len, temp);
    }
    temp *= 0.97;
  }

  // Normalize into [0.04, 0.96] with padding.
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    minX = Math.min(minX, pos[i * 2]);
    maxX = Math.max(maxX, pos[i * 2]);
    minY = Math.min(minY, pos[i * 2 + 1]);
    maxY = Math.max(maxY, pos[i * 2 + 1]);
  }
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  for (let i = 0; i < n; i++) {
    pos[i * 2] = 0.04 + ((pos[i * 2] - minX) / spanX) * 0.92;
    pos[i * 2 + 1] = 0.04 + ((pos[i * 2 + 1] - minY) / spanY) * 0.92;
  }
  return pos;
}

// ---------------------------------------------------------------------------
// Touch sequences — one per algorithm. These mirror the real algorithms in
// lib/benchmark.ts, but record the order nodes are visited so we can animate.
// ---------------------------------------------------------------------------

function seqOptimized(g: SimGraph): TouchEvent[] {
  const events: TouchEvent[] = [{ node: g.source, kind: 'source', depth: 0 }];
  const friends = g.neighbors[g.source];
  const directSet = g.neighborSet[g.source];

  // Depth 1 — direct friends.
  for (let i = 0; i < friends.length; i++) {
    events.push({ node: friends[i], kind: 'friend', depth: 1 });
  }
  // Depth 2 — friends of friends (recommendations). Stops here.
  const seen = new Set<number>();
  for (let i = 0; i < friends.length; i++) {
    const fof = g.neighbors[friends[i]];
    for (let j = 0; j < fof.length; j++) {
      const c = fof[j];
      if (c === g.source || directSet.has(c) || seen.has(c)) continue;
      seen.add(c);
      events.push({ node: c, kind: 'rec', depth: 2 });
    }
  }
  return events;
}

function seqBFS(g: SimGraph): TouchEvent[] {
  const events: TouchEvent[] = [];
  const dist = new Int32Array(g.size).fill(-1);
  dist[g.source] = 0;
  const queue = [g.source];
  let head = 0;
  events.push({ node: g.source, kind: 'source', depth: 0 });
  while (head < queue.length) {
    const node = queue[head++];
    const d = dist[node];
    const nbrs = g.neighbors[node];
    for (let i = 0; i < nbrs.length; i++) {
      const nx = nbrs[i];
      if (dist[nx] === -1) {
        dist[nx] = d + 1;
        queue.push(nx);
        events.push({
          node: nx,
          kind: d + 1 === 1 ? 'friend' : d + 1 === 2 ? 'rec' : 'visit',
          depth: d + 1,
        });
      }
    }
  }
  return events;
}

function seqDFS(g: SimGraph): TouchEvent[] {
  const events: TouchEvent[] = [];
  const visited = new Uint8Array(g.size);
  const stack = [g.source];
  visited[g.source] = 1;
  events.push({ node: g.source, kind: 'source', depth: 0 });
  while (stack.length) {
    const node = stack.pop()!;
    const nbrs = g.neighbors[node];
    for (let i = 0; i < nbrs.length; i++) {
      const nx = nbrs[i];
      if (!visited[nx]) {
        visited[nx] = 1;
        stack.push(nx);
        events.push({ node: nx, kind: 'visit', depth: 1 });
      }
    }
  }
  return events;
}

function seqMatrix(g: SimGraph): TouchEvent[] {
  // Scans every user in id order, checking each for a shared friend.
  const events: TouchEvent[] = [{ node: g.source, kind: 'source', depth: 0 }];
  const directSet = g.neighborSet[g.source];
  const srcFriends = g.neighbors[g.source];
  for (let u = 0; u < g.size; u++) {
    if (u === g.source) continue;
    if (directSet.has(u)) {
      events.push({ node: u, kind: 'friend', depth: 1 });
      continue;
    }
    const uSet = g.neighborSet[u];
    let shared = false;
    for (let i = 0; i < srcFriends.length; i++) {
      if (uSet.has(srcFriends[i])) {
        shared = true;
        break;
      }
    }
    events.push({ node: u, kind: shared ? 'match' : 'scan', depth: 2 });
  }
  return events;
}

const SPECS = [
  { key: 'optimized', name: 'This Project', complexity: 'O(k²)', optimized: true, seq: seqOptimized },
  { key: 'fullbfs', name: 'Full BFS', complexity: 'O(V + E)', optimized: false, seq: seqBFS },
  { key: 'fulldfs', name: 'Full DFS', complexity: 'O(V + E)', optimized: false, seq: seqDFS },
  { key: 'matrix', name: 'Matrix A²', complexity: 'O(V · k)', optimized: false, seq: seqMatrix },
];

export function computeSequences(g: SimGraph): AlgoSequence[] {
  const avgDeg = (2 * g.edges.length) / g.size;
  return SPECS.map((spec) => {
    const events = spec.seq(g);
    const uniqueTouched = new Set(events.map((e) => e.node)).size;
    // Relative work reflects each algorithm's real cost profile.
    let work: number;
    switch (spec.key) {
      case 'optimized':
        work = events.length;
        break;
      case 'fullbfs':
      case 'fulldfs':
        work = g.size + g.edges.length;
        break;
      default: // matrix: O(V·k)
        work = g.size * avgDeg;
    }
    return {
      key: spec.key,
      name: spec.name,
      complexity: spec.complexity,
      optimized: spec.optimized,
      events,
      work,
      uniqueTouched,
    };
  });
}
