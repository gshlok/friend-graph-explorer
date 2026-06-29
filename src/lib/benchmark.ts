// Benchmark engine
// ---------------------------------------------------------------------------
// Generates a realistic large-scale social network and benchmarks THIS
// project's friend-recommendation algorithm (depth-limited BFS over an
// adjacency list with Set-based dedup) against the standard textbook
// approaches used to teach / implement graph traversal.
//
// Everything here runs for real in the browser — no faked numbers. We
// measure wall-clock time with performance.now() across many source queries
// so the comparison is statistically stable.

// A compact, cache-friendly graph representation.
//   neighbors[i]    -> Int32Array of i's neighbour ids (fast iteration)
//   neighborSet[i]  -> Set<number> for O(1) membership tests
export interface FastGraph {
  size: number;
  edges: number;
  neighbors: Int32Array[];
  neighborSet: Set<number>[];
  avgDegree: number;
}

// ---------------------------------------------------------------------------
// Graph generation — Barabási–Albert preferential attachment.
// Real social networks are "scale-free": a few hubs with huge degree, a long
// tail of low-degree nodes. BA reproduces that, so the benchmark stresses the
// algorithms on a realistic topology instead of a uniform random graph.
// ---------------------------------------------------------------------------
export function generateSocialGraph(size: number, m = 4): FastGraph {
  const adj: Set<number>[] = new Array(size);
  for (let i = 0; i < size; i++) adj[i] = new Set<number>();

  // Repeated-node list: each node id appears once per incident edge, so
  // drawing uniformly from it selects targets proportional to degree.
  const repeated: number[] = [];

  const m0 = Math.min(m + 1, size);
  // Seed clique
  for (let i = 0; i < m0; i++) {
    for (let j = i + 1; j < m0; j++) {
      adj[i].add(j);
      adj[j].add(i);
      repeated.push(i, j);
    }
  }

  for (let v = m0; v < size; v++) {
    const targets = new Set<number>();
    let guard = 0;
    while (targets.size < Math.min(m, v) && guard < m * 12) {
      guard++;
      // Deterministic-ish pseudo selection (avoids Math.random for repeatability
      // within a run while still spreading across the repeated list).
      const pick = repeated.length
        ? repeated[(v * 2654435761 + guard * 40503) % repeated.length]
        : (v - 1 - (guard % v));
      if (pick !== v) targets.add(pick);
    }
    for (const t of targets) {
      adj[v].add(t);
      adj[t].add(v);
      repeated.push(v, t);
    }
  }

  // Freeze into Int32Arrays for fast iteration.
  const neighbors: Int32Array[] = new Array(size);
  let edgeCount = 0;
  for (let i = 0; i < size; i++) {
    const arr = Int32Array.from(adj[i]);
    neighbors[i] = arr;
    edgeCount += arr.length;
  }
  edgeCount = edgeCount / 2;

  return {
    size,
    edges: edgeCount,
    neighbors,
    neighborSet: adj,
    avgDegree: size ? (2 * edgeCount) / size : 0,
  };
}

// ---------------------------------------------------------------------------
// The algorithms. Each finds the "friends-of-friends" recommendation set for a
// single source node. They all return the number of candidates touched so the
// JIT can't optimise the work away, but differ wildly in how much they do.
// ---------------------------------------------------------------------------

export interface AlgoSpec {
  key: string;
  name: string;
  short: string;
  complexity: string;
  description: string;
  optimized: boolean;
  run: (g: FastGraph, source: number) => number;
}

// 1. THIS PROJECT — depth-limited (distance-2) BFS over an adjacency list,
//    deduping candidates with a Set. Only ever touches the source's local
//    neighbourhood: O(k²) work, independent of total network size.
function optimizedRecommend(g: FastGraph, source: number): number {
  const directFriends = g.neighborSet[source];
  const mutualCount = new Map<number, number>();

  const friends = g.neighbors[source];
  for (let a = 0; a < friends.length; a++) {
    const fof = g.neighbors[friends[a]];
    for (let b = 0; b < fof.length; b++) {
      const cand = fof[b];
      if (cand === source || directFriends.has(cand)) continue;
      mutualCount.set(cand, (mutualCount.get(cand) || 0) + 1);
    }
  }
  return mutualCount.size;
}

// 2. NAIVE FULL BFS — the "just BFS the graph" approach. Explores the entire
//    reachable component computing distances, then keeps distance-2 nodes.
//    Correct, but does O(V + E) work for an inherently local query.
function fullBFSRecommend(g: FastGraph, source: number): number {
  const dist = new Int32Array(g.size).fill(-1);
  dist[source] = 0;
  const queue = new Int32Array(g.size);
  let head = 0;
  let tail = 0;
  queue[tail++] = source;
  let recs = 0;

  while (head < tail) {
    const node = queue[head++];
    const d = dist[node];
    const nbrs = g.neighbors[node];
    for (let i = 0; i < nbrs.length; i++) {
      const nx = nbrs[i];
      if (dist[nx] === -1) {
        dist[nx] = d + 1;
        if (dist[nx] === 2) recs++;
        queue[tail++] = nx;
      }
    }
  }
  return recs;
}

