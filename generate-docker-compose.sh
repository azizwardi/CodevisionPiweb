#!/bin/bash

# This script generates a docker-compose.prod.yml file with the correct build number
# Usage: ./generate-docker-compose.sh <build_number>

# Get the build number from the command line
BUILD_NUMBER=${1:-54}
REGISTRY="192.168.33.10:8083"
BACKEND_IMAGE="${REGISTRY}/piwebapp-backend:${BUILD_NUMBER}"
FRONTEND_IMAGE="${REGISTRY}/piwebapp-frontend:${BUILD_NUMBER}"
MONGO_USER="root"
MONGO_PASSWORD="example"
JWT_SECRET="development_jwt_secret_replace_in_production"

# Calculate port offsets based on build number to avoid conflicts
BACKEND_PORT=$((5000 + (BUILD_NUMBER % 10)))
FRONTEND_PORT=$((8000 + (BUILD_NUMBER % 10)))
MONGO_PORT=$((27017 + (BUILD_NUMBER % 10)))

# Create the docker-compose.prod.yml file
cat > docker-compose.prod.yml << EOL
version: '3.8'
services:
  db:
    image: mongo:4.2
    container_name: db-${BUILD_NUMBER}
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    ports:
      - "${MONGO_PORT}:27017"
    volumes:
      - mongo-data-${BUILD_NUMBER}:/data/db
    networks:
      - app-network-${BUILD_NUMBER}

  backend:
    image: ${BACKEND_IMAGE}
    container_name: backend-${BUILD_NUMBER}
    restart: on-failure:3
    depends_on:
      - db
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://${MONGO_USER}:${MONGO_PASSWORD}@db-${BUILD_NUMBER}:27017/codevisionpiweb?authSource=admin
      - JWT_SECRET=${JWT_SECRET}
      - PORT=5000
      - DEBUG=express:*
    ports:
      - "${BACKEND_PORT}:5000"
    networks:
      - app-network-${BUILD_NUMBER}
    healthcheck:
      test: ["CMD", "/app/healthcheck.sh"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    # Simplified command to avoid interpolation issues
    command: >
      sh -c '
        echo "Waiting for MongoDB to be ready..." &&
        sleep 15 &&
        echo "Starting backend application..." &&
        node server.js
      '

  frontend:
    image: ${FRONTEND_IMAGE}
    container_name: frontend-${BUILD_NUMBER}
    restart: always
    depends_on:
      - backend
    ports:
      - "${FRONTEND_PORT}:80"
    networks:
      - app-network-${BUILD_NUMBER}

networks:
  app-network-${BUILD_NUMBER}:
    driver: bridge

volumes:
  mongo-data-${BUILD_NUMBER}:
EOL

echo "Generated docker-compose.prod.yml for build #${BUILD_NUMBER}"
echo "Backend port: ${BACKEND_PORT}"
echo "Frontend port: ${FRONTEND_PORT}"
echo "MongoDB port: ${MONGO_PORT}"
