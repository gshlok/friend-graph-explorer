import { BookOpen, Network, Search, TrendingUp, Grid3x3 } from 'lucide-react';

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">How It Works</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Understanding the algorithms and data structures behind the friend recommendation system
          </p>
        </div>

        <div className="space-y-8 max-w-5xl">
          {/* Graph Structure */}
          <section className="glass-card rounded-lg p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Network className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Graph Structure</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                The social network is represented as an <span className="text-primary font-medium">undirected graph</span> where:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><span className="text-foreground font-medium">Vertices (Nodes)</span> represent users in the network</li>
                <li><span className="text-foreground font-medium">Edges</span> represent friendship connections between users</li>
                <li>Edges are <span className="text-foreground font-medium">undirected</span> - if User A is friends with User B, then User B is friends with User A</li>
                <li>No self-loops - users cannot be friends with themselves</li>
              </ul>

              <div className="pt-4 border-t border-border/30">
                <h3 className="text-foreground font-semibold mb-3">Implementation</h3>
                <p className="mb-2">The graph uses an <span className="text-primary font-medium">adjacency list</span> representation internally:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Each user maintains a Set of their friend IDs</li>
                  <li>Enables efficient O(1) friendship checks</li>
                  <li>Space-efficient for sparse graphs (typical social networks)</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-border/30">
                <h3 className="text-foreground font-semibold mb-3">Complexity Analysis</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-background/50 rounded p-3">
                    <p className="font-medium mb-2">Time Complexity</p>
                    <ul className="space-y-1 text-sm">
                      <li>Check friendship: <span className="font-mono text-accent">O(1)</span></li>
                      <li>Get friends: <span className="font-mono text-accent">O(k)</span> where k = friend count</li>
                      <li>Add friendship: <span className="font-mono text-accent">O(1)</span></li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded p-3">
                    <p className="font-medium mb-2">Space Complexity</p>
                    <ul className="space-y-1 text-sm">
                      <li>Overall: <span className="font-mono text-accent">O(V + E)</span></li>
                      <li>V = number of vertices (users)</li>
                      <li>E = number of edges (friendships)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* BFS Traversal */}
          <section className="glass-card rounded-lg p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">BFS Traversal Algorithm</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                Friend recommendations are generated using <span className="text-primary font-medium">Breadth-First Search (BFS)</span>, 
                which explores the graph level by level from the selected user.
              </p>

              <div className="bg-background/50 rounded-lg p-4 border-l-4 border-primary">
                <h3 className="text-foreground font-semibold mb-2">Algorithm Steps</h3>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Start from the selected user (distance 0)</li>
                  <li>Explore all direct friends (distance 1)</li>
                  <li>Explore friends of friends (distance 2) - these become recommendations</li>
                  <li>Filter out users who are already direct friends</li>
                  <li>Track mutual friends for each potential recommendation</li>
                </ol>
              </div>

              <div className="pt-4 border-t border-border/30">
                <h3 className="text-foreground font-semibold mb-3">Why BFS?</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Finds shortest paths from selected user to all other users</li>
                  <li>Explores by distance level - perfect for "friends of friends"</li>
                  <li>Guarantees we find all users at distance 2</li>
                  <li>Efficient for sparse graphs (typical social networks)</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-border/30">
                <h3 className="text-foreground font-semibold mb-3">Complexity Analysis</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-background/50 rounded p-3">
                    <p className="font-medium mb-2">Time Complexity</p>
                    <ul className="space-y-1 text-sm">
                      <li>BFS traversal: <span className="font-mono text-accent">O(V + E)</span></li>
                      <li>For recommendations: <span className="font-mono text-accent">O(k²)</span></li>
                      <li>k = average friend count (typically &lt;&lt; V)</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded p-3">
                    <p className="font-medium mb-2">Space Complexity</p>
                    <ul className="space-y-1 text-sm">
                      <li>Queue: <span className="font-mono text-accent">O(V)</span></li>
                      <li>Visited set: <span className="font-mono text-accent">O(V)</span></li>
                      <li>Overall: <span className="font-mono text-accent">O(V)</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ranking Algorithm */}
          <section className="glass-card rounded-lg p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Ranking Algorithm</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                Recommendations are ranked by <span className="text-primary font-medium">mutual friend count</span> - 
                the number of common friends shared between the selected user and the potential friend.
              </p>

              <div className="bg-background/50 rounded-lg p-4 border-l-4 border-primary">
                <h3 className="text-foreground font-semibold mb-2">Ranking Logic</h3>
                <p className="mb-3">For each potential recommendation (friend of a friend):</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Count how many mutual friends they share with the selected user</li>
                  <li>More mutual friends = stronger connection = higher priority</li>
                  <li>Sort recommendations in descending order by mutual friend count</li>
                  <li>Display with mutual friend information and connection paths</li>
                </ol>
              </div>

              <div className="pt-4 border-t border-border/30">
                <h3 className="text-foreground font-semibold mb-3">Why Mutual Friends?</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><span className="text-foreground font-medium">Social proof:</span> More mutual friends indicates stronger social connection</li>
                  <li><span className="text-foreground font-medium">Trust:</span> Multiple paths to a recommendation increases trustworthiness</li>
                  <li><span className="text-foreground font-medium">Relevance:</span> Higher overlap suggests shared interests or communities</li>
                  <li><span className="text-foreground font-medium">Simple & effective:</span> Easy to understand and compute efficiently</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-border/30">
                <h3 className="text-foreground font-semibold mb-3">Complexity Analysis</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-background/50 rounded p-3">
                    <p className="font-medium mb-2">Time Complexity</p>
                    <ul className="space-y-1 text-sm">
                      <li>Count mutual friends: <span className="font-mono text-accent">O(k)</span></li>
                      <li>For all recommendations: <span className="font-mono text-accent">O(k²)</span></li>
                      <li>Sorting: <span className="font-mono text-accent">O(r log r)</span></li>
                      <li>r = recommendation count (typically small)</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded p-3">
                    <p className="font-medium mb-2">Space Complexity</p>
                    <ul className="space-y-1 text-sm">
                      <li>Recommendation storage: <span className="font-mono text-accent">O(r)</span></li>
                      <li>Mutual friend tracking: <span className="font-mono text-accent">O(r × k)</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Adjacency Matrix */}
          <section className="glass-card rounded-lg p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Grid3x3 className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold">Adjacency Matrix Representation</h2>
            </div>
            
            <div className="space-y-4 text-muted-foreground">
              <p>
                While the internal implementation uses an adjacency list, the system also displays an 
                <span className="text-primary font-medium"> adjacency matrix</span> for visualization and analysis.
              </p>

              <div className="bg-background/50 rounded-lg p-4 border-l-4 border-primary">
                <h3 className="text-foreground font-semibold mb-2">Matrix Structure</h3>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>2D matrix where rows and columns represent users</li>
                  <li>Matrix[i][j] = 1 (✓) if users i and j are friends</li>
                  <li>Matrix[i][j] = 0 if no friendship exists</li>
                  <li>Diagonal is N/A (users don't connect to themselves)</li>
                  <li>Symmetric matrix (Matrix[i][j] = Matrix[j][i]) for undirected graphs</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-border/30">
                <h3 className="text-foreground font-semibold mb-3">Advantages & Trade-offs</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-background/50 rounded p-3">
                    <p className="font-medium text-green-500 mb-2">Advantages</p>
                    <ul className="space-y-1 text-sm list-disc list-inside ml-2">
                      <li>O(1) edge lookup</li>
                      <li>Easy to implement</li>
                      <li>Efficient for dense graphs</li>
                      <li>Simple to visualize</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded p-3">
                    <p className="font-medium text-orange-500 mb-2">Disadvantages</p>
                    <ul className="space-y-1 text-sm list-disc list-inside ml-2">
                      <li>O(n²) space usage</li>
                      <li>Inefficient for sparse graphs</li>
                      <li>O(n) to get all neighbors</li>
                      <li>Memory intensive at scale</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/30">
                <h3 className="text-foreground font-semibold mb-3">Complexity Analysis</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-background/50 rounded p-3">
                    <p className="font-medium mb-2">Time Complexity</p>
                    <ul className="space-y-1 text-sm">
                      <li>Check friendship: <span className="font-mono text-accent">O(1)</span></li>
                      <li>Get all neighbors: <span className="font-mono text-accent">O(n)</span></li>
                      <li>Add edge: <span className="font-mono text-accent">O(1)</span></li>
                      <li>Remove edge: <span className="font-mono text-accent">O(1)</span></li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded p-3">
                    <p className="font-medium mb-2">Space Complexity</p>
                    <ul className="space-y-1 text-sm">
                      <li>Storage: <span className="font-mono text-accent">O(n²)</span></li>
                      <li>n = number of users</li>
                      <li>Fixed size regardless of edge count</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Overall System Complexity */}
          <section className="glass-card rounded-lg p-6 animate-fade-in border-2 border-primary/20">
            <h2 className="text-2xl font-semibold mb-4">Overall System Complexity</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-primary">Friend Recommendation Pipeline</h3>
                <div className="bg-background/50 rounded-lg p-4">
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>BFS traversal to find friends and friends-of-friends: <span className="font-mono text-accent">O(V + E)</span></li>
                    <li>Count mutual friends for each recommendation: <span className="font-mono text-accent">O(k²)</span></li>
                    <li>Sort recommendations by mutual friend count: <span className="font-mono text-accent">O(r log r)</span></li>
                  </ol>
                  <p className="mt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Overall:</span> <span className="font-mono text-accent">O(V + E + k²)</span> 
                    where k is typically much smaller than V in social networks
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/30">
                <h3 className="text-lg font-semibold mb-3 text-primary">Scalability Considerations</h3>
                <div className="text-muted-foreground space-y-2">
                  <p>
                    The system is optimized for typical social network characteristics:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><span className="text-foreground font-medium">Sparse graphs:</span> E ≈ O(V) rather than O(V²)</li>
                    <li><span className="text-foreground font-medium">Limited friend count:</span> k (average degree) is much smaller than V</li>
                    <li><span className="text-foreground font-medium">Local exploration:</span> BFS stops at distance 2, not full traversal</li>
                    <li><span className="text-foreground font-medium">Efficient lookups:</span> Set-based friendship checks in O(1)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
