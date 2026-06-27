#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting sequential build of Aladin packages..."

# Set memory limit for the entire process (1024MB to avoid OOM on 4GB systems)
export NODE_OPTIONS="--max-old-space-size=1024"
export GENERATE_SOURCEMAP=false

echo "🧹 Cleaning previous builds..."
# Use rimraf via npm to be consistent with project tools
npm run backend:stop || true
find packages -name "dist" -type d -exec rm -rf {} +

echo "📦 [1/4] Building data-provider..."
cd packages/data-provider && npm run build && cd ../..

echo "📦 [2/4] Building data-schemas..."
cd packages/data-schemas && npm run build && cd ../..

echo "📦 [3/4] Building api (MCP services)..."
cd packages/api && npm run build && cd ../..

echo "📦 [4/4] Building client-package..."
cd packages/client && npm run build && cd ../..

echo ""
echo "✅ All packages built successfully!"
echo "-----------------------------------"
echo "To start the app:"
echo "Backend:  npm run backend"
echo "Frontend: npm run frontend:dev"
