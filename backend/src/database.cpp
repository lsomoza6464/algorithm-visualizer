#include "database.h"
#include "utils.h"
#include <iostream>
#include <fstream>
#include <sstream>

namespace db {

Database::Database(const std::string& db_path) : db_(nullptr), db_path_(db_path) {}

Database::~Database() {
    if (db_) {
        sqlite3_close(db_);
    }
}

bool Database::initialize() {
    // Open database
    int rc = sqlite3_open(db_path_.c_str(), &db_);
    if (rc != SQLITE_OK) {
        std::cerr << "Cannot open database: " << sqlite3_errmsg(db_) << std::endl;
        return false;
    }

    // Read and execute schema
    std::ifstream schema_file("schema.sql");
    if (!schema_file.is_open()) {
        std::cerr << "Cannot open schema.sql" << std::endl;
        return false;
    }

    std::stringstream buffer;
    buffer << schema_file.rdbuf();
    std::string schema = buffer.str();

    return executeSQL(schema);
}

bool Database::executeSQL(const std::string& sql) {
    char* err_msg = nullptr;
    int rc = sqlite3_exec(db_, sql.c_str(), nullptr, nullptr, &err_msg);

    if (rc != SQLITE_OK) {
        std::cerr << "SQL error: " << err_msg << std::endl;
        sqlite3_free(err_msg);
        return false;
    }

    return true;
}

std::string Database::generateToken() {
    return utils::generateRandomToken(64);
}

std::optional<User> Database::createUser(const std::string& username, const std::string& email,
                                         const std::string& oauth_provider, const std::string& oauth_id,
                                         const std::string& display_name, const std::string& avatar_url) {
    const char* sql = R"(
        INSERT INTO users (username, email, oauth_provider, oauth_id, display_name, avatar_url)
        VALUES (?, ?, ?, ?, ?, ?)
    )";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return std::nullopt;
    }

    sqlite3_bind_text(stmt, 1, username.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, email.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, oauth_provider.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, oauth_id.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 5, display_name.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 6, avatar_url.c_str(), -1, SQLITE_TRANSIENT);

    if (sqlite3_step(stmt) != SQLITE_DONE) {
        sqlite3_finalize(stmt);
        return std::nullopt;
    }

    int user_id = sqlite3_last_insert_rowid(db_);
    sqlite3_finalize(stmt);

    return getUserById(user_id);
}

std::optional<User> Database::getUserByOAuth(const std::string& provider, const std::string& oauth_id) {
    const char* sql = "SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return std::nullopt;
    }

    sqlite3_bind_text(stmt, 1, provider.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, oauth_id.c_str(), -1, SQLITE_TRANSIENT);

    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        return std::nullopt;
    }

    User user;
    user.id = sqlite3_column_int(stmt, 0);
    user.username = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
    user.email = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
    user.oauth_provider = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
    user.oauth_id = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
    user.display_name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
    user.avatar_url = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 6));
    user.created_at = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 7));

    const char* last_login = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 8));
    user.last_login = last_login ? last_login : "";

    sqlite3_finalize(stmt);
    return user;
}

std::optional<User> Database::getUserById(int user_id) {
    const char* sql = "SELECT * FROM users WHERE id = ?";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return std::nullopt;
    }

    sqlite3_bind_int(stmt, 1, user_id);

    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        return std::nullopt;
    }

    User user;
    user.id = sqlite3_column_int(stmt, 0);
    user.username = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
    user.email = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
    user.oauth_provider = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
    user.oauth_id = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
    user.display_name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
    user.avatar_url = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 6));
    user.created_at = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 7));

    const char* last_login = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 8));
    user.last_login = last_login ? last_login : "";

    sqlite3_finalize(stmt);
    return user;
}

bool Database::updateLastLogin(int user_id) {
    const char* sql = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return false;
    }

    sqlite3_bind_int(stmt, 1, user_id);

    bool success = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return success;
}

