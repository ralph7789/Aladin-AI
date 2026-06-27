#!/bin/bash

# --- ALADIN MASTER REBUILD SCRIPT ---
# Interactive, sequential, and memory-safe.

# Colors for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set memory limit for the entire session (1024MB to avoid OOM on 4GB systems)
export NODE_OPTIONS="--max-old-space-size=1024"
export GENERATE_SOURCEMAP=false

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}   Aladin Infrastructure Rebuild Tool     ${NC}"
echo -e "${BLUE}==========================================${NC}"

function clean_node_modules() {
    echo -e "${RED}⚠️  WARNING: This will delete ALL node_modules and dist folders.${NC}"
    read -p "Are you sure you want to proceed? (y/n): " confirm
    if [[ $confirm == [yY] ]]; then
        echo -e "${RED}🗑️  Cleaning root and package environments...${NC}"
        rm -rf node_modules package-lock.json
        rm -rf api/node_modules client/node_modules
        rm -rf packages/*/node_modules
        find . -name "dist" -type d -exec rm -rf {} + 
        echo -e "${GREEN}✨ Environment wiped. Please run 'npm install' next.${NC}"
    else
        echo "Clean cancelled."
    fi
}

function build_package() {
    local name=$1
    local path=$2
    echo -e "${BLUE}📦 [BUILDING] $name...${NC}"
    if cd "$path" && npm run build; then
        echo -e "${GREEN}✅ $name built successfully!${NC}"
        cd - > /dev/null
    else
        echo -e "${RED}❌ $name build failed!${NC}"
        cd - > /dev/null
        exit 1
    fi
}

function sequential_build_all() {
    echo -e "${BLUE}🚀 Starting full sequential build (RAM Safe Mode)...${NC}"
    build_package "Data Provider" "packages/data-provider"
    build_package "Data Schemas" "packages/data-schemas"
    build_package "API Services" "packages/api"
    build_package "Client Package" "packages/client"
    echo -e "${GREEN}🏆 MASTERPIECE COMPLETE: All infrastructure packages are ready.${NC}"
}

# --- Main Menu ---
while true; do
    echo -e "\n${BLUE}Choose an operation:${NC}"
    echo "1) 🔴 WIPE & RESET: Delete all node_modules/dist (Clean Start)"
    echo "2) 🛠️  FULL BUILD: All packages sequentially (RAM Safe)"
    echo "3) 📦 Build DATA-PROVIDER only"
    echo "4) 📦 Build DATA-SCHEMAS only"
    echo "5) 📦 Build API (MCP) only"
    echo "6) 📦 Build CLIENT-PACKAGE only"
    echo "7) 🚪 Exit"
    
    read -p "Enter choice [1-7]: " choice

    case $choice in
        1) clean_node_modules ;;
        2) sequential_build_all ;;
        3) build_package "Data Provider" "packages/data-provider" ;;
        4) build_package "Data Schemas" "packages/data-schemas" ;;
        5) build_package "API Services" "packages/api" ;;
        6) build_package "Client Package" "packages/client" ;;
        7) echo "Goodbye!"; exit 0 ;;
        *) echo "Invalid option." ;;
    esac
done
