# Debug Visualizer

A web-based JavaScript algorithm visualizer with LeetCode problem support, user authentication, and history tracking.

## Features

- **Manual Code Entry**: Visualize any JavaScript code with support for arrays, linked lists, trees, and graphs
- **LeetCode Integration**: Automatically load and visualize LeetCode problems
- **User Authentication**: OAuth2 login with Google or GitHub
- **Save & History**: Save your visualizations and track LeetCode problems you've worked on
- **Monaco Editor**: Professional code editor with syntax highlighting
- **Real-time Visualization**: Step through your code execution with interactive D3.js visualizations

## Quick Start

### Prerequisites

- Node.js 14+ and npm
- For the backend (optional): C++17 compiler, CMake, SQLite3, libcurl, OpenSSL

### Running Without Backend (Guest Mode)

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open http://localhost:3000 in your browser
```

This will run the visualizer without authentication or history features.

### Running With Full Features (Backend Enabled)

See [SETUP.md](SETUP.md) for detailed setup instructions including:
- Installing C++ dependencies
- Configuring OAuth providers
- Building the backend
- Running both servers

Quick version:

```bash
# Terminal 1: Install and start backend
brew install cmake sqlite3 curl openssl nlohmann-json
./start-backend.sh

# Terminal 2: Start frontend
npm install
npm start

# Open http://localhost:3000 in your browser
```

## Project Structure

- **Frontend** (Node.js/Express on port 3000)
  - Serves HTML pages
  - Provides LeetCode problem list
  - Proxies authentication/data requests to backend

- **Backend** (C++/Crow on port 3001)
  - OAuth2 authentication
  - User session management
  - Visualization and history storage
  - SQLite database

## Usage

1. **Choose Mode**: Select between LeetCode problems or manual code entry
2. **Write/Load Code**: Enter your code or load a LeetCode problem
3. **Configure**: Specify which variables to visualize
4. **Run**: Submit and watch your algorithm execute step-by-step
5. **Save** (requires login): Save your work for later

## Documentation

- [SETUP.md](SETUP.md) - Complete setup and configuration guide
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Technical architecture and implementation details
- [backend/README.md](backend/README.md) - C++ backend specific documentation

## API Endpoints

### Frontend (Port 3000)
- `GET /api/leetcode-problems` - List of available LeetCode problems

### Backend (Port 3001)
- `GET /api/auth/*` - Authentication endpoints
- `GET /api/visualizations` - User's saved visualizations
- `GET /api/leetcode/history` - LeetCode problem history

## Features in Detail

### Supported Data Structures
- Arrays
- Linked Lists
- Binary Trees
- Graphs
- Primitive values

### Visualization Options
- Step-by-step execution
- Variable state tracking
- Interactive navigation
- Code highlighting

### LeetCode Integration
- 200+ problems available
- Automatic code loading
- Variable tracking
- View history

## Development

```bash
# Install dependencies
npm install

# Development mode (frontend only)
npm run dev

# Build production bundle
npm run build
```

## Troubleshooting

**Backend won't start**: Make sure all C++ dependencies are installed and OAuth is configured

**Can't login**: Verify OAuth credentials in `backend/config.json`

**Database errors**: Delete `backend/build/visualizer.db` and restart

See [SETUP.md](SETUP.md) for more troubleshooting tips.

## Contributing

This is a personal project, but suggestions are welcome via issues.

## License

ISC

## Credits

- Built with [D3.js](https://d3js.org/) for visualizations
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for code editing
- [Crow](https://crowcpp.org/) for C++ HTTP server
- [Tailwind CSS](https://tailwindcss.com/) for styling
