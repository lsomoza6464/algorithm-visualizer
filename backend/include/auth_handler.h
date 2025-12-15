#pragma once

#include "database.h"
#include "crow.h"
#include <string>
#include <memory>

namespace auth {

struct OAuthConfig {
    std::string client_id;
    std::string client_secret;
    std::string redirect_uri;
    std::string auth_url;
    std::string token_url;
    std::string user_info_url;
};

class AuthHandler {
public:
    AuthHandler(std::shared_ptr<db::Database> database);

    // OAuth flow handlers
    crow::response handleOAuthLogin(const std::string& provider);
    crow::response handleOAuthCallback(const std::string& provider, const std::string& code);
    crow::response handleLogout(const std::string& session_token);

    // Session validation
    std::optional<db::User> validateSession(const std::string& session_token);

    // OAuth provider configuration
    void configureGoogleOAuth(const std::string& client_id, const std::string& client_secret,
                              const std::string& redirect_uri);
    void configureGitHubOAuth(const std::string& client_id, const std::string& client_secret,
                              const std::string& redirect_uri);

private:
    std::shared_ptr<db::Database> db_;
    std::map<std::string, OAuthConfig> oauth_configs_;

    std::string exchangeCodeForToken(const OAuthConfig& config, const std::string& code);
    json getUserInfo(const OAuthConfig& config, const std::string& access_token);
    std::string generateSessionToken();
};

// Middleware for authentication
struct AuthMiddleware {
    struct context {
        std::optional<db::User> user;
    };

    void before_handle(crow::request& req, crow::response& res, context& ctx);
    void after_handle(crow::request& req, crow::response& res, context& ctx);
};

} // namespace auth
