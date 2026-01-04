import { UserSelector } from '@/components/UserSelector';
import { FriendsList } from '@/components/FriendsList';
import { Recommendations } from '@/components/Recommendations';
import { GraphVisualization } from '@/components/GraphVisualization';

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
        <div className="container py-6">
          <div className="grid lg:grid-cols-[350px_1fr] gap-6">
            {/* Left Sidebar - User Details */}
            <div className="space-y-4">
              {/* Select User */}
              <UserSelector />
              
              {/* Direct Friends */}
              <FriendsList />
              
              {/* Recommendations */}
              <Recommendations />
            </div>

            {/* Main Content - Graph Visualization */}
            <div>
              <GraphVisualization />
            </div>
          </div>
        </div>
      </div>
  );
};

export default Home;
