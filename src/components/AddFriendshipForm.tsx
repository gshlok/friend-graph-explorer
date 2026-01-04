import { useState } from 'react';
import { useGraph } from '@/context/GraphContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'lucide-react';
import { toast } from 'sonner';

export function AddFriendshipForm() {
  const { users, addFriendship, graph } = useGraph();
  const [user1, setUser1] = useState('');
  const [user2, setUser2] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user1 || !user2) {
      toast.error('Please select both users');
      return;
    }
    if (user1 === user2) {
      toast.error('Cannot create friendship with self');
      return;
    }
    if (graph.areFriends(user1, user2)) {
      toast.error('These users are already friends');
      return;
    }
    const success = addFriendship(user1, user2);
    if (success) {
      const u1 = graph.getUser(user1);
      const u2 = graph.getUser(user2);
      toast.success(`Created friendship: ${u1?.name} ↔ ${u2?.name}`, {
        duration: 2000,
      });
      setUser1('');
      setUser2('');
    }
  };

  return (
    <div className="glass-card rounded-lg p-6 animate-slide-in-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 animate-scale-in">
          <Link className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Add Friendship</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-4 animate-fade-in">
        Create an undirected edge between two users
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Select value={user1} onValueChange={setUser1}>
            <SelectTrigger className="bg-secondary/50 border-border/50 transition-all duration-300 hover:bg-secondary/70 hover:scale-[1.02]">
              <SelectValue placeholder="User 1" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border animate-fade-in-scale">
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id} className="transition-colors hover:bg-primary/20">
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={user2} onValueChange={setUser2}>
            <SelectTrigger className="bg-secondary/50 border-border/50 transition-all duration-300 hover:bg-secondary/70 hover:scale-[1.02]">
              <SelectValue placeholder="User 2" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border animate-fade-in-scale">
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id} className="transition-colors hover:bg-primary/20">
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg">
          Create Edge
        </Button>
      </form>
    </div>
  );
}
