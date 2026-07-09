import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { SocialGraph, User, FriendRecommendation, createSampleGraph } from '@/lib/graph';
import {
  InstagramProfile,
  Archetype,
  buildPersonalizedGraph,
} from '@/lib/personalizedGraph';

export interface PersonalizedMeta {
  profile: InstagramProfile;
  archetype: Archetype;
  ratio: number;
  seedHex: string;
  visibleNodes: number;
  visibleEdges: number;
}

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
  removeFriendship: (userId1: string, userId2: string) => boolean;
  refreshData: () => void;
  /** Personalized "Discover" mode: metadata for the ingested profile (if any). */
  personalized: PersonalizedMeta | null;
  /** Swap the whole graph for one modeled from a real Instagram profile. */
  loadPersonalizedGraph: (profile: InstagramProfile) => void;
  /** Return to the built-in sample graph. */
  resetToSample: () => void;
}

const GraphContext = createContext<GraphContextType | null>(null);

// --- persistence: remember the last ingested profile across reloads --------
const STORAGE_KEY = 'friendgraph:profile';

function loadSavedProfile(): InstagramProfile | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && typeof p.handle === 'string') return p as InstagramProfile;
  } catch {
    /* ignore corrupt cache */
  }
  return null;
}

function saveProfile(p: InstagramProfile): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

function clearSavedProfile(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function metaFromBuild(
  profile: InstagramProfile,
  built: ReturnType<typeof buildPersonalizedGraph>
): PersonalizedMeta {
  return {
    profile,
    archetype: built.archetype,
    ratio: built.ratio,
    seedHex: built.seedHex,
    visibleNodes: built.visibleNodes,
    visibleEdges: built.visibleEdges,
  };
}

export function GraphProvider({ children }: { children: React.ReactNode }) {
  // Build the initial state ONCE, rehydrating from the cached profile if present.
  // (Building the graph once keeps node ids consistent with selectedUserId.)
  const initial = useMemo(() => {
    const saved = loadSavedProfile();
    if (saved) {
      const built = buildPersonalizedGraph(saved);
      return {
        graph: built.graph,
        selectedUserId: built.centerId as string | null,
        personalized: metaFromBuild(saved, built) as PersonalizedMeta | null,
      };
    }
    return {
      graph: createSampleGraph(),
      selectedUserId: null as string | null,
      personalized: null as PersonalizedMeta | null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [graph, setGraph] = useState<SocialGraph>(initial.graph);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initial.selectedUserId);
  const [version, setVersion] = useState(0);
  const [personalized, setPersonalized] = useState<PersonalizedMeta | null>(initial.personalized);

  const refreshData = useCallback(() => {
    setVersion(v => v + 1);
  }, []);

  const loadPersonalizedGraph = useCallback((profile: InstagramProfile) => {
    const built = buildPersonalizedGraph(profile);
    setGraph(built.graph);
    setPersonalized(metaFromBuild(profile, built));
    setSelectedUserId(built.centerId);
    setVersion(v => v + 1);
    saveProfile(profile); // cache so it survives reloads / tab switches
  }, []);

  const resetToSample = useCallback(() => {
    setGraph(createSampleGraph());
    setPersonalized(null);
    setSelectedUserId(null);
    setVersion(v => v + 1);
    clearSavedProfile();
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

  const removeFriendship = useCallback((userId1: string, userId2: string) => {
    const result = graph.removeFriendship(userId1, userId2);
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
    removeFriendship,
    refreshData,
    personalized,
    loadPersonalizedGraph,
    resetToSample,
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
