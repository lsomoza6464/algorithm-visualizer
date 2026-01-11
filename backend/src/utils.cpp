#include "utils.h"
#include <random>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <chrono>
#include <curl/curl.h>

namespace utils {

std::string generateRandomToken(size_t length) {
    const char charset[] = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const size_t max_index = sizeof(charset) - 1;

    std::random_device rd;
    std::mt19937 generator(rd());
    std::uniform_int_distribution<> distribution(0, max_index - 1);

    std::string token;
    token.reserve(length);

    for (size_t i = 0; i < length; ++i) {
        token += charset[distribution(generator)];
    }

    return token;
}

std::string urlEncode(const std::string& str) {
    std::ostringstream escaped;
    escaped.fill('0');
    escaped << std::hex;

    for (char c : str) {
        if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
            escaped << c;
        } else {
            escaped << std::uppercase;
            escaped << '%' << std::setw(2) << int((unsigned char)c);
            escaped << std::nouppercase;
        }
    }

    return escaped.str();
}

std::string urlDecode(const std::string& str) {
    std::string decoded;
    for (size_t i = 0; i < str.length(); ++i) {
        if (str[i] == '%') {
            if (i + 2 < str.length()) {
                int value;
                std::istringstream hex_stream(str.substr(i + 1, 2));
                hex_stream >> std::hex >> value;
                decoded += static_cast<char>(value);
                i += 2;
            }
        } else if (str[i] == '+') {
            decoded += ' ';
        } else {
            decoded += str[i];
        }
    }
    return decoded;
}

// Helper function to get allowed origin based on environment
std::string getAllowedOrigin() {
    // Check if FRONTEND_URL environment variable is set (for production)
    const char* frontend_url = std::getenv("FRONTEND_URL");
    if (frontend_url) {
        return std::string(frontend_url);
    }
    // Default to localhost for development
    return "http://localhost:3000";
}

crow::response jsonResponse(const nlohmann::json& data, int status) {
    crow::response res(status);
    res.set_header("Content-Type", "application/json");
    res.set_header("Access-Control-Allow-Origin", getAllowedOrigin());
    res.set_header("Access-Control-Allow-Credentials", "true");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    res.write(data.dump());
    return res;
}

crow::response errorResponse(const std::string& message, int status) {
    nlohmann::json j;
    j["error"] = message;
    j["success"] = false;
    return jsonResponse(j, status);
}

crow::response successResponse(const std::string& message) {
    nlohmann::json j;
    j["message"] = message;
    j["success"] = true;
    return jsonResponse(j, 200);
}

crow::response corsOptionsResponse() {
    crow::response res(204);
    res.set_header("Access-Control-Allow-Origin", getAllowedOrigin());
    res.set_header("Access-Control-Allow-Credentials", "true");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    res.set_header("Access-Control-Max-Age", "86400");
    return res;
}

std::vector<std::string> split(const std::string& str, char delimiter) {
    std::vector<std::string> tokens;
    std::string token;
    std::istringstream token_stream(str);

    while (std::getline(token_stream, token, delimiter)) {
        tokens.push_back(token);
    }

    return tokens;
}

std::string trim(const std::string& str) {
    auto start = std::find_if_not(str.begin(), str.end(), [](unsigned char ch) {
        return std::isspace(ch);
    });

    auto end = std::find_if_not(str.rbegin(), str.rend(), [](unsigned char ch) {
        return std::isspace(ch);
    }).base();

    return (start < end) ? std::string(start, end) : std::string();
}

std::string getCurrentTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto time_t_now = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::gmtime(&time_t_now), "%Y-%m-%d %H:%M:%S");
    return ss.str();
}

std::string getExpiryTimestamp(int hours_from_now) {
    auto now = std::chrono::system_clock::now();
    auto expiry = now + std::chrono::hours(hours_from_now);
    auto time_t_expiry = std::chrono::system_clock::to_time_t(expiry);
    std::stringstream ss;
    ss << std::put_time(std::gmtime(&time_t_expiry), "%Y-%m-%d %H:%M:%S");
    return ss.str();
}

// Callback for curl
static size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    ((std::string*)userp)->append((char*)contents, size * nmemb);
    return size * nmemb;
}

std::string makeHttpRequest(const std::string& url, const std::string& method,
                           const std::string& body,
                           const std::map<std::string, std::string>& headers) {
    CURL* curl;
    CURLcode res;
    std::string response_string;

    curl_global_init(CURL_GLOBAL_DEFAULT);
    curl = curl_easy_init();

    if (curl) {
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response_string);

        // Set method
        if (method == "POST") {
            curl_easy_setopt(curl, CURLOPT_POST, 1L);
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body.c_str());
        }

        // Set headers
        struct curl_slist* header_list = nullptr;
        for (const auto& [key, value] : headers) {
            std::string header = key + ": " + value;
            header_list = curl_slist_append(header_list, header.c_str());
        }
        if (header_list) {
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER, header_list);
        }

        // Perform the request
        res = curl_easy_perform(curl);

        if (header_list) {
            curl_slist_free_all(header_list);
        }

        curl_easy_cleanup(curl);
    }

    curl_global_cleanup();

    return response_string;
}

} // namespace utils
