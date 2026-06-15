// Graph Data Structure - Adjacency List Implementation
// This represents the social network where users are nodes and friendships are undirected edges

export interface User {
  id: string;
  name: string;
}

export interface FriendRecommendation {
  user: User;
  mutualFriends: User[];
  mutualCount: number;
}

export interface GraphPosition {
  x: number;
  y: number;
}

// Adjacency List Graph Class
export class SocialGraph {
  private adjacencyList: Map<string, Set<string>>;
  private users: Map<string, User>;

  constructor() {
    this.adjacencyList = new Map();
    this.users = new Map();
  }

  // Add a new user (node) to the graph
  addUser(name: string): User {
    const id = crypto.randomUUID();
    const user: User = { id, name };
    this.users.set(id, user);
    this.adjacencyList.set(id, new Set());
    return user;
  }

  // Add friendship between two users (undirected edge)
  addFriendship(userId1: string, userId2: string): boolean {
    if (!this.adjacencyList.has(userId1) || !this.adjacencyList.has(userId2)) {
      return false;
    }
    if (userId1 === userId2) {
      return false;
    }
    // Add edge in both directions (undirected graph)
    this.adjacencyList.get(userId1)!.add(userId2);
    this.adjacencyList.get(userId2)!.add(userId1);
    return true;
  }

  // Remove friendship between two users (undirected edge)
  removeFriendship(userId1: string, userId2: string): boolean {
    if (!this.adjacencyList.has(userId1) || !this.adjacencyList.has(userId2)) {
      return false;
    }
    const set1 = this.adjacencyList.get(userId1);
    const set2 = this.adjacencyList.get(userId2);
    if (set1 && set2) {
      const deleted1 = set1.delete(userId2);
      const deleted2 = set2.delete(userId1);
      return deleted1 || deleted2;
    }
    return false;
  }

  // Get all users
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Get user by ID
  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  // Get direct friends of a user
  getFriends(userId: string): User[] {
    const friendIds = this.adjacencyList.get(userId);
    if (!friendIds) return [];
    return Array.from(friendIds)
      .map(id => this.users.get(id))
      .filter((user): user is User => user !== undefined);
  }

  // Check if two users are friends
  areFriends(userId1: string, userId2: string): boolean {
    const friends = this.adjacencyList.get(userId1);
    return friends ? friends.has(userId2) : false;
  }

  // Get friend recommendations based on mutual friends (friends of friends)
  getRecommendations(userId: string): FriendRecommendation[] {
    const directFriends = this.adjacencyList.get(userId);
    if (!directFriends) return [];

    // Map to count mutual friends for each potential recommendation
    const mutualFriendsMap = new Map<string, User[]>();

    // Traverse friends of friends (BFS-like traversal)
    for (const friendId of directFriends) {
      const friendsOfFriend = this.adjacencyList.get(friendId);
      if (!friendsOfFriend) continue;

      for (const potentialFriendId of friendsOfFriend) {
        // Skip if it's the user themselves or already a direct friend
        if (potentialFriendId === userId || directFriends.has(potentialFriendId)) {
          continue;
        }

        const mutualFriend = this.users.get(friendId);
        if (!mutualFriend) continue;

        if (!mutualFriendsMap.has(potentialFriendId)) {
          mutualFriendsMap.set(potentialFriendId, []);
        }
        mutualFriendsMap.get(potentialFriendId)!.push(mutualFriend);
      }
    }

    // Convert to recommendations array and sort by mutual friend count
    const recommendations: FriendRecommendation[] = [];
    for (const [potentialFriendId, mutualFriends] of mutualFriendsMap) {
      const user = this.users.get(potentialFriendId);
      if (user) {
        recommendations.push({
          user,
          mutualFriends,
          mutualCount: mutualFriends.length,
        });
      }
    }

    // Sort by number of mutual friends (descending)
    return recommendations.sort((a, b) => b.mutualCount - a.mutualCount);
  }

  // Get all edges for visualization
  getEdges(): Array<{ from: string; to: string }> {
    const edges: Array<{ from: string; to: string }> = [];
    const visited = new Set<string>();

    for (const [userId, friends] of this.adjacencyList) {
      for (const friendId of friends) {
        const edgeKey = [userId, friendId].sort().join('-');
        if (!visited.has(edgeKey)) {
          visited.add(edgeKey);
          edges.push({ from: userId, to: friendId });
        }
      }
    }

    return edges;
  }

  // Get adjacency list size (for debugging)
  getSize(): { users: number; edges: number } {
    return {
      users: this.users.size,
      edges: this.getEdges().length,
    };
  }

  // Serialize graph state
  serialize(): { users: User[]; edges: Array<{ from: string; to: string }> } {
    return {
      users: this.getAllUsers(),
      edges: this.getEdges(),
    };
  }
}

// Create initial sample data for demonstration
export function createSampleGraph(): SocialGraph {
  const graph = new SocialGraph();
  
  // Add sample users
  const alice = graph.addUser("Alice");
  const bob = graph.addUser("Bob");
  const charlie = graph.addUser("Charlie");
  const diana = graph.addUser("Diana");
  const eve = graph.addUser("Eve");
  const frank = graph.addUser("Frank");
  const grace = graph.addUser("Grace");
  
  // Create friendships forming an interesting network
  graph.addFriendship(alice.id, bob.id);
  graph.addFriendship(alice.id, charlie.id);
  graph.addFriendship(bob.id, charlie.id);
  graph.addFriendship(bob.id, diana.id);
  graph.addFriendship(charlie.id, eve.id);
  graph.addFriendship(diana.id, eve.id);
  graph.addFriendship(diana.id, frank.id);
  graph.addFriendship(eve.id, grace.id);
  graph.addFriendship(frank.id, grace.id);
  
  return graph;
}
