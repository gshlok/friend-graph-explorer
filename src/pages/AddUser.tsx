import { AddUserForm } from '@/components/AddUserForm';
import { AddFriendshipForm } from '@/components/AddFriendshipForm';
import { UserPlus, Users } from 'lucide-react';

const AddUser = () => {
  return (
    <div className="min-h-screen bg-background">
        <div className="container py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Add Users & Friendships</h1>
            <p className="text-muted-foreground">
              Create new users and establish connections in the social network graph
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl">
            {/* Add User Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <UserPlus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Add New User</h2>
                  <p className="text-sm text-muted-foreground">
                    Create a new node in the graph
                  </p>
                </div>
              </div>
              <AddUserForm />
              
              {/* Info Card */}
              <div className="glass-card rounded-lg p-4 text-sm">
                <h3 className="font-medium mb-2">What happens?</h3>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>A new node is added to the graph</li>
                  <li>User appears in the network visualization</li>
                  <li>Initially has no connections (degree = 0)</li>
                  <li>Can be selected to view details</li>
                </ul>
              </div>
            </div>

            {/* Add Friendship Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Add Friendship</h2>
                  <p className="text-sm text-muted-foreground">
                    Create an edge between two nodes
                  </p>
                </div>
              </div>
              <AddFriendshipForm />
              
              {/* Info Card */}
              <div className="glass-card rounded-lg p-4 text-sm">
                <h3 className="font-medium mb-2">What happens?</h3>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>An undirected edge is created</li>
                  <li>Both users' degree increases by 1</li>
                  <li>Edge appears in the visualization</li>
                  <li>May create new recommendation paths</li>
                  <li>Updates adjacency matrix</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Graph Operations Info */}
          <section className="mt-12 max-w-5xl">
            <div className="glass-card rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Graph Operations Complexity</h2>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h3 className="font-medium text-primary mb-2">Add Vertex (User)</h3>
                  <p className="text-muted-foreground mb-2">
                    Adds a new node to the graph structure
                  </p>
                  <div className="space-y-1">
                    <p><span className="font-medium">Time:</span> <span className="font-mono text-accent">O(1)</span></p>
                    <p><span className="font-medium">Space:</span> <span className="font-mono text-accent">O(1)</span></p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-primary mb-2">Add Edge (Friendship)</h3>
                  <p className="text-muted-foreground mb-2">
                    Creates a connection between two existing nodes
                  </p>
                  <div className="space-y-1">
                    <p><span className="font-medium">Time:</span> <span className="font-mono text-accent">O(1)</span></p>
                    <p><span className="font-medium">Space:</span> <span className="font-mono text-accent">O(1)</span></p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-primary mb-2">Check Friendship</h3>
                  <p className="text-muted-foreground mb-2">
                    Verify if an edge exists between two nodes
                  </p>
                  <div className="space-y-1">
                    <p><span className="font-medium">Time:</span> <span className="font-mono text-accent">O(1)</span></p>
                    <p><span className="font-medium">Note:</span> Set-based lookup</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
  );
};

export default AddUser;
