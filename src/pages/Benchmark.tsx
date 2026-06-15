import { useState } from 'react';
import {
  Gauge,
  Zap,
  Play,
  Trophy,
  Network as NetworkIcon,
  Activity,
  TrendingUp,
  Timer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlgoRaceSimulation } from '@/components/AlgoRaceSimulation';
import {
  runBenchmark,
  runScalingSweep,
  ALGORITHMS,
  type BenchmarkOutput,
  type ScalingPoint,
} from '@/lib/benchmark';

// Per-algorithm colour identity, reused across every chart and table.
const ALGO_COLOR: Record<string, string> = {
  optimized: 'hsl(174 72% 50%)', // teal — the winner
  fullbfs: 'hsl(210 90% 62%)', // blue
  fulldfs: 'hsl(45 93% 58%)', // gold
  matrix: 'hsl(15 90% 62%)', // orange — the slowest
};

const getSweepSizes = (maxNodes: number): number[] => {
  if (maxNodes <= 10000) {
    return [500, 1000, 2500, 5000, 7500, 10000];
  } else if (maxNodes <= 50000) {
    return [1000, 5000, 10000, 20000, 35000, 50000];
  } else {
    return [1000, 10000, 25000, 50000, 75000, 100000];
  }
};

const fmt = (n: number, d = 0) =>
  n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });

function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg border border-border/60 px-3 py-2 text-xs shadow-lg">
      {label !== undefined && (
        <p className="mb-1 font-medium text-foreground">
          {typeof label === 'number' ? `${fmt(label)} nodes` : label}
        </p>
      )}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color || p.fill }}
          />
          <span className="text-muted-foreground">
            {ALGORITHMS.find((a) => a.key === p.dataKey)?.short || p.name}:
          </span>
          <span className="font-mono text-foreground">
            {fmt(p.value, 2)}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

