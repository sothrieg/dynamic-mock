#!/bin/bash

# Docker build script for JSON Schema API Generator
# Author: Thomas Rieger <t.rieger@quickline.ch>

set -e

echo "🐳 Building JSON Schema API Generator Docker Image..."

# Build arguments
IMAGE_NAME="json-schema-api-generator"
TAG=${1:-latest}
FULL_IMAGE_NAME="$IMAGE_NAME:$TAG"

echo "📦 Building image: $FULL_IMAGE_NAME"

# Build the Docker image
docker build \
  --tag "$FULL_IMAGE_NAME" \
  --build-arg NODE_ENV=production \
  --progress=plain \
  .

echo "✅ Successfully built: $FULL_IMAGE_NAME"

# Optional: Run the container for testing
read -p "🚀 Do you want to run the container now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🏃 Starting container..."
    docker run -d \
      --name json-schema-api-test \
      --port 3000:3000 \
      --volume json_data:/app/.data \
      "$FULL_IMAGE_NAME"
    
    echo "✅ Container started! Access your app at: http://localhost:3000"
    echo "📊 View logs with: docker logs json-schema-api-test"
    echo "🛑 Stop container with: docker stop json-schema-api-test"
    echo "🗑️  Remove container with: docker rm json-schema-api-test"
fi

echo "🎉 Docker setup complete!"