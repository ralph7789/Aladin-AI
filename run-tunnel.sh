#!/bin/bash
echo "🌐 Starting Cloudflare tunnel on port 3080..."
if ! command -v cloudflared &> /dev/null; then
    echo "⬇️ Downloading cloudflared..."
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
    chmod +x cloudflared-linux-amd64
    sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
fi
cloudflared tunnel --url http://localhost:3080
