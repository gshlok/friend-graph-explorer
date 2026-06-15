import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Network, Home, UserPlus, Grid3x3, BookOpen, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Add User/Friend', href: '/add-user', icon: UserPlus },
  { name: 'Adjacency Matrix', href: '/adjacency-matrix', icon: Grid3x3 },
  { name: 'Benchmark', href: '/benchmark', icon: Gauge },
  { name: 'How It Works', href: '/how-it-works', icon: BookOpen },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/50 bg-card/30 backdrop-blur-sm flex flex-col fixed left-0 top-0 bottom-0 z-20">
        {/* Logo/Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Network className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Social Network</h1>
              <p className="text-xs text-muted-foreground">Graph Explorer</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      'hover:bg-primary/10',
                      isActive
                        ? 'bg-primary/20 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Friend Recommendation System
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto ml-64">
        {children}
      </main>
    </div>
  );
}
