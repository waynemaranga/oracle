#!/bin/bash

set -e

echo "🚀 Building and starting the Oracle 👁️ with Docker Compose..."
docker compose -f docker/docker-compose.yaml up --build
