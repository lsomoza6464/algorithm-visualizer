#pragma once

#include <sqlite3.h>
#include <string>
#include <vector>
#include <memory>
#include <optional>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace db {

struct User {
    int id;
    std::string username;
    std::string email;
    std::string oauth_provider;
    std::string oauth_id;
    std::string display_name;
    std::string avatar_url;
    std::string created_at;
    std::string last_login;
};

struct Session {
    int id;
    int user_id;
    std::string session_token;
    std::string created_at;
    std::string expires_at;
};

struct Visualization {
    int id;
    int user_id;
    std::string title;
    std::string description;
    std::string code;
    std::string included_variables;
    std::string selected_variables;
    std::string visualization_config;
    std::string created_at;
    std::string updated_at;
    bool is_favorite;
};

struct LeetCodeHistory {
    int id;
    int user_id;
    int problem_id;
    std::string problem_slug;
    std::string problem_title;
    std::string last_viewed;
    int view_count;
    std::string notes;
};

class Database {
public:
    Database(const std::string& db_path);
    ~Database();

    bool initialize();

    // User operations
    std::optional<User> createUser(const std::string& username, const std::string& email,
                                   const std::string& oauth_provider, const std::string& oauth_id,
                                   const std::string& display_name, const std::string& avatar_url);
    std::optional<User> getUserByOAuth(const std::string& provider, const std::string& oauth_id);
    std::optional<User> getUserById(int user_id);
    bool updateLastLogin(int user_id);

    // Session operations
    std::optional<Session> createSession(int user_id, const std::string& token, int expires_in_hours = 24);
    std::optional<Session> getSession(const std::string& token);
    bool deleteSession(const std::string& token);
    bool cleanExpiredSessions();

    // Visualization operations
    std::optional<Visualization> createVisualization(int user_id, const std::string& title,
                                                     const std::string& description, const std::string& code,
                                                     const std::string& included_vars, const std::string& selected_vars,
                                                     const std::string& config);
    std::optional<Visualization> getVisualization(int viz_id);
    std::vector<Visualization> getUserVisualizations(int user_id, int limit = 50, int offset = 0);
    bool updateVisualization(int viz_id, const std::string& title, const std::string& description,
                           const std::string& code, const std::string& included_vars,
                           const std::string& selected_vars, const std::string& config);
    bool deleteVisualization(int viz_id);
    bool toggleFavorite(int viz_id);

    // LeetCode history operations
    bool recordLeetCodeView(int user_id, int problem_id, const std::string& problem_slug,
                           const std::string& problem_title);
    std::vector<LeetCodeHistory> getLeetCodeHistory(int user_id, int limit = 50);
    bool updateLeetCodeNotes(int user_id, int problem_id, const std::string& notes);

private:
    sqlite3* db_;
    std::string db_path_;

    bool executeSQL(const std::string& sql);
    std::string generateToken();
};

} // namespace db
