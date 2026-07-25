#!/bin/bash

# Exit on any error
set -e

echo "🚀 Building Aladin AI Docker Images Sequentially..."
echo "This prevents CPU starvation and disconnections in GitHub Codespaces by ensuring"
echo "the heavy Python compiler and Vite JS bundler don't run at the same time."
echo "------------------------------------------------------------------------"

echo "📦 [1/2] Building RAG API (Python/C++ dependencies)..."
docker compose build rag_api

echo "📦 [2/2] Building Main API & Client (Node/Vite dependencies)..."
docker compose build api

echo "------------------------------------------------------------------------"
echo "✅ All builds complete! Starting containers..."
docker compose up
