import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useGraph } from '@/context/GraphContext';
import { User } from '@/lib/graph';
import { Users, GitBranch, Network } from 'lucide-react';

interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NODE_RADIUS = 24;
const SELECTED_NODE_RADIUS = 32;
const REPULSION = 8000;
const ATTRACTION = 0.02;
const DAMPING = 0.85;
const CENTER_PULL = 0.01;

type ViewMode = 'full' | 'focused';
type AnimationPhase = 'idle' | 'selecting' | 'traversing-friends' | 'traversing-recommendations';

export function GraphVisualization() {
  const { users, edges, selectedUserId, friends, recommendations, selectUser } = useGraph();
  const [positions, setPositions] = useState<Map<string, NodePosition>>(new Map());
  const [dimensions, setDimensions] = useState({ width: 800, height: 700 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [viewMode] = useState<ViewMode>('focused');
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());
  const [edgeFlowOffsets, setEdgeFlowOffsets] = useState<Map<string, number>>(new Map());
  const animationTimeoutRef = useRef<NodeJS.Timeout>();
  const prevSelectedUserRef = useRef<string | null>(null);

  // Set of relevant node IDs based on selection
  const relevantNodeIds = useMemo(() => {
    if (!selectedUserId) return new Set<string>(users.map(u => u.id));
    const ids = new Set<string>([selectedUserId]);
    friends.forEach(f => ids.add(f.id));
    recommendations.forEach(r => ids.add(r.user.id));
    return ids;
  }, [selectedUserId, friends, recommendations, users]);

  // Edges that are relevant to selection
  const relevantEdges = useMemo(() => {
    if (!selectedUserId) return edges;
    return edges.filter(edge => {
      // Always show edges from selected user to friends
      if (edge.from === selectedUserId || edge.to === selectedUserId) return true;
      // Show edges from friends to recommended users
      const isFriendToRecommended = 
        (friends.some(f => f.id === edge.from) && recommendations.some(r => r.user.id === edge.to)) ||
        (friends.some(f => f.id === edge.to) && recommendations.some(r => r.user.id === edge.from));
      return isFriendToRecommended;
    });
  }, [selectedUserId, friends, recommendations, edges]);

  // Initialize positions for new nodes with spring-in animation
  useEffect(() => {
    setPositions((prev) => {
      const next = new Map(prev);
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      
      users.forEach((user) => {
        if (!next.has(user.id)) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 100 + Math.random() * 100;
          next.set(user.id, {
            id: user.id,
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            vx: 0,
            vy: 0,
          });
        }
      });
      
      // Remove positions for deleted users
      for (const id of next.keys()) {
        if (!users.find(u => u.id === id)) {
          next.delete(id);
        }
      }
      
      return next;
    });
  }, [users, dimensions]);

  // Animate edge flow offsets continuously
  useEffect(() => {
    const interval = setInterval(() => {
      setEdgeFlowOffsets(prev => {
        const next = new Map(prev);
        highlightedEdges.forEach(edgeKey => {
          const current = next.get(edgeKey) || 0;
          next.set(edgeKey, (current + 2) % 20);
        });
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [highlightedEdges]);

  // Orchestrated traversal animation when user is selected
  useEffect(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    if (!selectedUserId || prevSelectedUserRef.current === selectedUserId) {
      prevSelectedUserRef.current = selectedUserId;
      return;
    }

    prevSelectedUserRef.current = selectedUserId;

    // Phase 1: Selecting (pulse selected node)
    setAnimationPhase('selecting');
    setHighlightedNodes(new Set([selectedUserId]));
    setHighlightedEdges(new Set());

    // Phase 2: Traverse to direct friends (after 400ms)
    animationTimeoutRef.current = setTimeout(() => {
      setAnimationPhase('traversing-friends');
      
      const friendEdges = edges
        .filter(e => e.from === selectedUserId || e.to === selectedUserId)
        .map(e => `${e.from}-${e.to}`);
      
      setHighlightedEdges(new Set(friendEdges));
      
      // Highlight friends (after edge animation starts)
      setTimeout(() => {
        const friendIds = friends.map(f => f.id);
        setHighlightedNodes(new Set([selectedUserId, ...friendIds]));
      }, 300);

      // Phase 3: Traverse to recommendations (after 700ms from Phase 2 start)
      animationTimeoutRef.current = setTimeout(() => {
        if (recommendations.length > 0) {
          setAnimationPhase('traversing-recommendations');
          
          const recommendedEdges = edges
            .filter(e => {
              const isFriendToRec = 
                (friends.some(f => f.id === e.from) && recommendations.some(r => r.user.id === e.to)) ||
                (friends.some(f => f.id === e.to) && recommendations.some(r => r.user.id === e.from));
              return isFriendToRec;
            })
            .map(e => `${e.from}-${e.to}`);
          
          setHighlightedEdges(new Set([...friendEdges, ...recommendedEdges]));
          
          // Highlight recommendations
          setTimeout(() => {
            const recIds = recommendations.map(r => r.user.id);
            setHighlightedNodes(new Set([selectedUserId, ...friends.map(f => f.id), ...recIds]));
          }, 300);
        }

        // Phase 4: Return to idle (after 1000ms)
        animationTimeoutRef.current = setTimeout(() => {
          setAnimationPhase('idle');
          setHighlightedEdges(new Set());
        }, 1000);
      }, 700);
    }, 400);

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [selectedUserId, friends, recommendations, edges]);

  // Force-directed layout simulation with smooth spring animations
  useEffect(() => {
    if (positions.size === 0) return;

    const interval = setInterval(() => {
      setPositions((prev) => {
        const next = new Map<string, NodePosition>();
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;

        // Copy current positions
        prev.forEach((node, id) => {
          next.set(id, { ...node });
        });

        // Apply forces
        const nodes = Array.from(next.values());

        // Repulsion between all nodes
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const nodeA = nodes[i];
            const nodeB = nodes[j];
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
            const force = REPULSION / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            nodeA.vx -= fx;
            nodeA.vy -= fy;
            nodeB.vx += fx;
            nodeB.vy += fy;
          }
        }

        // Attraction along edges (spring effect)
        edges.forEach(({ from, to }) => {
          const nodeA = next.get(from);
          const nodeB = next.get(to);
          if (nodeA && nodeB) {
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const force = dist * ATTRACTION;

            nodeA.vx += (dx / dist) * force;
            nodeA.vy += (dy / dist) * force;
            nodeB.vx -= (dx / dist) * force;
            nodeB.vy -= (dy / dist) * force;
          }
        });

        // Pull selected user toward center with stronger force
        if (selectedUserId) {
          const selectedNode = next.get(selectedUserId);
          if (selectedNode) {
            selectedNode.vx += (centerX - selectedNode.x) * CENTER_PULL * 3;
            selectedNode.vy += (centerY - selectedNode.y) * CENTER_PULL * 3;
          }
        }

        // Center pull and update positions with smooth scale animation
        nodes.forEach((node) => {
          node.vx += (centerX - node.x) * CENTER_PULL;
          node.vy += (centerY - node.y) * CENTER_PULL;

          node.vx *= DAMPING;
          node.vy *= DAMPING;

          node.x += node.vx;
          node.y += node.vy;

          // Keep within bounds
          const padding = SELECTED_NODE_RADIUS + 20;
          node.x = Math.max(padding, Math.min(dimensions.width - padding, node.x));
          node.y = Math.max(padding, Math.min(dimensions.height - padding, node.y));
        });

        return next;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [edges, dimensions, positions.size, selectedUserId]);

  // Get node visibility/opacity with smooth transitions
  const getNodeOpacity = useCallback((userId: string) => {
    if (!selectedUserId || viewMode === 'full') return 1;
    if (animationPhase !== 'idle' && !highlightedNodes.has(userId)) return 0.08;
    return relevantNodeIds.has(userId) ? 1 : 0.15;
  }, [selectedUserId, viewMode, relevantNodeIds, animationPhase, highlightedNodes]);

  // Get node color based on its relationship to selected user
  const getNodeColor = useCallback((userId: string) => {
    if (userId === selectedUserId) return 'hsl(var(--node-selected))';
    if (friends.some(f => f.id === userId)) return 'hsl(var(--node-friend))';
    if (recommendations.some(r => r.user.id === userId)) return 'hsl(var(--node-recommended))';
    return 'hsl(var(--node))';
  }, [selectedUserId, friends, recommendations]);

  // Get node radius
  const getNodeRadius = useCallback((userId: string) => {
    return userId === selectedUserId ? SELECTED_NODE_RADIUS : NODE_RADIUS;
  }, [selectedUserId]);

  // Get edge visibility
  const getEdgeOpacity = useCallback((from: string, to: string) => {
    const edgeKey = `${from}-${to}`;
    const edgeKeyReverse = `${to}-${from}`;
    
    if (highlightedEdges.has(edgeKey) || highlightedEdges.has(edgeKeyReverse)) {
      return 1;
    }
    
    if (!selectedUserId) return 0.6;
    if (viewMode === 'focused') {
      const isRelevant = relevantEdges.some(e => 
        (e.from === from && e.to === to) || (e.from === to && e.to === from)
      );
      return isRelevant ? 0.8 : 0.05;
    }
    if (from === selectedUserId || to === selectedUserId) return 0.9;
    const isFriendToRec = 
      (friends.some(f => f.id === from) && recommendations.some(r => r.user.id === to)) ||
      (friends.some(f => f.id === to) && recommendations.some(r => r.user.id === from));
    if (isFriendToRec) return 0.6;
    return 0.15;
  }, [selectedUserId, viewMode, friends, recommendations, relevantEdges, highlightedEdges]);

  // Get edge stroke width
  const getEdgeStrokeWidth = useCallback((from: string, to: string) => {
    const edgeKey = `${from}-${to}`;
    const edgeKeyReverse = `${to}-${from}`;
    
    if (highlightedEdges.has(edgeKey) || highlightedEdges.has(edgeKeyReverse)) {
      return 3.5;
    }
    if (!selectedUserId) return 1.5;
    if (from === selectedUserId || to === selectedUserId) return 3;
    return 1.5;
  }, [selectedUserId, highlightedEdges]);

  // Get edge stroke dash
  const getEdgeDash = useCallback((from: string, to: string) => {
    // Dashed for friend-to-recommendation edges
    const isFriendToRec = 
      (friends.some(f => f.id === from) && recommendations.some(r => r.user.id === to)) ||
      (friends.some(f => f.id === to) && recommendations.some(r => r.user.id === from));
    return isFriendToRec ? '4,4' : 'none';
  }, [friends, recommendations]);

  // Get edge color
  const getEdgeColor = useCallback((from: string, to: string) => {
    const edgeKey = `${from}-${to}`;
    const edgeKeyReverse = `${to}-${from}`;
    
    if (highlightedEdges.has(edgeKey) || highlightedEdges.has(edgeKeyReverse)) {
      return 'hsl(var(--primary))';
    }
    if (!selectedUserId) return 'hsl(var(--edge))';
    if (from === selectedUserId || to === selectedUserId) return 'hsl(var(--edge-highlight))';
    const isFriendToRec = 
      (friends.some(f => f.id === from) && recommendations.some(r => r.user.id === to)) ||
      (friends.some(f => f.id === to) && recommendations.some(r => r.user.id === from));
    if (isFriendToRec) return 'hsl(var(--accent))';
    return 'hsl(var(--edge))';
  }, [selectedUserId, friends, recommendations, highlightedEdges]);

  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(u => map.set(u.id, u));
    return map;
  }, [users]);

  // Check if edge should have flow animation
  const isEdgeFlowing = useCallback((from: string, to: string) => {
    const edgeKey = `${from}-${to}`;
    const edgeKeyReverse = `${to}-${from}`;
    return highlightedEdges.has(edgeKey) || highlightedEdges.has(edgeKeyReverse);
  }, [highlightedEdges]);

  // Get edge flow offset
  const getEdgeFlowOffset = useCallback((from: string, to: string) => {
    const edgeKey = `${from}-${to}`;
    const edgeKeyReverse = `${to}-${from}`;
    return edgeFlowOffsets.get(edgeKey) || edgeFlowOffsets.get(edgeKeyReverse) || 0;
  }, [edgeFlowOffsets]);

  return (
    <div className="glass-card rounded-lg p-6 animate-slide-in-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 animate-scale-in">
          <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <circle cx="5" cy="6" r="2"/>
            <circle cx="19" cy="6" r="2"/>
            <circle cx="5" cy="18" r="2"/>
            <circle cx="19" cy="18" r="2"/>
            <line x1="9.5" y1="10" x2="6.5" y2="7.5"/>
            <line x1="14.5" y1="10" x2="17.5" y2="7.5"/>
            <line x1="9.5" y1="14" x2="6.5" y2="16.5"/>
            <line x1="14.5" y1="14" x2="17.5" y2="16.5"/>
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Network Graph</h2>
        
        {/* Stats */}
        <div className="ml-auto flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{users.length}</p>
              <p className="text-xs text-muted-foreground">Nodes in graph</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <GitBranch className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{edges.length}</p>
              <p className="text-xs text-muted-foreground">Edges in graph</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Network className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{users.length > 0 ? ((edges.length * 2) / users.length).toFixed(1) : '0'}</p>
              <p className="text-xs text-muted-foreground">Avg. degree</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2 animate-fade-in">
          <div className="w-4 h-4 rounded-full border-2 border-foreground transition-transform hover:scale-110" style={{ backgroundColor: 'hsl(var(--node-selected))' }} />
          <span className="text-muted-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <div className="w-3 h-3 rounded-full transition-transform hover:scale-110" style={{ backgroundColor: 'hsl(var(--node-friend))' }} />
          <span className="text-muted-foreground">Friend</span>
        </div>
        <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="w-3 h-3 rounded-full border-2 border-dashed transition-transform hover:scale-110" style={{ borderColor: 'hsl(var(--node-recommended))', backgroundColor: 'hsl(var(--node-recommended) / 0.3)' }} />
          <span className="text-muted-foreground">Recommended</span>
        </div>
        <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="w-3 h-3 rounded-full opacity-40 transition-transform hover:scale-110" style={{ backgroundColor: 'hsl(var(--node))' }} />
          <span className="text-muted-foreground">Other</span>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden bg-background/50 border border-border/30 shadow-inner">
        <svg
          width="100%"
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="cursor-pointer"
        >
          {/* Grid pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
            
            {/* Glow filter for selected/hovered nodes */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Strong glow for active edges */}
            <filter id="edge-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Shadow filter for depth */}
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Edges */}
          {edges.map(({ from, to }) => {
            const posFrom = positions.get(from);
            const posTo = positions.get(to);
            if (!posFrom || !posTo) return null;
            
            const isFlowing = isEdgeFlowing(from, to);
            const flowOffset = getEdgeFlowOffset(from, to);
            const edgeKey = `${from}-${to}`;
            
            return (
              <g key={edgeKey}>
                <line
                  x1={posFrom.x}
                  y1={posFrom.y}
                  x2={posTo.x}
                  y2={posTo.y}
                  stroke={getEdgeColor(from, to)}
                  strokeWidth={getEdgeStrokeWidth(from, to)}
                  strokeDasharray={getEdgeDash(from, to)}
                  strokeDashoffset={isFlowing ? flowOffset : 0}
                  opacity={getEdgeOpacity(from, to)}
                  filter={isFlowing ? 'url(#edge-glow)' : 'none'}
                  className="transition-all duration-500 ease-out"
                  style={{
                    strokeLinecap: 'round',
                  }}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {users.map((user) => {
            const pos = positions.get(user.id);
            if (!pos) return null;
            
            const isSelected = user.id === selectedUserId;
            const isFriend = friends.some(f => f.id === user.id);
            const isRecommended = recommendations.some(r => r.user.id === user.id);
            const isHovered = user.id === hoveredNode;
            const isHighlighted = highlightedNodes.has(user.id);
            const nodeColor = getNodeColor(user.id);
            const nodeRadius = getNodeRadius(user.id);
            const nodeOpacity = getNodeOpacity(user.id);
            
            return (
              <g
                key={user.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => selectUser(user.id)}
                onMouseEnter={() => setHoveredNode(user.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer transition-all duration-300"
                opacity={nodeOpacity}
                style={{ 
                  transformOrigin: 'center',
                }}
              >
                {/* Pulsing ring for selected node */}
                {isSelected && (
                  <>
                    <circle
                      r={nodeRadius + 14}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth={2}
                      opacity={0.4}
                      className="animate-pulse-ring"
                    />
                    <circle
                      r={nodeRadius + 8}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth={2}
                      opacity={0.6}
                      className="animate-pulse-ring-delayed"
                    />
                  </>
                )}
                
                {/* Animated highlight ring during traversal */}
                {isHighlighted && animationPhase !== 'idle' && (
                  <circle
                    r={nodeRadius + 6}
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth={2.5}
                    opacity={0.8}
                    className="animate-highlight-ring"
                  />
                )}
                
                {/* Dashed ring for recommended */}
                {isRecommended && !isSelected && (
                  <circle
                    r={nodeRadius + 4}
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth={2}
                    strokeDasharray="4,4"
                    opacity={0.7}
                    className="animate-rotate-dash"
                  />
                )}
                
                {/* Node circle */}
                <circle
                  r={nodeRadius}
                  fill={nodeColor}
                  stroke={isSelected ? 'hsl(var(--foreground))' : 'transparent'}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all duration-300"
                  style={{
                    filter: isHovered ? 'brightness(1.2)' : 'none',
                  }}
                />
                
                {/* Label */}
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fill="hsl(var(--primary-foreground))"
                  fontSize={isSelected ? 14 : 12}
                  fontWeight="600"
                  className="pointer-events-none select-none"
                >
                  {user.name.slice(0, 2)}
                </text>
                
                {/* Full name on hover with animated background */}
                {isHovered && (
                  <g className="animate-fade-in-scale">
                    <rect
                      x={-user.name.length * 4 - 8}
                      y={nodeRadius + 8}
                      width={user.name.length * 8 + 16}
                      height={20}
                      rx={4}
                      fill="hsl(var(--card))"
                      stroke="hsl(var(--border))"
                      strokeWidth={1}
                      filter="url(#shadow)"
                    />
                    <text
                      textAnchor="middle"
                      y={nodeRadius + 22}
                      fill="hsl(var(--foreground))"
                      fontSize="12"
                      fontWeight="500"
                      className="pointer-events-none"
                    >
                      {user.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      
      <p className="text-muted-foreground text-xs mt-3 animate-fade-in">
        Click any node to select it and view their connections.
      </p>
    </div>
  );
}
