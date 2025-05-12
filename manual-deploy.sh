#!/bin/bash

# Exit on error
set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file"
    export $(grep -v '^#' .env | xargs)
fi

# Check required environment variables
if [ -z "$DOCKER_REGISTRY" ]; then
    echo "DOCKER_REGISTRY environment variable is not set. Please set it in .env file."
    exit 1
fi

if [ -z "$MONGO_USER" ] || [ -z "$MONGO_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    echo "MONGO_USER, MONGO_PASSWORD, or JWT_SECRET environment variables are not set. Please set them in .env file."
    exit 1
fi

# Default values
ENVIRONMENT=${ENVIRONMENT:-production}
TAG=${TAG:-latest}
BACKEND_IMAGE="${DOCKER_REGISTRY}/piwebapp-backend:${TAG}"
FRONTEND_IMAGE="${DOCKER_REGISTRY}/piwebapp-frontend:${TAG}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --env)
        ENVIRONMENT="$2"
        shift
        shift
        ;;
        --tag)
        TAG="$2"
        BACKEND_IMAGE="${DOCKER_REGISTRY}/piwebapp-backend:${TAG}"
        FRONTEND_IMAGE="${DOCKER_REGISTRY}/piwebapp-frontend:${TAG}"
        shift
        shift
        ;;
        *)
        echo "Unknown option: $1"
        exit 1
        ;;
    esac
done

echo "Deploying to $ENVIRONMENT environment with tag $TAG"

# Pull the latest images
echo "Pulling latest Docker images..."
docker pull $BACKEND_IMAGE
docker pull $FRONTEND_IMAGE

# Deploy using docker-compose
echo "Deploying with docker-compose..."
BACKEND_IMAGE=$BACKEND_IMAGE \
FRONTEND_IMAGE=$FRONTEND_IMAGE \
MONGO_USER=$MONGO_USER \
MONGO_PASSWORD=$MONGO_PASSWORD \
JWT_SECRET=$JWT_SECRET \
docker-compose -f docker-compose.prod.yml up -d

echo "Deployment completed successfully!"
echo "Backend running at: http://localhost:5000"
echo "Frontend running at: http://localhost:80"
