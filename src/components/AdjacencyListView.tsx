import { useGraph } from '@/context/GraphContext';
import { Grid3x3, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export function AdjacencyListView() {
  const { graph, users, selectedUserId, addFriendship, removeFriendship } = useGraph();

  const handleCellClick = (rowId: string, colId: string, isFriend: boolean) => {
    if (rowId === colId) return;
    const u1 = graph.getUser(rowId);
    const u2 = graph.getUser(colId);
    if (!u1 || !u2) return;

    if (isFriend) {
      const success = removeFriendship(rowId, colId);
      if (success) {
        toast.success(`Removed friendship: ${u1.name} ↔ ${u2.name}`, { duration: 2000 });
      } else {
        toast.error('Failed to remove friendship');
      }
    } else {
      const success = addFriendship(rowId, colId);
      if (success) {
        toast.success(`Created friendship: ${u1.name} ↔ ${u2.name}`, { duration: 2000 });
      } else {
        toast.error('Failed to create friendship');
      }
    }
  };

  return (
    <div className="glass-card rounded-lg animate-slide-in-up p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-muted animate-scale-in">
          <Grid3x3 className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Adjacency Matrix</h2>
          <p className="text-sm text-muted-foreground">
            2D matrix representation of graph
          </p>
        </div>
      </div>

      <div className="bg-background/50 rounded-lg p-4 border border-border/30 max-h-[500px] overflow-auto">
              {users.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-8">No users in graph</p>
              ) : (
                <div className="inline-block min-w-full">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="sticky left-0 top-0 z-20 bg-background/95 backdrop-blur-sm border border-border/50 p-2">
                          <div className="w-8 h-8"></div>
                        </th>
                        {users.map((user, index) => (
                          <th 
                            key={user.id} 
                            className={`sticky top-0 z-10 border border-border/50 p-2 min-w-[60px] animate-fade-in ${
                              user.id === selectedUserId 
                                ? 'bg-node-selected/20 backdrop-blur-sm' 
                                : 'bg-background/95 backdrop-blur-sm'
                            }`}
                            style={{ animationDelay: `${index * 20}ms` }}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-transform hover:scale-110 ${
                                user.id === selectedUserId 
                                  ? 'bg-node-selected/30 text-node-selected' 
                                  : 'bg-primary/20 text-primary'
                              }`}>
                                {user.name[0]}
                              </div>
                              <span className={`text-xs font-medium truncate max-w-[50px] ${
                                user.id === selectedUserId ? 'text-node-selected' : 'text-foreground'
                              }`}>
                                {user.name}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((userRow, rowIndex) => (
                        <tr key={userRow.id} className="animate-fade-in" style={{ animationDelay: `${rowIndex * 30}ms` }}>
                          <th className={`sticky left-0 z-10 border border-border/50 p-2 ${
                            userRow.id === selectedUserId 
                              ? 'bg-node-selected/20 backdrop-blur-sm' 
                              : 'bg-background/95 backdrop-blur-sm'
                          }`}>
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-transform hover:scale-110 ${
                                userRow.id === selectedUserId 
                                  ? 'bg-node-selected/30 text-node-selected' 
                                  : 'bg-primary/20 text-primary'
                              }`}>
                                {userRow.name[0]}
                              </div>
                              <span className={`text-xs font-medium whitespace-nowrap ${
                                userRow.id === selectedUserId ? 'text-node-selected' : 'text-foreground'
                              }`}>
                                {userRow.name}
                              </span>
                            </div>
                          </th>
                          {users.map((userCol) => {
                            const isFriend = graph.areFriends(userRow.id, userCol.id);
                            const isSelf = userRow.id === userCol.id;
                            const isRowSelected = userRow.id === selectedUserId;
                            const isColSelected = userCol.id === selectedUserId;
                            
                            return (
                              <td 
                                key={userCol.id}
                                onClick={() => !isSelf && handleCellClick(userRow.id, userCol.id, isFriend)}
                                title={isSelf ? undefined : isFriend ? `Click to remove connection with ${userCol.name}` : `Click to add connection with ${userCol.name}`}
                                className={`border border-border/50 p-2 text-center transition-all duration-300 ${
                                  isSelf 
                                    ? 'bg-muted/50' 
                                    : isFriend 
                                      ? 'bg-node-friend/20 hover:bg-node-friend/30 cursor-pointer' 
                                      : 'bg-background/50 hover:bg-secondary/30 cursor-pointer'
                                } ${
                                  (isRowSelected || isColSelected) && !isSelf 
                                    ? 'ring-1 ring-primary/30' 
                                    : ''
                                }`}
                              >
                                {isSelf ? (
                                  <div className="flex items-center justify-center">
                                    <X className="w-4 h-4 text-muted-foreground/50" />
                                  </div>
                                ) : isFriend ? (
                                  <div className="flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full bg-node-friend/40 flex items-center justify-center transition-transform hover:scale-110">
                                      <Check className="w-4 h-4 text-node-friend font-bold" />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/50 text-sm font-mono">0</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="mt-3 space-y-1">
              <p className="text-xs text-muted-foreground animate-fade-in">
                Rows and columns represent users. A <Check className="w-3 h-3 inline text-node-friend" /> indicates a friendship edge.
              </p>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-node-friend/20 border border-node-friend/30"></div>
                  <span className="text-muted-foreground">Connected (1)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-background/50 border border-border/50"></div>
                  <span className="text-muted-foreground">Not Connected (0)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-muted/50 border border-border/50"></div>
                  <span className="text-muted-foreground">Self (N/A)</span>
                </div>
              </div>
            </div>
    </div>
  );
}
