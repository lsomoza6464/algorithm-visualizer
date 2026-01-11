#pragma once

#include <string>
#include <vector>
#include <random>
#include <sstream>
#include <iomanip>
#include <map>
#include <nlohmann/json.hpp>
#include "crow.h"

namespace utils {

// Generate random token
std::string generateRandomToken(size_t length = 32);

// URL encoding/decoding
std::string urlEncode(const std::string& str);
std::string urlDecode(const std::string& str);

// Environment helpers
std::string getAllowedOrigin();

// JSON helpers
crow::response jsonResponse(const nlohmann::json& data, int status = 200);
crow::response errorResponse(const std::string& message, int status = 400);
crow::response successResponse(const std::string& message = "Success");
crow::response corsOptionsResponse();

// String utilities
std::vector<std::string> split(const std::string& str, char delimiter);
std::string trim(const std::string& str);

// Time utilities
std::string getCurrentTimestamp();
std::string getExpiryTimestamp(int hours_from_now);

// HTTP request helpers
std::string makeHttpRequest(const std::string& url, const std::string& method = "GET",
                           const std::string& body = "",
                           const std::map<std::string, std::string>& headers = {});

} // namespace utils
