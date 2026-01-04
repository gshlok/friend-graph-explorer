import { AddUserForm } from '@/components/AddUserForm';
import { AddFriendshipForm } from '@/components/AddFriendshipForm';
import { UserPlus, Users } from 'lucide-react';

const AddUser = () => {
  return (
    <div className="min-h-screen bg-background">
        <div className="container py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Add Users & Friendships</h1>
            <p className="text-muted-foreground">
              Create new users and establish connections in the social network graph
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl">
            {/* Add User Section */}
            <div className="space-y-4">
              <AddUserForm />
            </div>

            {/* Add Friendship Section */}
            <div className="space-y-4">
              <AddFriendshipForm />
            </div>
          </div>
        </div>
      </div>
  );
};

export default AddUser;
