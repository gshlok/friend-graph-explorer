import { useGraph } from '@/context/GraphContext';
import { Users } from 'lucide-react';

export function FriendsList() {
  const { selectedUser, friends } = useGraph();

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
        <p className="text-muted-foreground text-sm">
          Select a user to view their friends (adjacent nodes)
        </p>
      ) : friends.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {selectedUser.name} has no friends yet
        </p>
      ) : (
        <ul className="space-y-2">
          {friends.map((friend) => (
            <li
              key={friend.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-node-friend/20 flex items-center justify-center">
                <span className="text-sm font-medium text-node-friend">
                  {friend.name[0]}
                </span>
              </div>
              <span className="font-medium">{friend.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
