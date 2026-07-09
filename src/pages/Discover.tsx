import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useGraph } from '@/context/GraphContext';
import { ingestProfile } from '@/lib/instagram';
import { InstagramProfile } from '@/lib/personalizedGraph';
import { GraphVisualization } from '@/components/GraphVisualization';
import {
  Instagram,
  Radar,
  ShieldCheck,
  Lock,
  Sparkles,
  Users,
  UserPlus,
  Image as ImageIcon,
  Network,
  Terminal,
  ArrowRight,
  Zap,
} from 'lucide-react';

type Phase = 'idle' | 'scanning' | 'reveal';

interface ScanStep {
  label: string;
  detail?: string;
}

const abbrev = (n: number): string =>
  n >= 1_000_000
    ? (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
    : n >= 1_000
    ? (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
    : String(n);

const Discover = () => {
  const { loadPersonalizedGraph, personalized } = useGraph();
  const [handle, setHandle] = useState('');
  // If a profile is already cached (from a prior fetch), show its reveal.
  const [phase, setPhase] = useState<Phase>(personalized ? 'reveal' : 'idle');
  const [steps, setSteps] = useState<ScanStep[]>([]);
  const [live, setLive] = useState(true);
  const [note, setNote] = useState<string | undefined>();
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const pushStep = (label: string, detail?: string, delay = 0) => {
    const t = window.setTimeout(
      () => setSteps((s) => [...s, { label, detail }]),
      delay
    );
    timers.current.push(t);
  };

  const run = async () => {
    const h = handle.trim().replace(/^@/, '');
    if (!h || phase === 'scanning') return;

    setPhase('scanning');
    setSteps([]);
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Animated trace that mirrors the real terminal logs.
    pushStep('Resolving handle', `@${h}`, 150);
    pushStep('Opening secure channel', 'api.apify.com', 650);
    pushStep('Dispatching Instagram actor', 'instagram-profile-scraper', 1150);
    pushStep('Reading public profile header', 'followers · following · posts', 1850);

    const started = Date.now();
    const result = await ingestProfile(h);
    const profile = result.profile as InstagramProfile;
    setLive(result.live);
    setNote(result.note);

    // Ensure the scan animation is visible even if the fetch was instant.
    const minScan = 2600;
    const wait = Math.max(0, minScan - (Date.now() - started));

    const finish = window.setTimeout(() => {
      pushStep(
        'Normalizing metrics',
        `${abbrev(profile.followers)} followers · ${abbrev(profile.following)} following`
      );
      pushStep('Seeding network model', `deterministic · @${profile.handle}`, 400);
      pushStep('Rendering personalized graph', undefined, 800);

      const reveal = window.setTimeout(() => {
        loadPersonalizedGraph(profile);
        setPhase('reveal');
      }, 1300);
      timers.current.push(reveal);
    }, wait);
    timers.current.push(finish);
  };

  const profile = personalized?.profile;

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/4 left-1/4 w-[40rem] h-[40rem] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>

      <div className="relative container max-w-5xl py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            Live social-graph ingest
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            See the algorithm run on{' '}
            <span className="bg-gradient-to-r from-primary via-fuchsia-400 to-primary bg-clip-text text-transparent">
              your network
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enter an Instagram handle. We pull the <strong>real</strong> public profile
            live via Apify, then model a representative network around it — and run the
            friend-recommendation algorithm on it in real time.
          </p>
        </div>

        {/* Input */}
        <div className="max-w-xl mx-auto">
          <div className="glass-card rounded-2xl p-2 flex items-center gap-2 shadow-lg shadow-primary/5 border border-border/60">
            <div className="pl-3 text-muted-foreground">
              <Instagram className="w-5 h-5" />
            </div>
            <Input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              placeholder="your.instagram.handle"
              disabled={phase === 'scanning'}
              className="border-0 bg-transparent focus-visible:ring-0 text-base"
            />
            <Button
              onClick={run}
              disabled={phase === 'scanning' || !handle.trim()}
              className="gap-2 rounded-xl px-5"
            >
              {phase === 'scanning' ? (
                <>
                  <Radar className="w-4 h-4 animate-spin" />
                  Scanning
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Reveal
                </>
              )}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            Watch the terminal running <code className="text-primary">npm run dev</code> — the
            live ingest is traced there in real time.
          </p>
        </div>

        {/* Scanning trace */}
        {phase === 'scanning' && (
          <div className="max-w-xl mx-auto mt-8 glass-card rounded-xl border border-border/60 overflow-hidden fade-in">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-card/40">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
                <span className="w-3 h-3 rounded-full bg-green-400/70" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                socialgraph · ingest
              </span>
            </div>
            <div className="p-4 font-mono text-sm space-y-2 min-h-[9rem]">
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-2 fade-in">
                  <span className="text-green-400 mt-0.5">›</span>
                  <span className="text-foreground">{s.label}</span>
                  {s.detail && (
                    <span className="text-muted-foreground truncate">— {s.detail}</span>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2 text-primary">
                <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Reveal */}
        {phase === 'reveal' && profile && personalized && (
          <div className="mt-10 space-y-6 fade-in">
            {/* Profile card */}
            <div className="glass-card rounded-2xl border border-border/60 p-6 md:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar profile={profile} />

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                    {profile.verified && (
                      <ShieldCheck className="w-5 h-5 text-sky-400" />
                    )}
                    {profile.isPrivate && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Lock className="w-3 h-3" /> Private
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{profile.handle}</p>
                  {profile.biography && (
                    <p className="text-sm mt-2 max-w-md">{profile.biography}</p>
                  )}

                  <div className="flex items-center justify-center sm:justify-start gap-6 mt-4">
                    <Stat icon={ImageIcon} label="Posts" value={profile.posts} />
                    <Stat icon={Users} label="Followers" value={profile.followers} />
                    <Stat icon={UserPlus} label="Following" value={profile.following} />
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Archetype
                  </div>
                  <Badge className="text-base px-4 py-1.5 bg-primary/15 text-primary border-primary/30">
                    {personalized.archetype}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-2 font-mono">
                    ratio {personalized.ratio.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Provenance strip */}
              <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {live ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Live data · Apify
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      Modeled profile (live ingest unavailable)
                    </>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5" />
                  {personalized.visibleNodes} nodes · {personalized.visibleEdges} edges
                </span>
                <span className="font-mono">seed {personalized.seedHex}</span>
              </div>

              {/* Honesty note */}
              <p className="mt-4 text-xs text-muted-foreground/80 leading-relaxed">
                <Lock className="w-3 h-3 inline mr-1 -mt-0.5" />
                Instagram never exposes a private account's connections, so the
                surrounding nodes are <strong>anonymous and modeled</strong> from{' '}
                {profile.fullName}'s real public stats — the profile at the centre is real,
                the network shape is representative.
              </p>
            </div>

            {/* The live graph */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary" />
                  Recommendation algorithm · live
                </h3>
                <Link to="/">
                  <Button variant="outline" size="sm" className="gap-2">
                    Full explorer <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <GraphVisualization />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function Avatar({ profile }: { profile: InstagramProfile }) {
  const [failed, setFailed] = useState(false);
  const initials = (profile.fullName || profile.handle)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const showImg = profile.avatarUrl && !failed;
  return (
    <div className="relative">
      <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-primary via-fuchsia-500 to-amber-400">
        {showImg ? (
          <img
            src={profile.avatarUrl!}
            alt={profile.handle}
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="w-full h-full rounded-full object-cover bg-card"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-2xl font-bold text-primary">
            {initials || '?'}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold flex items-center gap-1.5 justify-center">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {abbrev(value)}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default Discover;
