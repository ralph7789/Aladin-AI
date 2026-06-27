#!/bin/bash
set -e

# Strict 1GB memory limit. If it passes 1GB, the script will safely fail rather than bringing down your entire OS.
export NODE_OPTIONS="--max-old-space-size=1024"

echo "📦 1. Safely installing all dependencies via NPM..."
npm install --legacy-peer-deps

echo "📦 2. Building background packages sequentially..."
(cd packages/data-provider && npm run build)
(cd packages/data-schemas && npm run build)

echo "📦 3. Building API (esbuild 0-memory bypass)..."
(cd packages/api && npx esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js --sourcemap --format=cjs --packages=external --define:__IS_DEV__=false)

echo "📦 4. Building client wrapper..."
(cd packages/client && npm run build)

echo "🚀 5. Building frontend Client (Vite optimized for 4GB OS)..."
# We've replaced Terser with Esbuild in your config so this won't crash your system anymore.
(cd client && npm run build)

echo "✅ Build completed successfully! You can now use ./run-backend.sh"
