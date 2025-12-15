cmake_minimum_required(VERSION 3.15)
project(DebugVisualizerBackend)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Set Boost hints for macOS Homebrew
set(BOOST_ROOT "/opt/homebrew")
set(Boost_INCLUDE_DIR "/opt/homebrew/include")

# Find required packages
find_package(Threads REQUIRED)
find_package(Boost 1.64 REQUIRED COMPONENTS date_time)

# SQLite3
find_package(SQLite3 REQUIRED)

# Include FetchContent module for downloading dependencies
include(FetchContent)

# Try to find nlohmann_json
find_package(nlohmann_json 3.2.0 QUIET)
if(NOT nlohmann_json_FOUND)
    message(STATUS "nlohmann_json not found via CMake, will use FetchContent")
    FetchContent_Declare(json
        URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
    )
    FetchContent_MakeAvailable(json)
endif()

# Crow is header-only, we'll download it via FetchContent
# Using master branch for best Asio compatibility
FetchContent_Declare(
    crow
    GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
    GIT_TAG master
)

# Configure Crow to use Asio standalone instead of Boost.Asio
set(CROW_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(CROW_BUILD_TESTS OFF CACHE BOOL "" FORCE)

FetchContent_MakeAvailable(crow)

# Add include directories
include_directories(${CMAKE_SOURCE_DIR}/include)
include_directories(${SQLite3_INCLUDE_DIRS})

# Source files
set(SOURCES
    src/main.cpp
    src/database.cpp
    src/auth_handler.cpp
    src/utils.cpp
)

# Create executable
add_executable(backend_server ${SOURCES})

# Link libraries
target_link_libraries(backend_server
    ${CMAKE_THREAD_LIBS_INIT}
    ${SQLite3_LIBRARIES}
    Boost::date_time
)

# Link nlohmann_json
if(TARGET nlohmann_json::nlohmann_json)
    target_link_libraries(backend_server nlohmann_json::nlohmann_json)
else()
    target_link_libraries(backend_server nlohmann_json)
endif()

target_link_libraries(backend_server Crow::Crow)

# Also need to find and link CURL
find_package(CURL REQUIRED)
target_link_libraries(backend_server ${CURL_LIBRARIES})
target_include_directories(backend_server PRIVATE ${CURL_INCLUDE_DIRS})

# Add OpenSSL for HTTPS and OAuth (optional but recommended)
find_package(OpenSSL)
if(OPENSSL_FOUND)
    target_link_libraries(backend_server OpenSSL::SSL OpenSSL::Crypto)
    target_compile_definitions(backend_server PRIVATE CROW_ENABLE_SSL)
endif()

# Copy database schema to build directory
configure_file(${CMAKE_SOURCE_DIR}/schema.sql ${CMAKE_BINARY_DIR}/schema.sql COPYONLY)

# Installation
install(TARGETS backend_server DESTINATION bin)
