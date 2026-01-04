import { GraphProvider } from '@/context/GraphContext';
import { UserSelector } from '@/components/UserSelector';
import { AddUserForm } from '@/components/AddUserForm';
import { AddFriendshipForm } from '@/components/AddFriendshipForm';
import { FriendsList } from '@/components/FriendsList';
import { Recommendations } from '@/components/Recommendations';
import { GraphVisualization } from '@/components/GraphVisualization';
import { StatsBar } from '@/components/StatsBar';
import { Network } from 'lucide-react';

const Index = () => {
  return (
    <GraphProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
          <div className="container py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Network className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Social Network Graph</h1>
                <p className="text-sm text-muted-foreground">
                  Friend Recommendation System using Graph Data Structures
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="container py-8">
          {/* Stats */}
          <section className="mb-8">
            <StatsBar />
          </section>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Controls */}
            <div className="space-y-6">
              <UserSelector />
              <AddUserForm />
              <AddFriendshipForm />
            </div>

            {/* Middle Column - Friends & Recommendations */}
            <div className="space-y-6">
              <FriendsList />
              <Recommendations />
            </div>

            {/* Right Column - Graph Visualization */}
            <div className="lg:col-span-1">
              <GraphVisualization />
            </div>
          </div>

          {/* Algorithm Explanation */}
          <section className="mt-12 glass-card rounded-lg p-6 fade-in">
            <h2 className="text-lg font-semibold mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h3 className="font-medium text-primary mb-2">Graph Structure</h3>
                <p className="text-muted-foreground">
                  Users are represented as nodes, friendships as undirected edges. 
                  The network uses an adjacency list for efficient traversal.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-primary mb-2">BFS Traversal</h3>
                <p className="text-muted-foreground">
                  Friend recommendations use a breadth-first search to find friends 
                  of friends (nodes at distance 2 from the selected user).
                </p>
              </div>
              <div>
                <h3 className="font-medium text-primary mb-2">Ranking Algorithm</h3>
                <p className="text-muted-foreground">
                  Recommendations are ranked by mutual friend count. More mutual 
                  connections = higher recommendation priority.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </GraphProvider>
  );
};

export default Index;
