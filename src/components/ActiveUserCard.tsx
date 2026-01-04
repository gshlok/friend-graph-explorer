import { useGraph } from '@/context/GraphContext';
import { UserCircle2, Link } from 'lucide-react';

export function ActiveUserCard() {
  const { selectedUser, friends } = useGraph();

  if (!selectedUser) {
    return (
      <div className="glass-card rounded-lg p-6 fade-in border-dashed border-2 border-border/30">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="p-2 rounded-lg bg-muted/30">
            <UserCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium">No user selected</p>
            <p className="text-xs">Select a user to begin exploring</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg p-6 fade-in border-2 border-node-selected/40 bg-node-selected/5">
      <div className="flex items-center gap-4">
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg node-pulse"
          style={{ backgroundColor: 'hsl(var(--node-selected))' }}
        >
          <span className="text-primary-foreground">{selectedUser.name[0]}</span>
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Active User
          </p>
          <h3 className="text-xl font-bold text-foreground">{selectedUser.name}</h3>
          <div className="flex items-center gap-1 text-sm text-node-friend mt-1">
            <Link className="w-3.5 h-3.5" />
            <span>
              {friends.length} direct connection{friends.length !== 1 ? 's' : ''} (degree)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
