import { AdjacencyListView } from '@/components/AdjacencyListView';

const AdjacencyMatrix = () => {
  return (
    <div className="min-h-screen bg-background">
        <div className="container py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Adjacency Matrix</h1>
            <p className="text-muted-foreground">
              2D matrix representation of the social network graph
            </p>
          </div>

          <div className="max-w-5xl">
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
        </div>
      </div>
  );
};

export default AdjacencyMatrix;
