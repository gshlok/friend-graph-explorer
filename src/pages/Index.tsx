import { GraphProvider } from '@/context/GraphContext';
import { UserSelector } from '@/components/UserSelector';
import { ActiveUserCard } from '@/components/ActiveUserCard';
import { AddUserForm } from '@/components/AddUserForm';
import { AddFriendshipForm } from '@/components/AddFriendshipForm';
import { FriendsList } from '@/components/FriendsList';
import { Recommendations } from '@/components/Recommendations';
import { GraphVisualization } from '@/components/GraphVisualization';
import { StatsBar } from '@/components/StatsBar';
import { Network, Grid3x3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <GraphProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
          <div className="container py-3">
            <div className="flex items-center justify-between">
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
              <Link to="/adjacency-matrix">
                <Button variant="outline" className="gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  View Matrix
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container py-6">
          {/* Stats */}
          <section className="mb-6">
            <StatsBar />
          </section>

          <div className="grid lg:grid-cols-[350px_1fr] gap-6">
            {/* Left Sidebar - Controls */}
            <div className="space-y-4">
              {/* 1. Select User - Primary action */}
              <UserSelector />
              
              {/* 2. Active User Card - Context reinforcement */}
              <ActiveUserCard />
              
              {/* 3. Direct Friends - Distance 1 */}
              <FriendsList />
              
              {/* 4. Recommendations - Distance 2 */}
              <Recommendations />
              
              {/* 5. Add Forms - Modifications */}
              <AddUserForm />
              <AddFriendshipForm />
              
              {/* Algorithm Explanation */}
              <section className="glass-card rounded-lg p-4 fade-in">
                <h3 className="text-sm font-semibold mb-3">How It Works</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="font-medium text-primary mb-1">Graph Structure</p>
                    <p className="text-muted-foreground">
                      Users as nodes, friendships as edges.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-primary mb-1">BFS Traversal</p>
                    <p className="text-muted-foreground">
                      Finds friends of friends at distance 2.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-primary mb-1">Ranking</p>
                    <p className="text-muted-foreground">
                      Ranked by mutual friend count.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Main Content - Graph Visualization (Bigger) */}
            <div>
              <GraphVisualization />
            </div>
          </div>
        </main>
      </div>
    </GraphProvider>
  );
};

export default Index;
