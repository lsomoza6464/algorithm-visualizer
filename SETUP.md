# Debug Visualizer Setup Guide

This guide will help you set up the Debug Visualizer with the new C++ backend for user authentication and history tracking.

## Prerequisites

### For Frontend (Node.js server)
- Node.js 14+ and npm
- Already installed in your project

### For Backend (C++ server)
- C++17 compatible compiler (GCC 7+, Clang 5+, or MSVC 2017+)
- CMake 3.15 or higher
- SQLite3
- libcurl
- OpenSSL (optional, for HTTPS)
- nlohmann-json library

## Installation Steps

### 1. Install Backend Dependencies (macOS)

```bash
# Install dependencies using Homebrew
brew install cmake sqlite3 curl openssl nlohmann-json
```

### 2. Install Node.js Dependencies

```bash
# Install the new http-proxy-middleware dependency
npm install
```

### 3. Build the C++ Backend

```bash
# Navigate to the backend directory
cd backend

# Create build directory
mkdir build
cd build

# Configure and build
cmake ..
make

# The executable will be created as 'backend_server'
```

### 4. Configure OAuth Providers

The backend uses OAuth2 for authentication. You need to set up OAuth apps with Google and/or GitHub.

#### Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3001/api/auth/callback/google`
7. Copy your Client ID and Client Secret

#### Setting up GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - Application name: Debug Visualizer
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3001/api/auth/callback/github`
4. Click "Register application"
5. Copy your Client ID and Client Secret

#### Configure the Backend

1. Copy the example config file:
```bash
cd backend
cp config.example.json config.json
```

2. Edit `config.json` with your OAuth credentials:
```json
{
  "oauth": {
    "google": {
      "client_id": "YOUR_GOOGLE_CLIENT_ID_HERE",
      "client_secret": "YOUR_GOOGLE_CLIENT_SECRET_HERE",
      "redirect_uri": "http://localhost:3001/api/auth/callback/google"
    },
    "github": {
      "client_id": "YOUR_GITHUB_CLIENT_ID_HERE",
      "client_secret": "YOUR_GITHUB_CLIENT_SECRET_HERE",
      "redirect_uri": "http://localhost:3001/api/auth/callback/github"
    }
  }
}
```

## Running the Application

You need to run BOTH servers:

### Terminal 1: Start the C++ Backend

```bash
cd backend/build
./backend_server
```

The backend will start on port **3001**.

### Terminal 2: Start the Node.js Frontend

```bash
# From the root directory
npm start
```

The frontend will start on port **3000**.

### Accessing the Application

Open your browser and go to:
- **http://localhost:3000** - Main application
- **http://localhost:3000/auth.html** - Login page
- **http://localhost:3000/history.html** - View your history (requires login)

## Features

### Authentication
- OAuth2 login with Google or GitHub
- Session-based authentication with secure cookies
- Automatic session management (7-day expiry)

### Visualization History
- Save your code visualizations with titles and descriptions
- Mark visualizations as favorites
- Load previously saved visualizations
- Delete visualizations you no longer need

### LeetCode Problem Tracking
- Automatically track which LeetCode problems you've viewed
- View count for each problem
- Add notes to problems
- Quick access to recently viewed problems

## Architecture

```
┌─────────────────┐
│   Browser       │
│  (port 3000)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Node.js Server │
│  (Express.js)   │
│    port 3000    │
└────────┬────────┘
         │ Proxies /api/auth, /api/visualizations, /api/leetcode
         ▼
┌─────────────────┐
│  C++ Backend    │
│    (Crow)       │
│    port 3001    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SQLite DB      │
│ visualizer.db   │
└─────────────────┘
```

## API Endpoints

### Authentication
- `GET /api/auth/login/:provider` - Initiate OAuth login
- `GET /api/auth/callback/:provider` - OAuth callback
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Visualizations
- `GET /api/visualizations` - List user's visualizations
- `POST /api/visualizations` - Create new visualization
- `GET /api/visualizations/:id` - Get specific visualization
- `DELETE /api/visualizations/:id` - Delete visualization
- `POST /api/visualizations/:id/favorite` - Toggle favorite

### LeetCode History
- `GET /api/leetcode/history` - Get problem history
- `POST /api/leetcode/view` - Record problem view
- `PUT /api/leetcode/:id/notes` - Update problem notes

## Troubleshooting

### Backend won't compile
- Ensure all C++ dependencies are installed
- Check that you have a C++17 compatible compiler
- Try `brew reinstall cmake` if CMake issues persist

### OAuth redirect errors
- Verify your redirect URIs match exactly in both the OAuth provider settings and `config.json`
- Make sure both servers are running
- Check that the backend is running on port 3001

### Database errors
- The database will be created automatically in `backend/build/visualizer.db`
- If you encounter issues, delete `visualizer.db` and restart the backend
- Check write permissions in the build directory

### CORS errors
- Make sure the frontend is running on port 3000
- The backend is configured to accept requests from `http://localhost:3000`
- Don't access the app via `127.0.0.1` - use `localhost`

## Development Notes

### Database Location
The SQLite database is created at `backend/build/visualizer.db`

### Session Management
Sessions expire after 7 days. Expired sessions are automatically cleaned up when the server starts.

### Testing OAuth Without Setup
You can use the "Continue as Guest" option to use the visualizer without authentication. However, you won't be able to save visualizations or track history.

## Next Steps

1. Customize the UI to match your preferences
2. Add more OAuth providers (Twitter, Microsoft, etc.)
3. Implement export functionality for visualizations
4. Add collaborative features

## License

ISC
