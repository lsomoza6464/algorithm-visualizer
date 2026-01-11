#include "crow.h"
#include "database.h"
#include "auth_handler.h"
#include "utils.h"
#include <nlohmann/json.hpp>
#include <memory>
#include <iostream>
#include <fstream>

using json = nlohmann::json;

// Helper function to get session token from request
std::string getSessionToken(const crow::request& req) {
    // Try Authorization header first
    auto auth_header = req.get_header_value("Authorization");
    if (!auth_header.empty() && auth_header.substr(0, 7) == "Bearer ") {
        return auth_header.substr(7);
    }

    // Try cookie
    auto cookie_header = req.get_header_value("Cookie");
    if (!cookie_header.empty()) {
        size_t pos = cookie_header.find("session_token=");
        if (pos != std::string::npos) {
            size_t start = pos + 14;
            size_t end = cookie_header.find(';', start);
            if (end == std::string::npos) end = cookie_header.length();
            return cookie_header.substr(start, end - start);
        }
    }

    return "";
}

// Helper function to validate user session
std::optional<db::User> validateUser(const crow::request& req,
                                    std::shared_ptr<auth::AuthHandler> auth_handler) {
    std::string session_token = getSessionToken(req);
    if (session_token.empty()) {
        return std::nullopt;
    }
    return auth_handler->validateSession(session_token);
}

