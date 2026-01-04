import { useEffect, useState, useMemo, useCallback } from 'react';
import { useGraph } from '@/context/GraphContext';
import { User } from '@/lib/graph';
import { Eye, EyeOff, Focus, Maximize2 } from 'lucide-react';

interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NODE_RADIUS = 24;
const SELECTED_NODE_RADIUS = 32;
const REPULSION = 3000;
const ATTRACTION = 0.03;
const DAMPING = 0.85;
const CENTER_PULL = 0.01;

type ViewMode = 'full' | 'focused';

export function GraphVisualization() {
  const { users, edges, selectedUserId, friends, recommendations, selectUser } = useGraph();
  const [positions, setPositions] = useState<Map<string, NodePosition>>(new Map());
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [animatingEdges, setAnimatingEdges] = useState<Set<string>>(new Set());

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

  // Initialize positions for new nodes
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

  // Animate edges when user is selected
  useEffect(() => {
    if (!selectedUserId) {
      setAnimatingEdges(new Set());
      return;
    }

    // Animate edges sequentially: first to friends, then to recommendations
    const friendEdges = edges
      .filter(e => e.from === selectedUserId || e.to === selectedUserId)
      .map(e => `${e.from}-${e.to}`);
    
    setAnimatingEdges(new Set(friendEdges));

    const timeout = setTimeout(() => {
      const recommendedEdges = edges
        .filter(e => {
          const isFriendToRec = 
            (friends.some(f => f.id === e.from) && recommendations.some(r => r.user.id === e.to)) ||
            (friends.some(f => f.id === e.to) && recommendations.some(r => r.user.id === e.from));
          return isFriendToRec;
        })
        .map(e => `${e.from}-${e.to}`);
      
      setAnimatingEdges(new Set([...friendEdges, ...recommendedEdges]));

      setTimeout(() => setAnimatingEdges(new Set()), 600);
    }, 300);

    return () => clearTimeout(timeout);
  }, [selectedUserId, friends, recommendations, edges]);

  // Force-directed layout simulation
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

        // Attraction along edges
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

        // Pull selected user toward center
        if (selectedUserId) {
          const selectedNode = next.get(selectedUserId);
          if (selectedNode) {
            selectedNode.vx += (centerX - selectedNode.x) * CENTER_PULL * 3;
            selectedNode.vy += (centerY - selectedNode.y) * CENTER_PULL * 3;
          }
        }

        // Center pull and update positions
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

  // Get node visibility/opacity
  const getNodeOpacity = useCallback((userId: string) => {
    if (!selectedUserId || viewMode === 'full') return 1;
    return relevantNodeIds.has(userId) ? 1 : 0.15;
  }, [selectedUserId, viewMode, relevantNodeIds]);

  // Get node color based on its relationship to selected user
  const getNodeColor = useCallback((userId: string) => {
    if (userId === selectedUserId) return 'hsl(var(--node-selected))';
    if (friends.some(f => f.id === userId)) return 'hsl(var(--node-friend))';
    if (recommendations.some(r => r.user.id === userId)) return 'hsl(var(--node-recommended))';
    return 'hsl(var(--node))';
  }, [selectedUserId, friends, recommendations]);

  // Get node radius
  const getNodeRadius = useCallback((userId: string) => {
    if (userId === selectedUserId) return SELECTED_NODE_RADIUS;
    return NODE_RADIUS;
  }, [selectedUserId]);

  // Get edge visibility
  const getEdgeOpacity = useCallback((from: string, to: string) => {
    if (!selectedUserId) return 0.6;
    if (viewMode === 'focused') {
      const isRelevant = relevantEdges.some(e => 
        (e.from === from && e.to === to) || (e.from === to && e.to === from)
      );
      return isRelevant ? 1 : 0.08;
    }
    if (from === selectedUserId || to === selectedUserId) return 1;
    // Friend to recommendation edge
    const isFriendToRec = 
      (friends.some(f => f.id === from) && recommendations.some(r => r.user.id === to)) ||
      (friends.some(f => f.id === to) && recommendations.some(r => r.user.id === from));
    if (isFriendToRec) return 0.7;
    return 0.2;
  }, [selectedUserId, viewMode, friends, recommendations, relevantEdges]);

  // Get edge stroke width
  const getEdgeStrokeWidth = useCallback((from: string, to: string) => {
    if (!selectedUserId) return 1.5;
    if (from === selectedUserId || to === selectedUserId) return 3;
    return 1.5;
  }, [selectedUserId]);

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
    if (!selectedUserId) return 'hsl(var(--edge))';
    if (from === selectedUserId || to === selectedUserId) return 'hsl(var(--edge-highlight))';
    const isFriendToRec = 
      (friends.some(f => f.id === from) && recommendations.some(r => r.user.id === to)) ||
      (friends.some(f => f.id === to) && recommendations.some(r => r.user.id === from));
    if (isFriendToRec) return 'hsl(var(--accent))';
    return 'hsl(var(--edge))';
  }, [selectedUserId, friends, recommendations]);

  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(u => map.set(u.id, u));
    return map;
  }, [users]);

  // Check if edge should be animated
  const isEdgeAnimating = useCallback((from: string, to: string) => {
    return animatingEdges.has(`${from}-${to}`) || animatingEdges.has(`${to}-${from}`);
  }, [animatingEdges]);

  return (
    <div className="glass-card rounded-lg p-6 fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
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
        
        {/* View Mode Toggle */}
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setViewMode('full')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'full' 
                ? 'bg-primary/20 text-primary' 
                : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
            }`}
            title="Full Network"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('focused')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'focused' 
                ? 'bg-primary/20 text-primary' 
                : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
            }`}
            title="Focused View"
          >
            <Focus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-foreground" style={{ backgroundColor: 'hsl(var(--node-selected))' }} />
          <span className="text-muted-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--node-friend))' }} />
          <span className="text-muted-foreground">Friend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-dashed" style={{ borderColor: 'hsl(var(--node-recommended))', backgroundColor: 'hsl(var(--node-recommended) / 0.3)' }} />
          <span className="text-muted-foreground">Recommended</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full opacity-40" style={{ backgroundColor: 'hsl(var(--node))' }} />
          <span className="text-muted-foreground">Other</span>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden bg-background/50 border border-border/30">
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
            
            {/* Glow filter for animated edges */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
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
            
            const isAnimating = isEdgeAnimating(from, to);
            
            return (
              <line
                key={`${from}-${to}`}
                x1={posFrom.x}
                y1={posFrom.y}
                x2={posTo.x}
                y2={posTo.y}
                stroke={getEdgeColor(from, to)}
                strokeWidth={getEdgeStrokeWidth(from, to)}
                strokeDasharray={getEdgeDash(from, to)}
                opacity={getEdgeOpacity(from, to)}
                filter={isAnimating ? 'url(#glow)' : 'none'}
                className="transition-all duration-300"
              />
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
                className="cursor-pointer"
                opacity={nodeOpacity}
              >
                {/* Pulsing ring for selected node */}
                {isSelected && (
                  <circle
                    r={nodeRadius + 10}
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth={2}
                    opacity={0.4}
                    className="node-pulse"
                  />
                )}
                
                {/* Glow effect */}
                {(isSelected || isHovered) && (
                  <circle
                    r={nodeRadius + 8}
                    fill={nodeColor}
                    opacity={0.25}
                    className="transition-all duration-300"
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
                
                {/* Full name on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={-user.name.length * 4 - 8}
                      y={nodeRadius + 8}
                      width={user.name.length * 8 + 16}
                      height={20}
                      rx={4}
                      fill="hsl(var(--card))"
                      stroke="hsl(var(--border))"
                      strokeWidth={1}
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
      
      <p className="text-muted-foreground text-xs mt-3">
        Click any node to select it. Use {viewMode === 'full' ? 'Focused' : 'Full Network'} mode for {viewMode === 'full' ? 'emphasis on selected connections' : 'complete graph visibility'}.
      </p>
    </div>
  );
}