std::optional<Session> Database::createSession(int user_id, const std::string& token, int expires_in_hours) {
    const char* sql = R"(
        INSERT INTO sessions (user_id, session_token, expires_at)
        VALUES (?, ?, datetime('now', '+' || ? || ' hours'))
    )";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return std::nullopt;
    }

    sqlite3_bind_int(stmt, 1, user_id);
    sqlite3_bind_text(stmt, 2, token.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 3, expires_in_hours);

    if (sqlite3_step(stmt) != SQLITE_DONE) {
        sqlite3_finalize(stmt);
        return std::nullopt;
    }

    sqlite3_finalize(stmt);
    return getSession(token);
}

std::optional<Session> Database::getSession(const std::string& token) {
    const char* sql = "SELECT * FROM sessions WHERE session_token = ? AND expires_at > datetime('now')";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return std::nullopt;
    }

    sqlite3_bind_text(stmt, 1, token.c_str(), -1, SQLITE_TRANSIENT);

    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        return std::nullopt;
    }

    Session session;
    session.id = sqlite3_column_int(stmt, 0);
    session.user_id = sqlite3_column_int(stmt, 1);
    session.session_token = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
    session.created_at = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
    session.expires_at = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));

    sqlite3_finalize(stmt);
    return session;
}

bool Database::deleteSession(const std::string& token) {
    const char* sql = "DELETE FROM sessions WHERE session_token = ?";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return false;
    }

    sqlite3_bind_text(stmt, 1, token.c_str(), -1, SQLITE_TRANSIENT);

    bool success = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return success;
}

bool Database::cleanExpiredSessions() {
    const char* sql = "DELETE FROM sessions WHERE expires_at < datetime('now')";
    return executeSQL(sql);
}

std::optional<Visualization> Database::createVisualization(int user_id, const std::string& title,
                                                           const std::string& description, const std::string& code,
                                                           const std::string& included_vars, const std::string& selected_vars,
                                                           const std::string& config) {
    const char* sql = R"(
        INSERT INTO visualizations (user_id, title, description, code, included_variables,
                                   selected_variables, visualization_config)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    )";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return std::nullopt;
    }

    sqlite3_bind_int(stmt, 1, user_id);
    sqlite3_bind_text(stmt, 2, title.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, description.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, code.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 5, included_vars.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 6, selected_vars.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 7, config.c_str(), -1, SQLITE_TRANSIENT);

    if (sqlite3_step(stmt) != SQLITE_DONE) {
        sqlite3_finalize(stmt);
        return std::nullopt;
    }

    int viz_id = sqlite3_last_insert_rowid(db_);
    sqlite3_finalize(stmt);

    return getVisualization(viz_id);
}

std::optional<Visualization> Database::getVisualization(int viz_id) {
    const char* sql = "SELECT * FROM visualizations WHERE id = ?";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return std::nullopt;
    }

    sqlite3_bind_int(stmt, 1, viz_id);

    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        return std::nullopt;
    }

    Visualization viz;
    viz.id = sqlite3_column_int(stmt, 0);
    viz.user_id = sqlite3_column_int(stmt, 1);
    viz.title = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
    viz.description = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
    viz.code = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
    viz.included_variables = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
    viz.selected_variables = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 6));
    viz.visualization_config = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 7));
    viz.created_at = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 8));
    viz.updated_at = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 9));
    viz.is_favorite = sqlite3_column_int(stmt, 10) != 0;

    sqlite3_finalize(stmt);
    return viz;
}

std::vector<Visualization> Database::getUserVisualizations(int user_id, int limit, int offset) {
    const char* sql = "SELECT * FROM visualizations WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?";

    std::vector<Visualization> visualizations;
    sqlite3_stmt* stmt;

    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return visualizations;
    }

    sqlite3_bind_int(stmt, 1, user_id);
    sqlite3_bind_int(stmt, 2, limit);
    sqlite3_bind_int(stmt, 3, offset);

    while (sqlite3_step(stmt) == SQLITE_ROW) {
        Visualization viz;
        viz.id = sqlite3_column_int(stmt, 0);
        viz.user_id = sqlite3_column_int(stmt, 1);
        viz.title = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2));
        viz.description = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
        viz.code = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
        viz.included_variables = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
        viz.selected_variables = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 6));
        viz.visualization_config = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 7));
        viz.created_at = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 8));
        viz.updated_at = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 9));
        viz.is_favorite = sqlite3_column_int(stmt, 10) != 0;

        visualizations.push_back(viz);
    }

    sqlite3_finalize(stmt);
    return visualizations;
}

