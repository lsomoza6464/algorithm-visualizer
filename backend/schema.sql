-- Database schema for Debug Visualizer Backend
-- SQLite database

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    oauth_provider TEXT NOT NULL,  -- e.g., 'google', 'github'
    oauth_id TEXT NOT NULL,         -- Provider's user ID
    display_name TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    UNIQUE(oauth_provider, oauth_id)
);

-- Sessions table for managing user sessions
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Visualization history table
CREATE TABLE IF NOT EXISTS visualizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT,
    description TEXT,
    code TEXT NOT NULL,
    included_variables TEXT,
    selected_variables TEXT,
    visualization_config TEXT,  -- JSON config for visualization settings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_favorite BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- LeetCode problem history table
CREATE TABLE IF NOT EXISTS leetcode_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    problem_id INTEGER NOT NULL,
    problem_slug TEXT NOT NULL,
    problem_title TEXT,
    last_viewed DATETIME DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 1,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, problem_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_visualizations_user ON visualizations(user_id);
CREATE INDEX IF NOT EXISTS idx_visualizations_created ON visualizations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leetcode_user ON leetcode_history(user_id);
CREATE INDEX IF NOT EXISTS idx_leetcode_viewed ON leetcode_history(last_viewed DESC);
