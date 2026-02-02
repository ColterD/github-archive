#!/bin/bash
# SRBMiner-Docker Quick Start Script
# This script provides an easy way to start the Docker container

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Docker image and container names
IMAGE_NAME="srbminer-docker"
CONTAINER_NAME="srbminer-multi"

# Default ports
DEFAULT_API_PORT=7000
DEFAULT_WEB_PORT=8080

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Display welcome message
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}      SRBMiner-Docker Quick Start Script      ${NC}"
echo -e "${BLUE}===============================================${NC}"
echo

# Check if the container already exists
if docker ps -a | grep -q $CONTAINER_NAME; then
    echo -e "${YELLOW}Container '$CONTAINER_NAME' already exists.${NC}"
    
    # Check if it's running
    if docker ps | grep -q $CONTAINER_NAME; then
        echo -e "${GREEN}The container is currently running.${NC}"
        
        echo "Choose an option:"
        echo "1) Open Web UI"
        echo "2) Restart container"
        echo "3) Stop container"
        echo "4) Remove container and start fresh"
        echo "5) Exit"
        
        read -p "Enter your choice [1-5]: " CHOICE
        
        case $CHOICE in
            1)
                # Get the mapped port
                PORT=$(docker port $CONTAINER_NAME | grep $DEFAULT_WEB_PORT | cut -d':' -f2)
                echo -e "${GREEN}Opening Web UI in your browser...${NC}"
                xdg-open http://localhost:$PORT 2>/dev/null || open http://localhost:$PORT 2>/dev/null || echo -e "${YELLOW}Please open http://localhost:$PORT in your browser${NC}"
                ;;
            2)
                echo -e "${YELLOW}Restarting container...${NC}"
                docker restart $CONTAINER_NAME
                echo -e "${GREEN}Container restarted. Web UI available at: http://localhost:$DEFAULT_WEB_PORT${NC}"
                ;;
            3)
                echo -e "${YELLOW}Stopping container...${NC}"
                docker stop $CONTAINER_NAME
                echo -e "${GREEN}Container stopped.${NC}"
                ;;
            4)
                echo -e "${RED}Removing container...${NC}"
                docker rm -f $CONTAINER_NAME
                echo -e "${GREEN}Container removed.${NC}"
                # Continue to start a new container
                ;;
            5)
                echo -e "${GREEN}Exiting...${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice.${NC}"
                exit 1
                ;;
        esac
    else
        echo -e "${YELLOW}The container exists but is not running.${NC}"
        echo "Choose an option:"
        echo "1) Start container"
        echo "2) Remove container and start fresh"
        echo "3) Exit"
        
        read -p "Enter your choice [1-3]: " CHOICE
        
        case $CHOICE in
            1)
                echo -e "${YELLOW}Starting container...${NC}"
                docker start $CONTAINER_NAME
                echo -e "${GREEN}Container started. Web UI available at: http://localhost:$DEFAULT_WEB_PORT${NC}"
                exit 0
                ;;
            2)
                echo -e "${RED}Removing container...${NC}"
                docker rm -f $CONTAINER_NAME
                echo -e "${GREEN}Container removed.${NC}"
                # Continue to start a new container
                ;;
            3)
                echo -e "${GREEN}Exiting...${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice.${NC}"
                exit 1
                ;;
        esac
    fi
fi

# If we get here, we're either starting a new container or replacing an old one
echo -e "${GREEN}Starting SRBMiner-Docker container...${NC}"

# Ask about hardware detection
echo -e "${YELLOW}Which GPU type do you want to use?${NC}"
echo "1) NVIDIA GPU"
echo "2) AMD GPU"
echo "3) Intel GPU"
echo "4) CPU only (no GPU)"
echo "5) Auto-detect (will try to use all available GPUs)"

read -p "Enter your choice [1-5]: " GPU_CHOICE

# Set GPU environment variables based on choice
case $GPU_CHOICE in
    1)
        GPU_ENV="--env USE_NVIDIA_GPU=true"
        GPU_EXTRAS="--runtime=nvidia"
        ;;
    2)
        GPU_ENV="--env USE_AMD_GPU=true"
        GPU_EXTRAS="--device=/dev/kfd --device=/dev/dri --group-add video"
        ;;
    3)
        GPU_ENV="--env USE_INTEL_GPU=true"
        GPU_EXTRAS="--device=/dev/dri --group-add video"
        ;;
    4)
        GPU_ENV="--env CPU_ONLY=true"
        GPU_EXTRAS=""
        ;;
    5)
        GPU_ENV="--env AUTO_DETECT=true"
        GPU_EXTRAS="--runtime=nvidia --device=/dev/dri --group-add video"
        ;;
    *)
        echo -e "${RED}Invalid choice. Using CPU only.${NC}"
        GPU_ENV="--env CPU_ONLY=true"
        GPU_EXTRAS=""
        ;;
esac

# Ask for custom ports
read -p "API port (default: $DEFAULT_API_PORT): " API_PORT
API_PORT=${API_PORT:-$DEFAULT_API_PORT}

read -p "Web UI port (default: $DEFAULT_WEB_PORT): " WEB_PORT
WEB_PORT=${WEB_PORT:-$DEFAULT_WEB_PORT}

# Start the container
echo -e "${BLUE}Starting container with the selected options...${NC}"

docker run -d \
    --name $CONTAINER_NAME \
    $GPU_ENV \
    --env WEB_UI=true \
    --env WEB_UI_PORT=$WEB_PORT \
    --env API_PORT=$API_PORT \
    -p $API_PORT:$API_PORT \
    -p $WEB_PORT:$WEB_PORT \
    -v $(pwd)/config:/srbminer/config \
    -v $(pwd)/logs:/var/log \
    -v $(pwd)/backups:/srbminer/backups \
    $GPU_EXTRAS \
    $IMAGE_NAME

# Check if container started successfully
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Container started successfully!${NC}"
    echo -e "${GREEN}Web UI available at: http://localhost:$WEB_PORT${NC}"
    echo -e "${GREEN}API available at: http://localhost:$API_PORT${NC}"
    
    # Ask if user wants to open the Web UI
    read -p "Open Web UI in browser? (y/n): " OPEN_BROWSER
    if [[ $OPEN_BROWSER == "y" || $OPEN_BROWSER == "Y" ]]; then
        xdg-open http://localhost:$WEB_PORT 2>/dev/null || open http://localhost:$WEB_PORT 2>/dev/null || echo -e "${YELLOW}Please open http://localhost:$WEB_PORT in your browser${NC}"
    fi
else
    echo -e "${RED}Failed to start container. Check the error message above.${NC}"
    exit 1
fi

echo -e "${BLUE}===============================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${BLUE}===============================================${NC}"