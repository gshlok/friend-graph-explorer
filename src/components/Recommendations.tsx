import { useState } from 'react';
import { useGraph } from '@/context/GraphContext';
import { Sparkles, Route, ChevronDown, ChevronUp, Users } from 'lucide-react';

export function Recommendations() {
  const { selectedUser, recommendations } = useGraph();
  const [showPaths, setShowPaths] = useState(false);

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
        <div className="flex flex-col items-center py-8 text-center">
          <Users className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">
            Select a user to see recommendations
          </p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">
            No recommendations available
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            {selectedUser.name} needs more friends-of-friends connections
          </p>
        </div>
      ) : (
        <>
          {/* Path Toggle */}
          <button
            onClick={() => setShowPaths(!showPaths)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 mb-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm text-muted-foreground"
          >
            <Route className="w-4 h-4" />
            <span>{showPaths ? 'Hide' : 'Show'} Traversal Paths</span>
            {showPaths ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

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
                      {rec.mutualCount <= 2 && ': '}
                      {rec.mutualCount <= 2 && (
                        <span className="text-muted-foreground">
                          {rec.mutualFriends.map(f => f.name).join(', ')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Mutual Friends Chips (when more than 2) */}
                {rec.mutualCount > 2 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {rec.mutualFriends.map((mutual) => (
                      <span
                        key={mutual.id}
                        className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                      >
                        {mutual.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Traversal Path Visualization */}
                {showPaths && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-xs text-muted-foreground mb-2">
                      BFS Path (depth 2):
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded bg-node-selected/20 text-node-selected font-medium">
                        {selectedUser.name}
                      </span>
                      {rec.mutualFriends.map((mutual, index) => (
                        <div key={mutual.id} className="flex items-center gap-2">
                          {index === 0 && (
                            <span className="text-muted-foreground">→</span>
                          )}
                          <span className="px-2 py-1 rounded bg-node-friend/20 text-node-friend">
                            {mutual.name}
                          </span>
                          {index === 0 && (
                            <>
                              <span className="text-muted-foreground">→</span>
                              <span className="px-2 py-1 rounded bg-accent/20 text-accent font-medium">
                                {rec.user.name}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    {rec.mutualCount > 1 && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        +{rec.mutualCount - 1} more path{rec.mutualCount > 2 ? 's' : ''} via other mutual friends
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
