import { useGraph } from '@/context/GraphContext';
import { ChevronDown, ChevronRight, List } from 'lucide-react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function AdjacencyListView() {
  const { graph, users, selectedUserId } = useGraph();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="glass-card rounded-lg fade-in">
        <CollapsibleTrigger className="w-full p-6 flex items-center gap-3 hover:bg-secondary/20 transition-colors rounded-lg">
          <div className="p-2 rounded-lg bg-muted">
            <List className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <h2 className="text-lg font-semibold">Adjacency List</h2>
            <p className="text-sm text-muted-foreground">
              Internal graph representation
            </p>
          </div>
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-6 pb-6">
            <div className="bg-background/50 rounded-lg p-4 font-mono text-sm border border-border/30 max-h-64 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-muted-foreground italic">No users in graph</p>
              ) : (
                <ul className="space-y-2">
                  {users.map((user) => {
                    const friends = graph.getFriends(user.id);
                    const isSelected = user.id === selectedUserId;
                    
                    return (
                      <li 
                        key={user.id}
                        className={`transition-colors ${
                          isSelected 
                            ? 'text-node-selected font-semibold' 
                            : 'text-foreground'
                        }`}
                      >
                        <span className="text-primary">{user.name}</span>
                        <span className="text-muted-foreground"> → </span>
                        {friends.length === 0 ? (
                          <span className="text-muted-foreground italic">∅</span>
                        ) : (
                          <span className="text-node-friend">
                            [{friends.map(f => f.name).join(', ')}]
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Each line shows a node and its adjacent neighbors (edges).
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
