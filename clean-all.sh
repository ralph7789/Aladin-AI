#!/bin/bash
echo "🧹 Deep cleaning all node_modules everywhere to start perfectly fresh..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

echo "🧹 Wiping all compiled 'dist' folders..."
find packages -name "dist" -type d -exec rm -rf {} +
rm -rf client/dist

echo "✅ Your Aladin project is 100% clean."
