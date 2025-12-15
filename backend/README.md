# Debug Visualizer Backend (C++)

This is the C++ backend server for the Debug Visualizer application. It provides user authentication via OAuth2 and manages visualization/LeetCode history.

## Features

- OAuth2 authentication (Google, GitHub)
- User session management
- Visualization history storage
- LeetCode problem tracking
- SQLite database

## Requirements

- C++17 compatible compiler (GCC 7+, Clang 5+, MSVC 2017+)
- CMake 3.15+
- SQLite3
- libcurl (for HTTP requests)
- OpenSSL (optional, for HTTPS)

### macOS Installation

```bash
# Install dependencies via Homebrew
brew install cmake sqlite3 curl openssl nlohmann-json

# Clone Crow framework (header-only, will be downloaded automatically by CMake)
```

### Linux Installation

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install cmake libsqlite3-dev libcurl4-openssl-dev libssl-dev nlohmann-json3-dev

# Fedora/RHEL
sudo dnf install cmake sqlite-devel libcurl-devel openssl-devel json-devel
```

## Building

```bash
cd backend
mkdir build
cd build
cmake ..
make
```

## Configuration

1. Copy the example config file:
```bash
cp config.example.json config.json
```

2. Edit `config.json` and add your OAuth credentials:
   - **Google OAuth**: Get credentials from [Google Cloud Console](https://console.cloud.google.com/)
   - **GitHub OAuth**: Get credentials from [GitHub Developer Settings](https://github.com/settings/developers)

3. Make sure to set the redirect URIs in your OAuth app settings to:
   - Google: `http://localhost:3001/api/auth/callback/google`
   - GitHub: `http://localhost:3001/api/auth/callback/github`

## Running

```bash
# From the build directory
./backend_server

# Or from the backend directory
cd build && ./backend_server
```

The server will run on port 3001 by default.

## API Endpoints

### Authentication

- `GET /api/auth/login/:provider` - Initiate OAuth login (provider: google|github)
- `GET /api/auth/callback/:provider` - OAuth callback handler
- `POST /api/auth/logout` - Logout (requires authentication)
- `GET /api/auth/me` - Get current user info (requires authentication)

### Visualizations

- `GET /api/visualizations` - List user's visualizations (requires authentication)
- `POST /api/visualizations` - Create new visualization (requires authentication)
- `GET /api/visualizations/:id` - Get specific visualization (requires authentication)
- `DELETE /api/visualizations/:id` - Delete visualization (requires authentication)
- `POST /api/visualizations/:id/favorite` - Toggle favorite status (requires authentication)

### LeetCode History

- `GET /api/leetcode/history` - Get LeetCode problem history (requires authentication)
- `POST /api/leetcode/view` - Record a LeetCode problem view (requires authentication)
- `PUT /api/leetcode/:id/notes` - Update notes for a problem (requires authentication)

## Database Schema

The database schema is automatically initialized from `schema.sql` on first run. It includes:

- `users` - User accounts
- `sessions` - Active user sessions
- `visualizations` - Saved code visualizations
- `leetcode_history` - LeetCode problem viewing history

## Development

The backend is structured as follows:

```
backend/
├── include/           # Header files
│   ├── database.h
│   ├── auth_handler.h
│   └── utils.h
├── src/              # Source files
│   ├── main.cpp
│   ├── database.cpp
│   ├── auth_handler.cpp
│   └── utils.cpp
├── schema.sql        # Database schema
├── CMakeLists.txt    # Build configuration
└── config.json       # OAuth configuration (not in git)
```

## Security Notes

- Sessions expire after 7 days by default
- Session tokens are stored in HTTP-only cookies
- OAuth tokens are not stored, only used during authentication
- All endpoints except auth require valid session
- CORS is configured for localhost:3000 (frontend)

## Troubleshooting

### Build errors

- Make sure all dependencies are installed
- Check CMake output for missing libraries
- Ensure C++17 support is available

### Database errors

- Check that `schema.sql` exists in the build directory
- Verify write permissions in the build directory
- Delete `visualizer.db` and restart to recreate

### OAuth errors

- Verify credentials in `config.json`
- Check redirect URIs match in OAuth provider settings
- Ensure callback URLs are accessible

## License

ISC
