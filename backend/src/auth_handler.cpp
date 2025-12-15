#include "auth_handler.h"
#include "utils.h"
#include <nlohmann/json.hpp>

using json = nlohmann::json;

namespace auth {

AuthHandler::AuthHandler(std::shared_ptr<db::Database> database) : db_(database) {}

void AuthHandler::configureGoogleOAuth(const std::string& client_id, const std::string& client_secret,
                                       const std::string& redirect_uri) {
    OAuthConfig config;
    config.client_id = client_id;
    config.client_secret = client_secret;
    config.redirect_uri = redirect_uri;
    config.auth_url = "https://accounts.google.com/o/oauth2/v2/auth";
    config.token_url = "https://oauth2.googleapis.com/token";
    config.user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo";

    oauth_configs_["google"] = config;
}

void AuthHandler::configureGitHubOAuth(const std::string& client_id, const std::string& client_secret,
                                       const std::string& redirect_uri) {
    OAuthConfig config;
    config.client_id = client_id;
    config.client_secret = client_secret;
    config.redirect_uri = redirect_uri;
    config.auth_url = "https://github.com/login/oauth/authorize";
    config.token_url = "https://github.com/login/oauth/access_token";
    config.user_info_url = "https://api.github.com/user";

    oauth_configs_["github"] = config;
}

crow::response AuthHandler::handleOAuthLogin(const std::string& provider) {
    auto it = oauth_configs_.find(provider);
    if (it == oauth_configs_.end()) {
        return utils::errorResponse("Unsupported OAuth provider", 400);
    }

    const auto& config = it->second;

    std::string auth_url = config.auth_url + "?client_id=" + utils::urlEncode(config.client_id) +
                          "&redirect_uri=" + utils::urlEncode(config.redirect_uri) +
                          "&response_type=code&scope=";

    if (provider == "google") {
        auth_url += utils::urlEncode("openid email profile");
    } else if (provider == "github") {
        auth_url += utils::urlEncode("read:user user:email");
    }

    // Redirect to OAuth provider
    crow::response res(302);
    res.set_header("Location", auth_url);
    res.set_header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.set_header("Access-Control-Allow-Credentials", "true");
    return res;
}

crow::response AuthHandler::handleOAuthCallback(const std::string& provider, const std::string& code) {
    auto it = oauth_configs_.find(provider);
    if (it == oauth_configs_.end()) {
        return utils::errorResponse("Unsupported OAuth provider", 400);
    }

    const auto& config = it->second;

    try {
        // Exchange code for access token
        std::string access_token = exchangeCodeForToken(config, code);

        // Get user info
        json user_info = getUserInfo(config, access_token);

        // Extract user data
        std::string oauth_id;
        std::string email;
        std::string display_name;
        std::string avatar_url;

        if (provider == "google") {
            oauth_id = user_info["id"].get<std::string>();
            email = user_info["email"].get<std::string>();
            display_name = user_info.contains("name") ? user_info["name"].get<std::string>() : "";
            avatar_url = user_info.contains("picture") ? user_info["picture"].get<std::string>() : "";
        } else if (provider == "github") {
            oauth_id = std::to_string(user_info["id"].get<int>());
            email = user_info.contains("email") && !user_info["email"].is_null()
                    ? user_info["email"].get<std::string>()
                    : user_info["login"].get<std::string>() + "@github.local";
            display_name = user_info.contains("name") && !user_info["name"].is_null()
                         ? user_info["name"].get<std::string>()
                         : user_info["login"].get<std::string>();
            avatar_url = user_info.contains("avatar_url") ? user_info["avatar_url"].get<std::string>() : "";
        }

        // Check if user exists
        auto existing_user = db_->getUserByOAuth(provider, oauth_id);

        db::User user;
        if (existing_user) {
            user = *existing_user;
            db_->updateLastLogin(user.id);
        } else {
            // Create new user
            std::string username = provider + "_" + oauth_id;
            auto new_user = db_->createUser(username, email, provider, oauth_id, display_name, avatar_url);

            if (!new_user) {
                return utils::errorResponse("Failed to create user", 500);
            }
            user = *new_user;
        }

        // Create session
        std::string session_token = generateSessionToken();
        auto session = db_->createSession(user.id, session_token, 24 * 7); // 1 week

        if (!session) {
            return utils::errorResponse("Failed to create session", 500);
        }

        // Redirect back to frontend with session cookie
        crow::response res(302);
        res.set_header("Location", "http://localhost:3000/auth.html");
        res.set_header("Set-Cookie", "session_token=" + session_token + "; Path=/; HttpOnly; Max-Age=" + std::to_string(7 * 24 * 60 * 60));
        res.set_header("Access-Control-Allow-Origin", "http://localhost:3000");
        res.set_header("Access-Control-Allow-Credentials", "true");
        return res;

    } catch (const std::exception& e) {
        return utils::errorResponse(std::string("OAuth error: ") + e.what(), 500);
    }
}

crow::response AuthHandler::handleLogout(const std::string& session_token) {
    if (session_token.empty()) {
        return utils::errorResponse("No session token provided", 400);
    }

    bool success = db_->deleteSession(session_token);

    if (!success) {
        return utils::errorResponse("Failed to logout", 500);
    }

    crow::response res = utils::successResponse("Logged out successfully");
    res.set_header("Set-Cookie", "session_token=; Path=/; HttpOnly; Max-Age=0");
    return res;
}

std::optional<db::User> AuthHandler::validateSession(const std::string& session_token) {
    if (session_token.empty()) {
        return std::nullopt;
    }

    auto session = db_->getSession(session_token);
    if (!session) {
        return std::nullopt;
    }

    return db_->getUserById(session->user_id);
}

std::string AuthHandler::exchangeCodeForToken(const OAuthConfig& config, const std::string& code) {
    std::map<std::string, std::string> headers;
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    headers["Accept"] = "application/json";

    std::string post_data = "client_id=" + utils::urlEncode(config.client_id) +
                           "&client_secret=" + utils::urlEncode(config.client_secret) +
                           "&code=" + utils::urlEncode(code) +
                           "&redirect_uri=" + utils::urlEncode(config.redirect_uri) +
                           "&grant_type=authorization_code";

    std::string response = utils::makeHttpRequest(config.token_url, "POST", post_data, headers);

    try {
        json j = json::parse(response);
        if (j.contains("access_token")) {
            return j["access_token"].get<std::string>();
        } else {
            throw std::runtime_error("No access token in response");
        }
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to parse token response: " + std::string(e.what()));
    }
}

json AuthHandler::getUserInfo(const OAuthConfig& config, const std::string& access_token) {
    std::map<std::string, std::string> headers;
    headers["Authorization"] = "Bearer " + access_token;
    headers["Accept"] = "application/json";

    std::string response = utils::makeHttpRequest(config.user_info_url, "GET", "", headers);

    try {
        return json::parse(response);
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to parse user info: " + std::string(e.what()));
    }
}

std::string AuthHandler::generateSessionToken() {
    return utils::generateRandomToken(64);
}

// Middleware implementation
void AuthMiddleware::before_handle(crow::request& req, crow::response& res, context& ctx) {
    // Extract session token from cookie or header
    std::string session_token;

    // Try to get from Authorization header
    auto auth_header = req.get_header_value("Authorization");
    if (!auth_header.empty() && auth_header.substr(0, 7) == "Bearer ") {
        session_token = auth_header.substr(7);
    }

    // Try to get from cookie
    if (session_token.empty()) {
        auto cookie_header = req.get_header_value("Cookie");
        if (!cookie_header.empty()) {
            // Simple cookie parsing
            size_t pos = cookie_header.find("session_token=");
            if (pos != std::string::npos) {
                size_t start = pos + 14; // length of "session_token="
                size_t end = cookie_header.find(';', start);
                session_token = cookie_header.substr(start, end - start);
            }
        }
    }

    // Validate session (this would need access to AuthHandler)
    // For now, we'll leave this as a placeholder
    // ctx.user = auth_handler->validateSession(session_token);
}

void AuthMiddleware::after_handle(crow::request& req, crow::response& res, context& ctx) {
    // Nothing to do after handling
}

} // namespace auth
