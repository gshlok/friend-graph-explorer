# Social Network Graph Explorer

A interactive web application for visualizing and exploring social network graphs with friend recommendations using graph data structures and algorithms.

## 🌟 Features

### Graph Visualization

- **Interactive Network Graph**: Real-time visualization of users and their connections
- **Static Circular Layout**: Nodes arranged in a clean circular pattern for optimal visibility
- **Focused Mode**: Highlights selected user, their friends, and friend recommendations
- **Color-coded Nodes**: Visual distinction between selected users, friends, recommendations, and others
- **BFS Traversal Animation**: Animated breadth-first search visualization when selecting users

### Friend Recommendations

- **Smart Algorithm**: Uses BFS to find friends-of-friends (distance 2 nodes)
- **Ranked by Mutual Friends**: Recommendations sorted by number of shared connections
- **One-Click Add**: Add recommended friends directly from the recommendations card
- **Path Visualization**: View connection paths showing how you're connected to recommendations

### Data Management

- **Add Users**: Create new nodes in the graph
- **Create Friendships**: Establish undirected edges between users
- **Adjacency Matrix**: Full 2D matrix visualization of all connections
- **Real-time Updates**: All views update instantly when data changes

### Documentation

- **How It Works**: Comprehensive explanation of algorithms and data structures
- **Complexity Analysis**: Time and space complexity for all operations
- **Algorithm Details**: In-depth coverage of BFS, ranking, and graph operations

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **State Management**: React Context API

## 📊 Data Structures & Algorithms

### Graph Implementation

- **Adjacency List**: Internal representation using Set for O(1) friendship lookups
- **Undirected Graph**: Bidirectional edges representing mutual friendships

### Algorithms

- **BFS (Breadth-First Search)**: O(V + E) traversal for finding friends and recommendations
- **Mutual Friend Counting**: O(k²) where k is average friend count
- **Recommendation Ranking**: O(r log r) sorting by mutual friend count

### Complexity

- **Add User**: O(1) time, O(1) space
- **Add Friendship**: O(1) time, O(1) space
- **Check Friendship**: O(1) time
- **Get Recommendations**: O(V + E + k²) time
- **Overall Space**: O(V + E)

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd friend-graph-explorer

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
friend-graph-explorer/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── AppLayout.tsx # Sidebar navigation layout
│   │   ├── GraphVisualization.tsx
│   │   ├── FriendsList.tsx
│   │   ├── Recommendations.tsx
│   │   ├── AdjacencyListView.tsx
│   │   └── ...
│   ├── context/          # React Context providers
│   │   └── GraphContext.tsx
│   ├── lib/              # Core logic
│   │   ├── graph.ts      # Graph data structure
│   │   └── utils.ts
│   ├── pages/            # Route pages
│   │   ├── Home.tsx
│   │   ├── AddUser.tsx
│   │   ├── AdjacencyMatrix.tsx
│   │   └── HowItWorks.tsx
│   └── App.tsx
├── public/
└── package.json
```

## 🎯 Usage

### Home Page

1. Select a user from the dropdown
2. View their direct friends in the left sidebar
3. See friend recommendations ranked by mutual connections
4. Click the network graph nodes to explore different users
5. Use the "+" button on recommendations to add them as friends

### Add User/Friend Page

- Enter a name to create a new user node
- Select two users to create a friendship edge

### Adjacency Matrix Page

- View the complete graph as a 2D matrix
- Checkmarks indicate existing friendships
- X indicates diagonal (self-connections)

### How It Works Page

- Learn about graph structures and algorithms
- Understand BFS traversal implementation
- Review complexity analysis for all operations

## 🎨 Features Highlight

- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Modern dark UI with glassmorphism effects
- **Smooth Animations**: CSS animations for better UX
- **Fixed Sidebar**: Navigation stays accessible while scrolling
- **Color-Coded Legend**: Clear visual indicators for node types
- **Toast Notifications**: User feedback for actions

## 🔧 Configuration

### Customizing Constants

Edit graph physics in `src/components/GraphVisualization.tsx`:

```typescript
const NODE_RADIUS = 24;
const SELECTED_NODE_RADIUS = 32;
const REPULSION = 3000;
```

### Styling

Tailwind configuration in `tailwind.config.ts`:

- Custom colors for nodes (selected, friend, recommended)
- Animation utilities
- Custom CSS variables

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

Built with ❤️ using React, TypeScript, and Graph Data Structures
