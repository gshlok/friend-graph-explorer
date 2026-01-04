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
          </div>
        </div>
      </div>
  );
};

export default AdjacencyMatrix;
