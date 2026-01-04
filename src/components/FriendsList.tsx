import { useGraph } from '@/context/GraphContext';
import { Users, UserX } from 'lucide-react';

export function FriendsList() {
  const { selectedUser, friends, selectUser } = useGraph();

  return (
    <div className="glass-card rounded-lg p-6 fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-node-friend/10">
          <Users className="w-5 h-5 text-node-friend" />
        </div>
        <h2 className="text-lg font-semibold">Direct Friends</h2>
        {selectedUser && (
          <span className="ml-auto text-sm text-muted-foreground">
            {friends.length} connection{friends.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      
      {!selectedUser ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Users className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">
            Select a user to view their friends
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            (Adjacent nodes in the graph)
          </p>
        </div>
      ) : friends.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <UserX className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">
            No friends yet
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Add friendships using the form below
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {friends.map((friend) => (
            <li
              key={friend.id}
              onClick={() => selectUser(friend.id)}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-node-friend/20 flex items-center justify-center group-hover:bg-node-friend/30 transition-colors">
                <span className="text-sm font-medium text-node-friend">
                  {friend.name[0]}
                </span>
              </div>
              <span className="font-medium flex-1">{friend.name}</span>
              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                Click to select
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