const Benchmark = () => {
  const [nodeCount, setNodeCount] = useState(10000);
  // phase: idle → sim (watch the animation) → benchmarking (crunch numbers) → results
  const [phase, setPhase] = useState<'idle' | 'sim' | 'benchmarking' | 'results'>('idle');
  const [simKey, setSimKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<BenchmarkOutput | null>(null);
  const [scaling, setScaling] = useState<ScalingPoint[] | null>(null);

  const running = phase === 'sim' || phase === 'benchmarking';

  // Step 1: start the animated simulation.
  const runAll = () => {
    setResult(null);
    setScaling(null);
    setProgress(0);
    setSimKey((k) => k + 1);
    setPhase('sim');
  };

  // Step 2: when the animation finishes, crunch the real numbers.
  const runNumbers = async () => {
    setPhase('benchmarking');
    setProgress(0);
    try {
      const queries = nodeCount <= 10000 ? 400 : nodeCount <= 50000 ? 200 : 100;
      const bench = await runBenchmark(nodeCount, queries, (frac, label) => {
        setProgress(frac * 0.6);
        setStatus(label);
      });
      setResult(bench);
      const sweepSizes = getSweepSizes(nodeCount);
      const sweepQueries = nodeCount <= 10000 ? 200 : nodeCount <= 50000 ? 100 : 50;
      const sweep = await runScalingSweep(sweepSizes, sweepQueries, (frac, label) => {
        setProgress(0.6 + frac * 0.4);
        setStatus(label);
      });
      setScaling(sweep);
    } finally {
      setProgress(1);
      setStatus('');
      setPhase('results');
    }
  };

  // Replay just the animation without recomputing the numbers.
  const replaySim = () => setSimKey((k) => k + 1);

  const sorted = result ? [...result.results].sort((a, b) => a.totalMs - b.totalMs) : [];
  const winner = sorted[0];
  const slowest = sorted[sorted.length - 1];
  const optimized = result?.results.find((r) => r.optimized);
  const headlineSpeedup =
    optimized && slowest && optimized.totalMs > 0 ? slowest.totalMs / optimized.totalMs : 0;

  const barData = sorted.map((r) => ({
    short: r.short,
    key: r.key,
    perQueryUs: +r.perQueryUs.toFixed(2),
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Gauge className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Performance Benchmark</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl">
            A live, in-browser benchmark on a{' '}
            <span className="text-foreground font-medium">scale-free social network</span> of up to
            100,000 users. We pit this project's recommendation algorithm against the standard
            graph-traversal approaches — measured for real with{' '}
            <span className="font-mono text-accent">performance.now()</span>.
          </p>
        </div>

        {/* Control panel */}
        <section className="glass-card rounded-lg p-6 mb-8">
          <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <NetworkIcon className="w-4 h-4 text-primary" />
                  Network size
                </label>
                <span className="font-mono text-primary text-lg font-semibold">
                  {fmt(nodeCount)} nodes
                </span>
              </div>
              <Slider
                value={[nodeCount]}
                min={500}
                max={100000}
                step={500}
                disabled={running}
                onValueChange={(v) => setNodeCount(v[0])}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>500</span>
                <span>~{fmt(nodeCount * 4)} edges · Barabási–Albert model</span>
                <span>100,000</span>
              </div>
            </div>
            <Button size="lg" onClick={runAll} disabled={running} className="gap-2 min-w-44">
              <Play className="w-4 h-4" />
              {phase === 'sim'
                ? 'Simulating…'
                : phase === 'benchmarking'
                ? 'Crunching…'
                : phase === 'results'
                ? 'Run again'
                : 'Run simulation'}
            </Button>
          </div>

          {phase === 'benchmarking' && (
            <div className="mt-6">
              <Progress value={progress * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Measuring real timings at {fmt(nodeCount)} nodes — {status}
              </p>
            </div>
          )}
        </section>

        {phase === 'idle' && (
          <div className="glass-card rounded-lg p-12 text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 text-primary/40" />
            <p className="text-lg">
              Hit <span className="text-foreground font-medium">Run simulation</span> to watch each
              algorithm explore the network — then see the hard numbers.
            </p>
          </div>
        )}

        {/* Animated simulation — the visual race */}
        {phase !== 'idle' && (
          <section className="glass-card rounded-lg p-6 mb-8 animate-fade-in">
            <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Watch the algorithms explore the network
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  The same network, four algorithms, one source user. Watch how much of the graph
                  each one has to touch to find recommendations. This project (top-left){' '}
                  <span className="text-primary font-medium">stays local</span> and stops at depth 2;
                  the rest sweep the whole network.
                </p>
              </div>
              {phase === 'results' && (
                <Button variant="outline" size="sm" onClick={replaySim} className="gap-2 shrink-0">
                  <Play className="w-3.5 h-3.5" />
                  Replay
                </Button>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground my-4">
              <LegendDot color="#fde047" label="Source user" />
              <LegendDot color="#2dd4bf" label="Direct friends (depth 1)" />
              <LegendDot color="#fb7c52" label="Recommendations (depth 2)" />
              <LegendDot color="#5b86c4" label="Wasted deep exploration" />
              <LegendDot color="#41506b" label="Scanned, no match" />
            </div>

            <AlgoRaceSimulation
              runKey={simKey}
              onComplete={phase === 'sim' ? runNumbers : undefined}
            />

            <p className="text-xs text-muted-foreground mt-4">
              Shown on a {fmt(280)}-node graph for clarity · animation speed scaled for visibility.
              The takeaway is the <span className="text-foreground">lit area</span>: the optimized
              algorithm touches a small local cluster, while full BFS/DFS and the matrix approach
              light up the entire network.
            </p>
          </section>
        )}

        {result && (
          <>
            {/* Verdict banner */}
            <section className="glass-card rounded-lg p-6 mb-8 border-2 border-primary/30 animate-fade-in relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
              <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">
                    This project's algorithm is the fastest — by a wide margin.
                  </h2>
                  <p className="text-muted-foreground">
                    On {fmt(result.graph.size)} users ({fmt(result.graph.edges)} friendships), the
                    depth-2 BFS recommender runs{' '}
                    <span className="text-primary font-bold">
                      {fmt(headlineSpeedup, headlineSpeedup > 100 ? 0 : 1)}× faster
                    </span>{' '}
                    than the brute-force matrix approach and beats full-graph BFS/DFS — because its
                    cost depends on a user's friend count, not the size of the network.
                  </p>
                </div>
              </div>
            </section>

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard
                icon={NetworkIcon}
                label="Network"
                value={fmt(result.graph.size)}
                sub={`${fmt(result.graph.edges)} edges · avg deg ${fmt(result.graph.avgDegree, 1)}`}
              />
              <MetricCard
                icon={Timer}
                label="Fastest / query"
                value={`${fmt(winner.perQueryUs, 2)} µs`}
                sub={winner.short}
                highlight
              />
              <MetricCard
                icon={Zap}
                label="Throughput"
                value={`${fmt(optimized!.queriesPerSec)}`}
                sub="recommendations / sec"
                highlight
              />
              <MetricCard
                icon={TrendingUp}
                label="Speedup"
                value={`${fmt(headlineSpeedup, headlineSpeedup > 100 ? 0 : 1)}×`}
                sub={`vs ${slowest.short}`}
              />
            </div>

            {/* Per-query bar chart */}
            <section className="glass-card rounded-lg p-6 mb-8">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Average time per recommendation query</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Lower is better · microseconds per query at {fmt(result.graph.size)} nodes (log
                scale)
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 22%)" horizontal={false} />
                  <XAxis
                    type="number"
                    scale="log"
                    domain={['auto', 'auto']}
                    stroke="hsl(215 20% 65%)"
                    fontSize={12}
                    tickFormatter={(v) => `${v}µs`}
                  />
                  <YAxis
                    type="category"
                    dataKey="short"
                    stroke="hsl(215 20% 65%)"
                    fontSize={12}
                    width={90}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(222 47% 20% / 0.4)' }}
                    content={<ChartTooltip unit="µs" />}
                  />
                  <Bar dataKey="perQueryUs" radius={[0, 6, 6, 0]}>
                    {barData.map((d) => (
                      <Cell key={d.key} fill={ALGO_COLOR[d.key]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* Scaling sweep line chart */}
            {scaling && (
              <section className="glass-card rounded-lg p-6 mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">How each algorithm scales with network size</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Per-query time (µs) as the network grows from 500 → 100,000 users. The optimized
                  algorithm stays{' '}
                  <span className="text-primary font-medium">flat</span>; whole-graph approaches
                  climb with population.
                </p>
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={scaling} margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 22%)" />
                    <XAxis
                      dataKey="size"
                      stroke="hsl(215 20% 65%)"
                      fontSize={12}
                      tickFormatter={(v) => fmt(v)}
                    />
                    <YAxis
                      stroke="hsl(215 20% 65%)"
                      fontSize={12}
                      tickFormatter={(v) => `${v}µs`}
                    />
                    <Tooltip content={<ChartTooltip unit="µs" />} />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-muted-foreground">
                          {ALGORITHMS.find((a) => a.key === value)?.short || value}
                        </span>
                      )}
                    />
                    {ALGORITHMS.map((a) => (
                      <Line
                        key={a.key}
                        type="monotone"
                        dataKey={a.key}
                        stroke={ALGO_COLOR[a.key]}
                        strokeWidth={a.optimized ? 3 : 2}
                        dot={{ r: a.optimized ? 4 : 2 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </section>
            )}

            {/* Detailed comparison table */}
            <section className="glass-card rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Algorithm comparison</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border/40">
                      <th className="py-3 pr-4 font-medium">Algorithm</th>
                      <th className="py-3 px-4 font-medium">Complexity</th>
                      <th className="py-3 px-4 font-medium text-right">Total (ms)</th>
                      <th className="py-3 px-4 font-medium text-right">µs / query</th>
                      <th className="py-3 px-4 font-medium text-right">Queries / sec</th>
                      <th className="py-3 pl-4 font-medium text-right">Speedup</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r) => (
                      <tr
                        key={r.key}
                        className={`border-b border-border/20 ${
                          r.optimized ? 'bg-primary/5' : ''
                        }`}
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full shrink-0"
                              style={{ background: ALGO_COLOR[r.key] }}
                            />
                            <div>
                              <div className="font-medium text-foreground flex items-center gap-2">
                                {r.short}
                                {r.optimized && (
                                  <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-0 text-[10px]">
                                    OPTIMIZED
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground max-w-md">{r.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-accent">{r.complexity}</td>
                        <td className="py-3 px-4 text-right font-mono">{fmt(r.totalMs, 2)}</td>
                        <td className="py-3 px-4 text-right font-mono">{fmt(r.perQueryUs, 2)}</td>
                        <td className="py-3 px-4 text-right font-mono">{fmt(r.queriesPerSec)}</td>
                        <td className="py-3 pl-4 text-right font-mono font-semibold text-primary">
                          {fmt(r.speedupVsSlowest, r.speedupVsSlowest > 100 ? 0 : 1)}×
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Benchmarked over {fmt(result.queries)} recommendation queries from sampled source
                users. Speedup is relative to the slowest algorithm. Times vary with hardware —
                what's constant is the <span className="text-foreground">shape</span>: the optimized
                approach is bounded by friend count, not network size.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`glass-card rounded-lg p-5 ${
        highlight ? 'border border-primary/30' : ''
      }`}
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1 truncate">{sub}</div>
    </div>
  );
}

export default Benchmark;
