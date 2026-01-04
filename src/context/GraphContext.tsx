import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { SocialGraph, User, FriendRecommendation, createSampleGraph } from '@/lib/graph';

interface GraphContextType {
  graph: SocialGraph;
  users: User[];
  selectedUserId: string | null;
  selectedUser: User | null;
  friends: User[];
  recommendations: FriendRecommendation[];
  edges: Array<{ from: string; to: string }>;
  selectUser: (userId: string | null) => void;
  addUser: (name: string) => User;
  addFriendship: (userId1: string, userId2: string) => boolean;
  refreshData: () => void;
}

const GraphContext = createContext<GraphContextType | null>(null);

export function GraphProvider({ children }: { children: React.ReactNode }) {
  const [graph] = useState(() => createSampleGraph());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refreshData = useCallback(() => {
    setVersion(v => v + 1);
  }, []);

  const users = useMemo(() => graph.getAllUsers(), [graph, version]);
  
  const edges = useMemo(() => graph.getEdges(), [graph, version]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return graph.getUser(selectedUserId) || null;
  }, [graph, selectedUserId, version]);

  const friends = useMemo(() => {
    if (!selectedUserId) return [];
    return graph.getFriends(selectedUserId);
  }, [graph, selectedUserId, version]);

  const recommendations = useMemo(() => {
    if (!selectedUserId) return [];
    return graph.getRecommendations(selectedUserId);
  }, [graph, selectedUserId, version]);

  const selectUser = useCallback((userId: string | null) => {
    setSelectedUserId(userId);
  }, []);

  const addUser = useCallback((name: string) => {
    const user = graph.addUser(name);
    refreshData();
    return user;
  }, [graph, refreshData]);

  const addFriendship = useCallback((userId1: string, userId2: string) => {
    const result = graph.addFriendship(userId1, userId2);
    if (result) refreshData();
    return result;
  }, [graph, refreshData]);

  const value: GraphContextType = {
    graph,
    users,
    selectedUserId,
    selectedUser,
    friends,
    recommendations,
    edges,
    selectUser,
    addUser,
    addFriendship,
    refreshData,
  };

  return (
    <GraphContext.Provider value={value}>
      {children}
    </GraphContext.Provider>
  );
}

export function useGraph() {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return context;
}
