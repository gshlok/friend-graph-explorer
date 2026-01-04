import { GraphProvider } from '@/context/GraphContext';
import { AdjacencyListView } from '@/components/AdjacencyListView';
import { Network, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AdjacencyMatrix = () => {
  return (
    <GraphProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
          <div className="container py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Network className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Adjacency Matrix</h1>
                  <p className="text-sm text-muted-foreground">
                    2D matrix representation of the social network graph
                  </p>
                </div>
              </div>
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Graph
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container py-8">
          <div className="max-w-5xl mx-auto">
            <AdjacencyListView />
            
            {/* Explanation */}
            <section className="mt-8 glass-card rounded-lg p-6 animate-fade-in">
              <h2 className="text-lg font-semibold mb-4">Understanding the Adjacency Matrix</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  An <span className="text-primary font-medium">adjacency matrix</span> is a 2D array representation of a graph where:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Each row and column represents a node (user) in the graph</li>
                  <li>A value of <span className="text-node-friend font-medium">1</span> (checkmark) at position [i][j] indicates an edge between user i and user j</li>
                  <li>A value of <span className="text-muted-foreground font-medium">0</span> indicates no connection</li>
                  <li>The diagonal is empty (N/A) as users don't connect to themselves</li>
                  <li>For undirected graphs, the matrix is <span className="text-primary font-medium">symmetric</span> across the diagonal</li>
                </ul>
                <div className="pt-4 border-t border-border/30">
                  <h3 className="text-foreground font-medium mb-2">Time Complexity</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Check if edge exists: <span className="font-mono text-accent">O(1)</span></li>
                    <li>Get all neighbors: <span className="font-mono text-accent">O(n)</span></li>
                    <li>Add edge: <span className="font-mono text-accent">O(1)</span></li>
                    <li>Space complexity: <span className="font-mono text-accent">O(n²)</span></li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </GraphProvider>
  );
};

export default AdjacencyMatrix;
