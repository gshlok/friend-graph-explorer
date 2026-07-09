import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserSelector } from '@/components/UserSelector';
import { FriendsList } from '@/components/FriendsList';
import { Recommendations } from '@/components/Recommendations';
import { GraphVisualization } from '@/components/GraphVisualization';
import { useGraph } from '@/context/GraphContext';
import { InstagramProfile } from '@/lib/personalizedGraph';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  Image as ImageIcon,
  ShieldCheck,
  Lock,
  Sparkles,
  Pencil,
} from 'lucide-react';

const abbrev = (n: number): string =>
  n >= 1_000_000
    ? (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
    : n >= 1_000
    ? (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
    : String(n);

const Home = () => {
  const { personalized } = useGraph();
  const profile = personalized?.profile;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        {profile ? (
          <ProfileBanner profile={profile} archetype={personalized!.archetype} />
        ) : (
          <PersonalizeCta />
        )}

        <div className="grid lg:grid-cols-[350px_1fr] gap-6 items-start">
          {/* Left Sidebar - User Details (scrolls) */}
          <div className="space-y-4">
            <UserSelector />
            <FriendsList />
            <Recommendations />
          </div>

          {/* Main Content - Graph (sticky so it stays in view while scrolling) */}
          <div className="lg:sticky lg:top-6 self-start">
            <GraphVisualization />
          </div>
        </div>
      </div>
    </div>
  );
};

function ProfileBanner({
  profile,
  archetype,
}: {
  profile: InstagramProfile;
  archetype: string;
}) {
  const live = profile.source === 'apify';
  return (
    <div className="glass-card rounded-2xl border border-border/60 p-4 mb-6 flex flex-wrap items-center gap-4">
      <BannerAvatar profile={profile} />

      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-bold truncate">{profile.fullName}</h2>
          {profile.verified && <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />}
          {profile.isPrivate && (
            <Badge variant="secondary" className="gap-1 text-[10px] py-0">
              <Lock className="w-2.5 h-2.5" /> Private
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">@{profile.handle}</p>
      </div>

      {/* Real fetched metrics */}
      <div className="flex items-center gap-6 ml-auto">
        <Metric icon={ImageIcon} label="Posts" value={profile.posts} />
        <Metric icon={Users} label="Followers" value={profile.followers} highlight />
        <Metric icon={UserPlus} label="Following" value={profile.following} />
      </div>

      <div className="flex items-center gap-3 pl-4 border-l border-border/50">
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Archetype
          </div>
          <Badge className="bg-primary/15 text-primary border-primary/30">{archetype}</Badge>
        </div>
        <span
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          title={live ? 'Fetched live from Apify' : 'Modeled locally'}
        >
          <span
            className={`w-2 h-2 rounded-full ${live ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}
          />
          {live ? 'Live' : 'Modeled'}
        </span>
        <Link to="/discover">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="w-3.5 h-3.5" />
            Change
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`text-xl font-bold leading-none flex items-center gap-1.5 justify-center ${
          highlight ? 'text-primary' : ''
        }`}
      >
        <Icon className="w-4 h-4 text-muted-foreground" />
        {abbrev(value)}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function BannerAvatar({ profile }: { profile: InstagramProfile }) {
  const [failed, setFailed] = useState(false);
  const initials = (profile.fullName || profile.handle)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const showImg = profile.avatarUrl && !failed;
  return (
    <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-primary via-fuchsia-500 to-amber-400 shrink-0">
      {showImg ? (
        <img
          src={profile.avatarUrl!}
          alt={profile.handle}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full rounded-full object-cover bg-card"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-sm font-bold text-primary">
          {initials || '?'}
        </div>
      )}
    </div>
  );
}

function PersonalizeCta() {
  return (
    <Link to="/discover">
      <div className="glass-card rounded-2xl border border-primary/30 p-4 mb-6 flex items-center gap-3 hover:border-primary/50 transition-colors">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Personalize this graph</p>
          <p className="text-sm text-muted-foreground">
            Enter an Instagram handle to run the algorithm on a real profile.
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Sparkles className="w-4 h-4" /> Discover
        </Button>
      </div>
    </Link>
  );
}

export default Home;
