# Debug Visualizer - C++ Backend Implementation

## Summary

This project adds a complete C++ backend to the Debug Visualizer application, providing user authentication and history tracking features. The backend runs alongside the existing Node.js frontend server.

## What Was Added

### Backend Components (C++)

1. **Database Layer** (`backend/src/database.cpp`)
   - SQLite-based storage
   - User management
   - Session handling
   - Visualization history
   - LeetCode problem tracking

2. **Authentication** (`backend/src/auth_handler.cpp`)
   - OAuth2 integration (Google & GitHub)
   - Session-based authentication
   - Secure cookie management
   - Token exchange and validation

3. **HTTP Server** (`backend/src/main.cpp`)
   - Crow framework for REST API
   - CORS enabled for frontend communication
   - RESTful endpoints for all features
   - Runs on port 3001

4. **Utilities** (`backend/src/utils.cpp`)
   - HTTP request helpers
   - URL encoding/decoding
   - JSON response formatting
   - Token generation

### Frontend Components (HTML/JavaScript)

1. **Authentication Page** (`auth.html`)
   - OAuth login buttons (Google, GitHub)
   - User profile display
   - Guest mode option
   - Session management

2. **History Page** (`history.html`)
   - Two-tab interface (Visualizations & LeetCode)
   - Save/load/delete visualizations
   - Favorite marking
   - LeetCode problem notes
   - View tracking

3. **Updated Index** (`index.html`)
   - Added Login and History links
   - Maintains existing functionality

4. **Updated Server** (`server.js`)
   - Proxy middleware for C++ backend
   - Routes authentication and data requests
   - Maintains existing LeetCode problem serving

### Database Schema (`backend/schema.sql`)

Four tables:
- **users** - OAuth user accounts
- **sessions** - Active user sessions (7-day expiry)
- **visualizations** - Saved code visualizations
- **leetcode_history** - Problem viewing history with notes

## Architecture

```
Frontend (Port 3000)          Backend (Port 3001)
─────────────────────        ─────────────────────
│                   │        │                   │
│  Node.js/Express  │◄──────►│   C++/Crow        │
│                   │  Proxy │                   │
│  - Serves HTML    │        │  - OAuth Auth     │
│  - Static files   │        │  - User Sessions  │
│  - LeetCode list  │        │  - Data Storage   │
│                   │        │                   │
└───────────────────┘        └─────────┬─────────┘
                                       │
                                       ▼
                                 ┌──────────┐
                                 │  SQLite  │
                                 └──────────┘
```

## API Endpoints

### Authentication
- `GET /api/auth/login/:provider` - OAuth login
- `GET /api/auth/callback/:provider` - OAuth callback
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Visualizations
- `GET /api/visualizations` - List user's saved visualizations
- `POST /api/visualizations` - Save new visualization
- `GET /api/visualizations/:id` - Get specific visualization
- `DELETE /api/visualizations/:id` - Delete visualization
- `POST /api/visualizations/:id/favorite` - Toggle favorite

### LeetCode History
- `GET /api/leetcode/history` - Get problem history
- `POST /api/leetcode/view` - Record problem view
- `PUT /api/leetcode/:id/notes` - Update problem notes

## Key Features

1. **OAuth2 Authentication**
   - Secure login with Google or GitHub
   - No password storage needed
   - Profile information from OAuth providers

2. **Visualization Management**
   - Save code with metadata
   - Organize with favorites
   - Quick load functionality
   - Search and filter capabilities

3. **LeetCode Tracking**
   - Automatic problem view recording
   - View count tracking
   - Personal notes per problem
   - Recently viewed list

4. **Session Security**
   - HTTP-only cookies
   - 7-day session expiration
   - Automatic cleanup of expired sessions
   - CSRF protection via same-origin

## File Structure

```
Debug Visualizer Website/
├── backend/
│   ├── include/
│   │   ├── database.h
│   │   ├── auth_handler.h
│   │   └── utils.h
│   ├── src/
│   │   ├── main.cpp
│   │   ├── database.cpp
│   │   ├── auth_handler.cpp
│   │   └── utils.cpp
│   ├── schema.sql
│   ├── CMakeLists.txt
│   ├── config.example.json
│   ├── README.md
│   └── .gitignore
├── auth.html (new)
├── history.html (new)
├── index.html (updated)
├── server.js (updated)
├── package.json (updated)
├── SETUP.md (new)
└── PROJECT_SUMMARY.md (this file)
```

## Dependencies Added

### Node.js
- `http-proxy-middleware@^3.0.3` - Proxy requests to C++ backend

### C++ (via CMake/Brew)
- `Crow` - HTTP framework (header-only, auto-downloaded)
- `SQLite3` - Database
- `libcurl` - HTTP requests for OAuth
- `OpenSSL` - HTTPS support
- `nlohmann/json` - JSON parsing

## Setup Requirements

1. Install C++ dependencies (macOS):
   ```bash
   brew install cmake sqlite3 curl openssl nlohmann-json
   ```

2. Configure OAuth providers:
   - Create OAuth apps on Google/GitHub
   - Copy `backend/config.example.json` to `backend/config.json`
   - Add client IDs and secrets

3. Build C++ backend:
   ```bash
   cd backend
   mkdir build && cd build
   cmake ..
   make
   ```

4. Install Node.js dependencies:
   ```bash
   npm install
   ```

5. Run both servers:
   ```bash
   # Terminal 1: C++ backend
   cd backend/build && ./backend_server

   # Terminal 2: Node.js frontend
   npm start
   ```

## Security Considerations

- OAuth tokens are never stored, only used during authentication
- Sessions use HTTP-only cookies to prevent XSS attacks
- All backend endpoints except auth require valid session
- CORS configured for localhost:3000 only
- Session tokens are 64-character random strings
- Passwords are never used or stored (OAuth only)

## Future Enhancements

Possible additions:
- Export visualizations to file
- Share visualizations with other users
- Collaborative features
- More OAuth providers (Twitter, Microsoft, etc.)
- Statistics and analytics dashboard
- Visualization templates
- Code snippet library

## Testing Notes

- Guest mode still works without authentication
- OAuth can be tested with real Google/GitHub accounts
- Database is automatically created on first run
- Sessions expire after 7 days of inactivity
- All endpoints return proper HTTP status codes

## Troubleshooting

See `SETUP.md` for detailed troubleshooting steps, including:
- Build issues
- OAuth configuration
- Database problems
- CORS errors
- Port conflicts

## License

ISC