// 3. DFS FULL SCAN — depth-first traversal of the whole component. Classic
//    textbook traversal; like full BFS it visits every reachable node, paying
//    O(V + E) to answer a question that lives two hops away.
function fullDFSRecommend(g: FastGraph, source: number): number {
  const visited = new Uint8Array(g.size);
  const stack = new Int32Array(g.size);
  let sp = 0;
  stack[sp++] = source;
  visited[source] = 1;
  const directFriends = g.neighborSet[source];
  let recs = 0;

  while (sp > 0) {
    const node = stack[--sp];
    const nbrs = g.neighbors[node];
    for (let i = 0; i < nbrs.length; i++) {
      const nx = nbrs[i];
      if (!visited[nx]) {
        visited[nx] = 1;
        if (nx !== source && !directFriends.has(nx)) recs++;
        stack[sp++] = nx;
      }
    }
  }
  return recs;
}

// 4. ADJACENCY-MATRIX / BRUTE-FORCE PAIRWISE — the dense, matrix-style
//    approach: to find friends-of-friends, test EVERY user in the network for a
//    shared connection with the source. This is the A² (squared adjacency
//    matrix) idea done naively: O(V · k) per query, scaling with the whole
//    network rather than the local neighbourhood.
function bruteForceRecommend(g: FastGraph, source: number): number {
  const directFriends = g.neighborSet[source];
  const srcFriends = g.neighbors[source];
  let recs = 0;

  for (let u = 0; u < g.size; u++) {
    if (u === source || directFriends.has(u)) continue;
    // Does u share at least one friend with the source?
    const uFriends = g.neighborSet[u];
    let shared = false;
    for (let i = 0; i < srcFriends.length; i++) {
      if (uFriends.has(srcFriends[i])) {
        shared = true;
        break;
      }
    }
    if (shared) recs++;
  }
  return recs;
}

export const ALGORITHMS: AlgoSpec[] = [
  {
    key: 'optimized',
    name: 'This Project — Depth-2 BFS (Adjacency List + Set)',
    short: 'This Project',
    complexity: 'O(k²)',
    description:
      "Local, depth-limited BFS over an adjacency list. Only visits friends-of-friends and dedups with a hash Set — work depends on the user's degree, not the network size.",
    optimized: true,
    run: optimizedRecommend,
  },
  {
    key: 'fullbfs',
    name: 'Naive Full BFS Traversal',
    short: 'Full BFS',
    complexity: 'O(V + E)',
    description:
      'Breadth-first search across the entire reachable network to compute all distances, then filter to distance-2. Correct but explores the whole graph for a local query.',
    optimized: false,
    run: fullBFSRecommend,
  },
  {
    key: 'fulldfs',
    name: 'DFS Full Component Scan',
    short: 'Full DFS',
    complexity: 'O(V + E)',
    description:
      'Depth-first traversal visiting every reachable node. The standard textbook whole-graph traversal — pays for the entire component on each query.',
    optimized: false,
    run: fullDFSRecommend,
  },
  {
    key: 'matrix',
    name: 'Adjacency-Matrix / Brute-Force Pairwise (A²)',
    short: 'Matrix A²',
    complexity: 'O(V · k)',
    description:
      'The dense matrix approach: test every user in the network for a shared connection (the squared-adjacency-matrix idea, done directly). Scales with total population.',
    optimized: false,
    run: bruteForceRecommend,
  },
];

// ---------------------------------------------------------------------------
// Timing harness.
// ---------------------------------------------------------------------------
export interface AlgoResult {
  key: string;
  short: string;
  name: string;
  complexity: string;
  optimized: boolean;
  totalMs: number;
  perQueryUs: number; // microseconds per recommendation query
  queriesPerSec: number;
  speedupVsSlowest: number;
}

// Evenly sample source nodes across the id range for a representative mix of
// hubs and leaves.
function sampleSources(size: number, count: number): Int32Array {
  const n = Math.min(count, size);
  const out = new Int32Array(n);
  const step = size / n;
  for (let i = 0; i < n; i++) out[i] = Math.floor(i * step);
  return out;
}

function timeAlgo(g: FastGraph, algo: AlgoSpec, sources: Int32Array): number {
  // Warmup to let the JIT settle.
  let sink = 0;
  for (let i = 0; i < Math.min(sources.length, 20); i++) {
    sink += algo.run(g, sources[i]);
  }
  const t0 = performance.now();
  for (let i = 0; i < sources.length; i++) {
    sink += algo.run(g, sources[i]);
  }
  const t1 = performance.now();
  // Prevent dead-code elimination.
  if (sink === -1) console.log(sink);
  return t1 - t0;
}

