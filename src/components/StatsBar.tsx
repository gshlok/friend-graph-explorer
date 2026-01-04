import { useGraph } from '@/context/GraphContext';
import { Users, GitBranch, Network } from 'lucide-react';

export function StatsBar() {
  const { users, edges } = useGraph();

  const stats = [
    {
      label: 'Nodes in graph',
      value: users.length,
      icon: Users,
    },
    {
      label: 'Edges in graph',
      value: edges.length,
      icon: GitBranch,
    },
    {
      label: 'Avg. degree',
      value: users.length > 0 ? ((edges.length * 2) / users.length).toFixed(1) : '0',
      icon: Network,
    },
  ];

  return (
    <div className="glass-card rounded-lg p-6 animate-fade-in">
      <div className="flex items-center justify-around gap-6">
        {stats.map((stat, index) => (
          <div key={stat.label} className="flex items-center gap-3" style={{ animationDelay: `${index * 50}ms` }}>
            <div className="p-3 rounded-lg bg-primary/10">
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
