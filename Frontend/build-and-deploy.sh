#!/bin/bash

# Exit on error
set -e

# Configuration
REGISTRY="192.168.33.10:8083"
IMAGE_NAME="piwebapp-frontend"
TAG="latest"
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo "Building and deploying frontend to ${FULL_IMAGE_NAME}"

# Step 1: Install dependencies
echo "Installing dependencies..."
npm install

# Step 2: Build the frontend
echo "Building frontend..."
npm run build

# Step 3: Build the Docker image
echo "Building Docker image..."
docker build -t ${FULL_IMAGE_NAME} .

# Step 4: Push to registry
echo "Pushing to registry..."
docker push ${FULL_IMAGE_NAME}

# Step 5: Deploy the container
echo "Deploying container..."
# Check if container exists and remove it
if [ "$(docker ps -a -q -f name=frontend)" ]; then
    echo "Removing existing frontend container..."
    docker rm -f frontend
fi

# Run the new container
echo "Starting new frontend container..."
docker run -d --name frontend \
  --network app-network \
  -p 80:80 \
  ${FULL_IMAGE_NAME}

echo "Frontend deployment complete!"
echo "Frontend is accessible at: http://localhost:80"
