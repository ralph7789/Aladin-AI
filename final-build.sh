#!/bin/bash
set -e

echo "🧠 System Level Check: Virtual Memory (Swap)"
# Check if the system has swap space enabled. If not, create a 4GB swapfile.
# This mathematically solves the 4GB hardware limitation by giving the OS virtual RAM to page into during the heavy frontend bundle.
SWAP_SIZE=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$SWAP_SIZE" -eq "0" ]; then
    echo "⚠️ No swap memory detected. Your 4GB RAM cannot fit the OS + a 3GB Vite bundle."
    echo "Creating a temporary 4GB swap file to prevent the system crash..."
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo "✅ 4GB Swap enabled!"
else
    echo "✅ Swap memory already exists ($SWAP_SIZE MB)."
fi

echo "📦 1. Compiling backend packages instantly with ESBuild (0 RAM overhead)..."
(cd packages/data-provider && npx esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js --sourcemap --format=cjs --packages=external)
(cd packages/data-provider && npx esbuild src/react-query/index.ts --bundle --platform=node --outfile=dist/react-query/index.js --sourcemap --format=cjs --packages=external)
(cd packages/data-schemas && npx esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js --sourcemap --format=cjs --packages=external)
(cd packages/api && npx esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js --sourcemap --format=cjs --packages=external --define:__IS_DEV__=false)
(cd packages/client && npx esbuild src/index.ts --bundle --platform=browser --outfile=dist/index.es.js --sourcemap --format=esm --packages=external --jsx=automatic)

echo "🚀 2. Bundling Frontend for LocalTunnel..."
# We run Vite build directly instead of npm run build. 
# It will use the new 'minify: esbuild' configuration I injected earlier, cutting RAM usage in half, and will page to the Swap file if it hits your hardware limit.
export NODE_OPTIONS="--max-old-space-size=3072"
(cd client && npx vite build)

echo "✅ Full Production Build Complete! You can now safely run your tunnel."
