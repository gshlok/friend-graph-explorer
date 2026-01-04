import { useGraph } from '@/context/GraphContext';
import { Sparkles } from 'lucide-react';

export function Recommendations() {
  const { selectedUser, recommendations } = useGraph();

  return (
    <div className="glass-card rounded-lg p-6 fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/10">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        <h2 className="text-lg font-semibold">Friend Recommendations</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        Friends of friends, ranked by mutual connections
      </p>
      
      {!selectedUser ? (
        <p className="text-muted-foreground text-sm">
          Select a user to see recommendations
        </p>
      ) : recommendations.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No recommendations available for {selectedUser.name}
        </p>
      ) : (
        <ul className="space-y-3">
          {recommendations.map((rec) => (
            <li
              key={rec.user.id}
              className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-accent/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-lg font-semibold text-accent">
                    {rec.user.name[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold">{rec.user.name}</span>
                  <p className="text-sm text-accent">
                    {rec.mutualCount} mutual friend{rec.mutualCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {rec.mutualFriends.map((mutual) => (
                  <span
                    key={mutual.id}
                    className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                  >
                    {mutual.name}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