int main() {
    // Initialize database
    auto database = std::make_shared<db::Database>("visualizer.db");
    if (!database->initialize()) {
        std::cerr << "Failed to initialize database" << std::endl;
        return 1;
    }

    // Initialize auth handler
    auto auth_handler = std::make_shared<auth::AuthHandler>(database);

    // Load OAuth configuration from config file or environment variables
    std::ifstream config_file("config.json");
    if (config_file.is_open()) {
        // Use config.json for local development
        json config;
        config_file >> config;

        if (config.contains("oauth")) {
            if (config["oauth"].contains("google")) {
                auto google = config["oauth"]["google"];
                auth_handler->configureGoogleOAuth(
                    google["client_id"],
                    google["client_secret"],
                    google["redirect_uri"]
                );
            }

            if (config["oauth"].contains("github")) {
                auto github = config["oauth"]["github"];
                auth_handler->configureGitHubOAuth(
                    github["client_id"],
                    github["client_secret"],
                    github["redirect_uri"]
                );
            }
        }
        std::cout << "OAuth configured from config.json" << std::endl;
    } else {
        // Fall back to environment variables for production (Render, etc.)
        std::cout << "config.json not found. Using environment variables..." << std::endl;

        const char* google_client_id = std::getenv("GOOGLE_CLIENT_ID");
        const char* google_client_secret = std::getenv("GOOGLE_CLIENT_SECRET");

        if (google_client_id && google_client_secret) {
            // Get backend URL for redirect URI
            const char* backend_url = std::getenv("RENDER_EXTERNAL_URL");
            std::string redirect_uri = backend_url
                ? std::string(backend_url) + "/api/auth/callback/google"
                : "http://localhost:3001/api/auth/callback/google";

            auth_handler->configureGoogleOAuth(
                google_client_id,
                google_client_secret,
                redirect_uri
            );
            std::cout << "Google OAuth configured from environment variables" << std::endl;
        } else {
            std::cout << "Warning: Google OAuth credentials not found in environment" << std::endl;
        }

        // GitHub OAuth from env vars (optional)
        const char* github_client_id = std::getenv("GITHUB_CLIENT_ID");
        const char* github_client_secret = std::getenv("GITHUB_CLIENT_SECRET");

        if (github_client_id && github_client_secret) {
            const char* backend_url = std::getenv("RENDER_EXTERNAL_URL");
            std::string redirect_uri = backend_url
                ? std::string(backend_url) + "/api/auth/callback/github"
                : "http://localhost:3001/api/auth/callback/github";

            auth_handler->configureGitHubOAuth(
                github_client_id,
                github_client_secret,
                redirect_uri
            );
            std::cout << "GitHub OAuth configured from environment variables" << std::endl;
        }
    }

    crow::SimpleApp app;

    // Health check endpoint
    CROW_ROUTE(app, "/api/health")
    ([]() {
        json response;
        response["status"] = "ok";
        response["message"] = "Debug Visualizer Backend is running";
        return utils::jsonResponse(response);
    });

    // OAuth endpoints
    CROW_ROUTE(app, "/api/auth/login/<string>")
    ([&auth_handler](const std::string& provider) {
        return auth_handler->handleOAuthLogin(provider);
    });

    CROW_ROUTE(app, "/api/auth/callback/<string>")
    ([&auth_handler](const crow::request& req, const std::string& provider) {
        std::string code = req.url_params.get("code") ? req.url_params.get("code") : "";
        if (code.empty()) {
            return utils::errorResponse("No authorization code provided", 400);
        }
        return auth_handler->handleOAuthCallback(provider, code);
    });

    CROW_ROUTE(app, "/api/auth/logout").methods("POST"_method)
    ([&auth_handler](const crow::request& req) {
        std::string session_token = getSessionToken(req);
        return auth_handler->handleLogout(session_token);
    });

    CROW_ROUTE(app, "/api/auth/me")
    ([&auth_handler](const crow::request& req) {
        auto user = validateUser(req, auth_handler);
        if (!user) {
            return utils::errorResponse("Not authenticated", 401);
        }

        json user_data;
        user_data["id"] = user->id;
        user_data["username"] = user->username;
        user_data["email"] = user->email;
        user_data["display_name"] = user->display_name;
        user_data["avatar_url"] = user->avatar_url;
        user_data["created_at"] = user->created_at;
        user_data["last_login"] = user->last_login;

        return utils::jsonResponse(user_data);
    });

    // Visualization endpoints - CORS preflight
    CROW_ROUTE(app, "/api/visualizations").methods("OPTIONS"_method)
    ([]() {
        return utils::corsOptionsResponse();
    });

    CROW_ROUTE(app, "/api/visualizations").methods("GET"_method)
    ([&database, &auth_handler](const crow::request& req) {
        auto user = validateUser(req, auth_handler);
        if (!user) {
            return utils::errorResponse("Not authenticated", 401);
        }

        int limit = req.url_params.get("limit") ? std::stoi(req.url_params.get("limit")) : 50;
        int offset = req.url_params.get("offset") ? std::stoi(req.url_params.get("offset")) : 0;

        auto visualizations = database->getUserVisualizations(user->id, limit, offset);

        json result = json::array();
        for (const auto& viz : visualizations) {
            json viz_json;
            viz_json["id"] = viz.id;
            viz_json["title"] = viz.title;
            viz_json["description"] = viz.description;
            viz_json["code"] = viz.code;
            viz_json["included_variables"] = viz.included_variables;
            viz_json["selected_variables"] = viz.selected_variables;
            viz_json["visualization_config"] = viz.visualization_config;
            viz_json["created_at"] = viz.created_at;
            viz_json["updated_at"] = viz.updated_at;
            viz_json["is_favorite"] = viz.is_favorite;
            result.push_back(viz_json);
        }

        return utils::jsonResponse(result);
    });

    CROW_ROUTE(app, "/api/visualizations").methods("POST"_method)
    ([&database, &auth_handler](const crow::request& req) {
        auto user = validateUser(req, auth_handler);
        if (!user) {
            return utils::errorResponse("Not authenticated", 401);
        }

        try {
            json body = json::parse(req.body);

            std::string title = body.value("title", "Untitled Visualization");
            std::string description = body.value("description", "");
            std::string code = body.value("code", "");
            std::string included_vars = body.value("included_variables", "");
            std::string selected_vars = body.value("selected_variables", "");
            std::string config = body.value("visualization_config", "");

            auto viz = database->createVisualization(user->id, title, description, code,
                                                    included_vars, selected_vars, config);

            if (!viz) {
                return utils::errorResponse("Failed to create visualization", 500);
            }

            json viz_json;
            viz_json["id"] = viz->id;
            viz_json["title"] = viz->title;
            viz_json["description"] = viz->description;
            viz_json["created_at"] = viz->created_at;

            return utils::jsonResponse(viz_json, 201);

        } catch (const std::exception& e) {
            return utils::errorResponse(std::string("Invalid request: ") + e.what(), 400);
        }
    });

    CROW_ROUTE(app, "/api/visualizations/<int>").methods("GET"_method)
    ([&database, &auth_handler](const crow::request& req, int viz_id) {
        auto user = validateUser(req, auth_handler);
        if (!user) {
            return utils::errorResponse("Not authenticated", 401);
        }

        auto viz = database->getVisualization(viz_id);
        if (!viz) {
            return utils::errorResponse("Visualization not found", 404);
        }

        // Check ownership
        if (viz->user_id != user->id) {
            return utils::errorResponse("Unauthorized", 403);
        }

        json viz_json;
        viz_json["id"] = viz->id;
        viz_json["title"] = viz->title;
        viz_json["description"] = viz->description;
        viz_json["code"] = viz->code;
        viz_json["included_variables"] = viz->included_variables;
        viz_json["selected_variables"] = viz->selected_variables;
        viz_json["visualization_config"] = viz->visualization_config;
        viz_json["created_at"] = viz->created_at;
        viz_json["updated_at"] = viz->updated_at;
        viz_json["is_favorite"] = viz->is_favorite;

        return utils::jsonResponse(viz_json);
    });

    CROW_ROUTE(app, "/api/visualizations/<int>").methods("DELETE"_method)
    ([&database, &auth_handler](const crow::request& req, int viz_id) {
        auto user = validateUser(req, auth_handler);
        if (!user) {
            return utils::errorResponse("Not authenticated", 401);
        }

        auto viz = database->getVisualization(viz_id);
        if (!viz || viz->user_id != user->id) {
            return utils::errorResponse("Visualization not found or unauthorized", 404);
        }

        if (!database->deleteVisualization(viz_id)) {
            return utils::errorResponse("Failed to delete visualization", 500);
        }

        return utils::successResponse("Visualization deleted");
    });

    CROW_ROUTE(app, "/api/visualizations/<int>/favorite").methods("POST"_method)
    ([&database, &auth_handler](const crow::request& req, int viz_id) {
        auto user = validateUser(req, auth_handler);
        if (!user) {
            return utils::errorResponse("Not authenticated", 401);
        }

        auto viz = database->getVisualization(viz_id);
        if (!viz || viz->user_id != user->id) {
            return utils::errorResponse("Visualization not found or unauthorized", 404);
        }

        if (!database->toggleFavorite(viz_id)) {
            return utils::errorResponse("Failed to toggle favorite", 500);
        }

        return utils::successResponse("Favorite toggled");
    });

    // LeetCode history endpoints - CORS preflight
    CROW_ROUTE(app, "/api/leetcode/history").methods("OPTIONS"_method)
    ([]() {
        return utils::corsOptionsResponse();
    });

    CROW_ROUTE(app, "/api/leetcode/view").methods("OPTIONS"_method)
    ([]() {
        return utils::corsOptionsResponse();
    });

    CROW_ROUTE(app, "/api/leetcode/history").methods("GET"_method)
    ([&database, &auth_handler](const crow::request& req) {
        auto user = validateUser(req, auth_handler);
        if (!user) {
            return utils::errorResponse("Not authenticated", 401);
        }

        int limit = req.url_params.get("limit") ? std::stoi(req.url_params.get("limit")) : 50;

        auto history = database->getLeetCodeHistory(user->id, limit);

        json result = json::array();
        for (const auto& entry : history) {
            json entry_json;
            entry_json["id"] = entry.id;
            entry_json["problem_id"] = entry.problem_id;
            entry_json["problem_slug"] = entry.problem_slug;
            entry_json["problem_title"] = entry.problem_title;
            entry_json["last_viewed"] = entry.last_viewed;
            entry_json["view_count"] = entry.view_count;
            entry_json["notes"] = entry.notes;
            result.push_back(entry_json);
        }

        return utils::jsonResponse(result);
    });

    CROW_ROUTE(app, "/api/leetcode/view").methods("POST"_method)
    ([&database, &auth_handler](const crow::request& req) {
        auto user = validateUser(req, auth_handler);
        if (!user) {
            return utils::errorResponse("Not authenticated", 401);
        }

        try {
            json body = json::parse(req.body);

            int problem_id = body["problem_id"];
            std::string problem_slug = body["problem_slug"];
            std::string problem_title = body.value("problem_title", "");

            bool success = database->recordLeetCodeView(user->id, problem_id,
                                                       problem_slug, problem_title);

            if (!success) {
                return utils::errorResponse("Failed to record view", 500);
            }

            return utils::successResponse("View recorded");

        } catch (const std::exception& e) {
            return utils::errorResponse(std::string("Invalid request: ") + e.what(), 400);
        }
    });

    CROW_ROUTE(app, "/api/leetcode/<int>/notes").methods("PUT"_method)
    ([&database, &auth_handler](const crow::request& req, int problem_id) {
        auto user = validateUser(req, auth_handler);
        if (!user) {
            return utils::errorResponse("Not authenticated", 401);
        }

        try {
            json body = json::parse(req.body);
            std::string notes = body.value("notes", "");

            bool success = database->updateLeetCodeNotes(user->id, problem_id, notes);

            if (!success) {
                return utils::errorResponse("Failed to update notes", 500);
            }

            return utils::successResponse("Notes updated");

        } catch (const std::exception& e) {
            return utils::errorResponse(std::string("Invalid request: ") + e.what(), 400);
        }
    });

    // Cleanup expired sessions periodically
    database->cleanExpiredSessions();

    std::cout << "Debug Visualizer Backend starting on port 3001..." << std::endl;
    app.port(3001).run();

    return 0;
}
