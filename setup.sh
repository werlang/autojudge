#!/usr/bin/env bash
set -e

echo "=== AutoJudge Setup ==="

read -p "Node environment (production/development) [production]: " NODE_ENV
NODE_ENV=${NODE_ENV:-production}

read -p "MySQL root password (leave blank to generate): " MYSQL_ROOT_PASSWORD
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-$(openssl rand -hex 16)}
echo "MySQL root password: $MYSQL_ROOT_PASSWORD"

read -p "JWT secret (leave blank to generate): " JWT_SECRET
JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 32)}
echo "JWT secret: $JWT_SECRET"

read -p "Background token (leave blank to generate): " BACKGROUND_TOKEN
BACKGROUND_TOKEN=${BACKGROUND_TOKEN:-$(openssl rand -hex 32)}
echo "Background token: $BACKGROUND_TOKEN"

read -p "Use local contest setup? (yes/no) [yes]: " USE_LOCAL
USE_LOCAL=${USE_LOCAL:-yes}

if [ "$USE_LOCAL" == "yes" ]; then
    # Get all non-loopback IP addresses
    IP_ADDRESSES=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1')
    
    # Display the available IP addresses
    echo "Available IP addresses:"
    IFS=$'\n' IP_ARRAY=($IP_ADDRESSES)
    for i in "${!IP_ARRAY[@]}"; do
        echo "- ${IP_ARRAY[$i]}"
    done
    
    read -p "Enter local server IP address [${IP_ARRAY[0]}]: " LOCAL_SERVER_IP
    LOCAL_SERVER_IP=${LOCAL_SERVER_IP:-${IP_ARRAY[0]}}
else
    LOCAL_SERVER_IP=false
fi

# Warn the user about replacing the .env file
if [ -f .env ]; then
  read -p ".env file already exists. Do you want to replace it? (yes/no) [no]: " REPLACE_ENV
  REPLACE_ENV=${REPLACE_ENV:-no}
  if [ "$REPLACE_ENV" != "yes" ]; then
    echo "Setup aborted. Please backup your .env file and try again."
    exit 1
  fi
fi

# Create a temporary .env file with updated values
cat <<EOF > .env
RESTART_POLICY=unless-stopped
NODE_ENV=$NODE_ENV
URL=autojudge.localhost
API=api.autojudge.localhost
PRODUCTION_DOMAIN=autojudge.io
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_DATABASE=autojudge
MYSQL_PORT=3306
BACKGROUND_TOKEN=$BACKGROUND_TOKEN
LIVE_RELOAD=false
JWT_SECRET=$JWT_SECRET
HASH_LENGTH=6
BACKGROUND_INTERVAL=5000
RUNNER_TIMEOUT=30000
LOCAL_SERVER=$LOCAL_SERVER_IP
GOTENBERG_SERVER=http://gotenberg:3000
EOF

read -p "Do you want to pull the Docker images the judge needs to evaluate submissions? (yes/no) [yes]: " PULL_IMAGES
PULL_IMAGES=${PULL_IMAGES:-yes}

if [ "$PULL_IMAGES" == "yes" ]; then
  echo "Pulling judge images..."
  docker pull gcc:9.5.0
  docker pull node:22
  docker pull php:8.2-cli
  docker pull python:3.11
  docker pull openjdk:24
fi

read -p "Do you want to start the services now? (yes/no) [yes]: " START_SERVICES
START_SERVICES=${START_SERVICES:-yes}

if [ "$START_SERVICES" == "yes" ]; then
    if [ "$USE_LOCAL" == "yes" ]; then
        docker compose -f compose.local.yaml up -d
        echo "Setup complete. The containers are ready. You can access the web interface at http://$LOCAL_SERVER_IP:3000."
    else
        docker compose up -d
        echo "Setup complete. The containers are ready. You can access the web interface at https://localtest.me."
    fi
fi
