FROM gcc:13

# Install dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    libsqlite3-dev \
    libcurl4-openssl-dev \
    libssl-dev \
    nlohmann-json3-dev \
    libboost-date-time-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend files
COPY . .

# Build the backend
RUN mkdir -p build && cd build && cmake .. && make

# Expose the port
EXPOSE 3001

# Run the server
CMD ["./build/backend_server"]
