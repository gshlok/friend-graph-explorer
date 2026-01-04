import { useGraph } from '@/context/GraphContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from 'lucide-react';

export function UserSelector() {
  const { users, selectedUserId, selectUser } = useGraph();

  return (
    <div className="glass-card rounded-lg p-6 fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <User className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Select User</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        Choose a user to view their friends and recommendations
      </p>
      <Select value={selectedUserId || ''} onValueChange={(v) => selectUser(v || null)}>
        <SelectTrigger className="w-full bg-secondary/50 border-border/50">
          <SelectValue placeholder="Select a user..." />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
