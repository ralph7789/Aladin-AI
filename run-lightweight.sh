#!/bin/bash
set -e

echo "📦 1. Compiling backend packages instantly with ESBuild (Bypassing Rollup & NPM completely)..."
# data-provider
(cd packages/data-provider && npx esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js --sourcemap --format=cjs --packages=external)
(cd packages/data-provider && npx esbuild src/react-query/index.ts --bundle --platform=node --outfile=dist/react-query/index.js --sourcemap --format=cjs --packages=external)

# data-schemas
(cd packages/data-schemas && npx esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js --sourcemap --format=cjs --packages=external)

# api
(cd packages/api && npx esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js --sourcemap --format=cjs --packages=external --define:__IS_DEV__=false)

# client-package
(cd packages/client && npx esbuild src/index.ts --bundle --platform=browser --outfile=dist/index.es.js --sourcemap --format=esm --packages=external --jsx=automatic)
(cd packages/client && cp dist/index.es.js dist/index.js)

echo "✅ Backend compilation finished in milliseconds! (0 RAM Spikes)"

echo "🚀 2. Starting Backend Server..."
NODE_ENV=production node api/server/index.js &
BACKEND_PID=$!

echo "🚀 3. Starting Frontend Server (Vite 0-RAM Mode)..."
# Run the frontend dev server which skips the massive 2GB bundling process entirely
cd client && npx vite --port 3090 &
FRONTEND_PID=$!
cd ..

function cleanup {
  echo "Stopping servers..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
}
trap cleanup EXIT INT TERM

echo "⏳ Waiting 5 seconds for servers to initialize..."
sleep 5

echo "🌐 Starting LocalTunnel on Frontend Port (3090) with subdomain 'jeko-aladin'..."
# The frontend server automatically proxies API calls to the backend, so tunneling the frontend is all you need!
npx localtunnel --port 3090 --subdomain jeko-aladin