bool Database::updateVisualization(int viz_id, const std::string& title, const std::string& description,
                                  const std::string& code, const std::string& included_vars,
                                  const std::string& selected_vars, const std::string& config) {
    const char* sql = R"(
        UPDATE visualizations
        SET title = ?, description = ?, code = ?, included_variables = ?,
            selected_variables = ?, visualization_config = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    )";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return false;
    }

    sqlite3_bind_text(stmt, 1, title.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, description.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, code.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, included_vars.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 5, selected_vars.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 6, config.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 7, viz_id);

    bool success = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return success;
}

bool Database::deleteVisualization(int viz_id) {
    const char* sql = "DELETE FROM visualizations WHERE id = ?";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return false;
    }

    sqlite3_bind_int(stmt, 1, viz_id);

    bool success = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return success;
}

bool Database::toggleFavorite(int viz_id) {
    const char* sql = "UPDATE visualizations SET is_favorite = NOT is_favorite WHERE id = ?";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return false;
    }

    sqlite3_bind_int(stmt, 1, viz_id);

    bool success = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return success;
}

bool Database::recordLeetCodeView(int user_id, int problem_id, const std::string& problem_slug,
                                 const std::string& problem_title) {
    const char* sql = R"(
        INSERT INTO leetcode_history (user_id, problem_id, problem_slug, problem_title, last_viewed, view_count)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
        ON CONFLICT(user_id, problem_id) DO UPDATE SET
            last_viewed = CURRENT_TIMESTAMP,
            view_count = view_count + 1
    )";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return false;
    }

    sqlite3_bind_int(stmt, 1, user_id);
    sqlite3_bind_int(stmt, 2, problem_id);
    sqlite3_bind_text(stmt, 3, problem_slug.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, problem_title.c_str(), -1, SQLITE_TRANSIENT);

    bool success = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return success;
}

std::vector<LeetCodeHistory> Database::getLeetCodeHistory(int user_id, int limit) {
    const char* sql = "SELECT * FROM leetcode_history WHERE user_id = ? ORDER BY last_viewed DESC LIMIT ?";

    std::vector<LeetCodeHistory> history;
    sqlite3_stmt* stmt;

    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return history;
    }

    sqlite3_bind_int(stmt, 1, user_id);
    sqlite3_bind_int(stmt, 2, limit);

    while (sqlite3_step(stmt) == SQLITE_ROW) {
        LeetCodeHistory entry;
        entry.id = sqlite3_column_int(stmt, 0);
        entry.user_id = sqlite3_column_int(stmt, 1);
        entry.problem_id = sqlite3_column_int(stmt, 2);
        entry.problem_slug = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3));
        entry.problem_title = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));
        entry.last_viewed = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 5));
        entry.view_count = sqlite3_column_int(stmt, 6);

        const char* notes = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 7));
        entry.notes = notes ? notes : "";

        history.push_back(entry);
    }

    sqlite3_finalize(stmt);
    return history;
}

bool Database::updateLeetCodeNotes(int user_id, int problem_id, const std::string& notes) {
    const char* sql = "UPDATE leetcode_history SET notes = ? WHERE user_id = ? AND problem_id = ?";

    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(db_, sql, -1, &stmt, nullptr) != SQLITE_OK) {
        return false;
    }

    sqlite3_bind_text(stmt, 1, notes.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 2, user_id);
    sqlite3_bind_int(stmt, 3, problem_id);

    bool success = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return success;
}

} // namespace db
