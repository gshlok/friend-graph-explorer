import { useEffect, useState, useMemo, useCallback } from 'react';
import { useGraph } from '@/context/GraphContext';
import { User } from '@/lib/graph';

interface NodePosition {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NODE_RADIUS = 24;
const REPULSION = 3000;
const ATTRACTION = 0.03;
const DAMPING = 0.85;
const CENTER_PULL = 0.01;

export function GraphVisualization() {
  const { users, edges, selectedUserId, friends, recommendations, selectUser } = useGraph();
  const [positions, setPositions] = useState<Map<string, NodePosition>>(new Map());
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

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

        // Center pull and update positions
        nodes.forEach((node) => {
          node.vx += (centerX - node.x) * CENTER_PULL;
          node.vy += (centerY - node.y) * CENTER_PULL;

          node.vx *= DAMPING;
          node.vy *= DAMPING;

          node.x += node.vx;
          node.y += node.vy;

          // Keep within bounds
          const padding = NODE_RADIUS + 10;
          node.x = Math.max(padding, Math.min(dimensions.width - padding, node.x));
          node.y = Math.max(padding, Math.min(dimensions.height - padding, node.y));
        });

        return next;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [edges, dimensions, positions.size]);

  // Get node color based on its relationship to selected user
  const getNodeColor = useCallback((userId: string) => {
    if (userId === selectedUserId) return 'var(--node-selected)';
    if (friends.some(f => f.id === userId)) return 'var(--node-friend)';
    if (recommendations.some(r => r.user.id === userId)) return 'var(--node-recommended)';
    return 'var(--node)';
  }, [selectedUserId, friends, recommendations]);

  // Get edge color
  const getEdgeColor = useCallback((from: string, to: string) => {
    if (!selectedUserId) return 'hsl(var(--edge))';
    if (from === selectedUserId || to === selectedUserId) return 'hsl(var(--edge-highlight))';
    return 'hsl(var(--edge))';
  }, [selectedUserId]);

  const getEdgeOpacity = useCallback((from: string, to: string) => {
    if (!selectedUserId) return 0.6;
    if (from === selectedUserId || to === selectedUserId) return 1;
    return 0.3;
  }, [selectedUserId]);

  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(u => map.set(u.id, u));
    return map;
  }, [users]);

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
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--node))' }} />
          <span className="text-muted-foreground">User</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--node-selected))' }} />
          <span className="text-muted-foreground">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--node-friend))' }} />
          <span className="text-muted-foreground">Friend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--node-recommended))' }} />
          <span className="text-muted-foreground">Recommended</span>
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
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Edges */}
          {edges.map(({ from, to }) => {
            const posFrom = positions.get(from);
            const posTo = positions.get(to);
            if (!posFrom || !posTo) return null;
            
            return (
              <line
                key={`${from}-${to}`}
                x1={posFrom.x}
                y1={posFrom.y}
                x2={posTo.x}
                y2={posTo.y}
                stroke={getEdgeColor(from, to)}
                strokeWidth={from === selectedUserId || to === selectedUserId ? 2.5 : 1.5}
                opacity={getEdgeOpacity(from, to)}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Nodes */}
          {users.map((user) => {
            const pos = positions.get(user.id);
            if (!pos) return null;
            
            const isSelected = user.id === selectedUserId;
            const isHovered = user.id === hoveredNode;
            const nodeColor = getNodeColor(user.id);
            
            return (
              <g
                key={user.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => selectUser(user.id)}
                onMouseEnter={() => setHoveredNode(user.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                {/* Glow effect */}
                {(isSelected || isHovered) && (
                  <circle
                    r={NODE_RADIUS + 8}
                    fill={nodeColor}
                    opacity={0.2}
                    className="transition-all duration-300"
                  />
                )}
                
                {/* Node circle */}
                <circle
                  r={NODE_RADIUS}
                  fill={nodeColor}
                  stroke={isSelected ? 'hsl(var(--foreground))' : 'transparent'}
                  strokeWidth={2}
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
                  fontSize="12"
                  fontWeight="600"
                  className="pointer-events-none select-none"
                >
                  {user.name.slice(0, 2)}
                </text>
                
                {/* Full name on hover */}
                {isHovered && (
                  <text
                    textAnchor="middle"
                    y={NODE_RADIUS + 16}
                    fill="hsl(var(--foreground))"
                    fontSize="12"
                    fontWeight="500"
                    className="pointer-events-none"
                  >
                    {user.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      
      <p className="text-muted-foreground text-xs mt-3">
        Click on a node to select it. The graph uses force-directed layout for positioning.
      </p>
    </div>
  );
}
