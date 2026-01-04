import { useState } from 'react';
import { useGraph } from '@/context/GraphContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export function AddUserForm() {
  const { addUser } = useGraph();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    const user = addUser(name.trim());
    toast.success(`Added user: ${user.name}`);
    setName('');
  };

  return (
    <div className="glass-card rounded-lg p-6 fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <UserPlus className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Add User</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        Add a new node to the social network graph
      </p>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name..."
          className="flex-1 bg-secondary/50 border-border/50"
        />
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
          Add
        </Button>
      </form>
    </div>
  );
}
