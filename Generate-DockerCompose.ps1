# This script generates a docker-compose.prod.yml file with the correct build number
# Usage: .\Generate-DockerCompose.ps1 -BuildNumber 54

param (
    [Parameter(Mandatory=$false)]
    [int]$BuildNumber = 54
)

$REGISTRY = "192.168.33.10:8083"
$BACKEND_IMAGE = "${REGISTRY}/piwebapp-backend:${BuildNumber}"
$FRONTEND_IMAGE = "${REGISTRY}/piwebapp-frontend:${BuildNumber}"
$MONGO_USER = "root"
$MONGO_PASSWORD = "example"
$JWT_SECRET = "development_jwt_secret_replace_in_production"

# Calculate port offsets based on build number to avoid conflicts
$BACKEND_PORT = 5000 + ($BuildNumber % 10)
$FRONTEND_PORT = 8000 + ($BuildNumber % 10)
$MONGO_PORT = 27017 + ($BuildNumber % 10)

# Create the docker-compose.prod.yml file
$dockerComposeContent = @"
version: '3.8'
services:
  db:
    image: mongo:4.2
    container_name: db-${BuildNumber}
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    ports:
      - "${MONGO_PORT}:27017"
    volumes:
      - mongo-data-${BuildNumber}:/data/db
    networks:
      - app-network-${BuildNumber}

  backend:
    image: ${BACKEND_IMAGE}
    container_name: backend-${BuildNumber}
    restart: on-failure:3
    depends_on:
      - db
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://${MONGO_USER}:${MONGO_PASSWORD}@db-${BuildNumber}:27017/codevisionpiweb?authSource=admin
      - JWT_SECRET=${JWT_SECRET}
      - PORT=5000
      - DEBUG=express:*
    ports:
      - "${BACKEND_PORT}:5000"
    networks:
      - app-network-${BuildNumber}
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
    container_name: frontend-${BuildNumber}
    restart: always
    depends_on:
      - backend
    ports:
      - "${FRONTEND_PORT}:80"
    networks:
      - app-network-${BuildNumber}

networks:
  app-network-${BuildNumber}:
    driver: bridge

volumes:
  mongo-data-${BuildNumber}:
"@

# Write the content to the file
$dockerComposeContent | Out-File -FilePath "docker-compose.prod.yml" -Encoding utf8

Write-Host "Generated docker-compose.prod.yml for build #${BuildNumber}"
Write-Host "Backend port: ${BACKEND_PORT}"
Write-Host "Frontend port: ${FRONTEND_PORT}"
Write-Host "MongoDB port: ${MONGO_PORT}"