export interface BenchmarkOutput {
  graph: { size: number; edges: number; avgDegree: number };
  queries: number;
  results: AlgoResult[];
}

// Run the full single-size benchmark. Yields between algorithms so a progress
// callback can update the UI without freezing the main thread.
export async function runBenchmark(
  size: number,
  queries: number,
  onProgress?: (frac: number, label: string) => void
): Promise<BenchmarkOutput> {
  onProgress?.(0.05, `Generating ${size.toLocaleString()}-node scale-free network…`);
  await yieldToUI();
  const g = generateSocialGraph(size);

  const sources = sampleSources(size, queries);
  const raw: { algo: AlgoSpec; ms: number }[] = [];

  for (let i = 0; i < ALGORITHMS.length; i++) {
    const algo = ALGORITHMS[i];
    onProgress?.(0.15 + (0.8 * i) / ALGORITHMS.length, `Benchmarking: ${algo.short}…`);
    await yieldToUI();
    const ms = timeAlgo(g, algo, sources);
    raw.push({ algo, ms });
  }

  const slowest = Math.max(...raw.map((r) => r.ms)) || 1;
  const results: AlgoResult[] = raw.map(({ algo, ms }) => ({
    key: algo.key,
    short: algo.short,
    name: algo.name,
    complexity: algo.complexity,
    optimized: algo.optimized,
    totalMs: ms,
    perQueryUs: (ms / sources.length) * 1000,
    queriesPerSec: ms > 0 ? (sources.length / ms) * 1000 : 0,
    speedupVsSlowest: ms > 0 ? slowest / ms : 1,
  }));

  onProgress?.(1, 'Done');
  return {
    graph: { size: g.size, edges: g.edges, avgDegree: g.avgDegree },
    queries: sources.length,
    results,
  };
}

// ---------------------------------------------------------------------------
// Scaling sweep — the headline visual. Runs every algorithm at increasing
// network sizes so we can plot how runtime grows. The optimized algorithm
// stays flat; the whole-graph approaches climb with V.
// ---------------------------------------------------------------------------
export interface ScalingPoint {
  size: number;
  [algoKey: string]: number;
}

export async function runScalingSweep(
  sizes: number[],
  queriesPerSize: number,
  onProgress?: (frac: number, label: string) => void
): Promise<ScalingPoint[]> {
  const points: ScalingPoint[] = [];
  const totalSteps = sizes.length * ALGORITHMS.length;
  let step = 0;

  for (const size of sizes) {
    const g = generateSocialGraph(size);
    const sources = sampleSources(size, queriesPerSize);
    const point: ScalingPoint = { size };
    for (const algo of ALGORITHMS) {
      onProgress?.(
        step / totalSteps,
        `Scaling ${algo.short} @ ${size.toLocaleString()} nodes…`
      );
      await yieldToUI();
      const ms = timeAlgo(g, algo, sources);
      // Per-query microseconds keeps the curves comparable across sizes.
      point[algo.key] = +((ms / sources.length) * 1000).toFixed(2);
      step++;
    }
    points.push(point);
  }
  onProgress?.(1, 'Done');
  return points;
}

function yieldToUI(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Synchronous variants — no UI yields. Used for headless screenshot capture
// where the setTimeout-based async pipeline does not drain reliably.
export function runBenchmarkSync(size: number, queries: number): BenchmarkOutput {
  const g = generateSocialGraph(size);
  const sources = sampleSources(size, queries);
  const raw = ALGORITHMS.map((algo) => ({ algo, ms: timeAlgo(g, algo, sources) }));
  const slowest = Math.max(...raw.map((r) => r.ms)) || 1;
  const results: AlgoResult[] = raw.map(({ algo, ms }) => ({
    key: algo.key,
    short: algo.short,
    name: algo.name,
    complexity: algo.complexity,
    optimized: algo.optimized,
    totalMs: ms,
    perQueryUs: (ms / sources.length) * 1000,
    queriesPerSec: ms > 0 ? (sources.length / ms) * 1000 : 0,
    speedupVsSlowest: ms > 0 ? slowest / ms : 1,
  }));
  return {
    graph: { size: g.size, edges: g.edges, avgDegree: g.avgDegree },
    queries: sources.length,
    results,
  };
}

export function runScalingSweepSync(sizes: number[], queriesPerSize: number): ScalingPoint[] {
  return sizes.map((size) => {
    const g = generateSocialGraph(size);
    const sources = sampleSources(size, queriesPerSize);
    const point: ScalingPoint = { size };
    for (const algo of ALGORITHMS) {
      const ms = timeAlgo(g, algo, sources);
      point[algo.key] = +((ms / sources.length) * 1000).toFixed(2);
    }
    return point;
  });
}
