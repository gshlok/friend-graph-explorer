import { useGraph } from '@/context/GraphContext';
import { Users, GitBranch, Network } from 'lucide-react';

export function StatsBar() {
  const { users, edges } = useGraph();

  const stats = [
    {
      label: 'Total Users',
      value: users.length,
      icon: Users,
      description: 'Nodes in graph',
    },
    {
      label: 'Friendships',
      value: edges.length,
      icon: GitBranch,
      description: 'Edges in graph',
    },
    {
      label: 'Avg. Connections',
      value: users.length > 0 ? ((edges.length * 2) / users.length).toFixed(1) : '0',
      icon: Network,
      description: 'Avg. degree',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="glass-card rounded-lg p-4 fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <stat.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
