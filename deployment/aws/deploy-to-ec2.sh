#!/bin/bash
#
# Deploy Circle MCP Server to EC2 Instance
# Target: 54.152.106.177
#

set -e

# Configuration
EC2_HOST="54.152.106.177"
EC2_USER="ec2-user"  # Use "ubuntu" for Ubuntu instances, "ec2-user" for Amazon Linux
SSH_KEY="${SSH_KEY_PATH:-~/.ssh/your-key.pem}"  # Update with your key path

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}======================================"
echo "Circle MCP Server - EC2 Deployment"
echo "Target: $EC2_HOST"
echo "======================================${NC}"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    echo -e "${YELLOW}Set SSH_KEY_PATH environment variable or update the script${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Testing SSH connection...${NC}"
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=5 "${EC2_USER}@${EC2_HOST}" "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${RED}Error: Cannot connect to EC2 instance${NC}"
    echo -e "${YELLOW}Please check:${NC}"
    echo "  1. SSH key path: $SSH_KEY"
    echo "  2. EC2 security group allows SSH (port 22)"
    echo "  3. EC2 instance is running"
    exit 1
fi
echo -e "${GREEN}✓ SSH connection successful${NC}"

echo -e "${YELLOW}Step 2: Checking if repository exists on server...${NC}"
if ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "[ -d ~/circle-mcp ]"; then
    echo -e "${YELLOW}Repository exists. Pulling latest changes...${NC}"
    ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "cd ~/circle-mcp && git pull origin main"
else
    echo -e "${YELLOW}Cloning repository...${NC}"
    ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "git clone https://github.com/YOUR_USERNAME/circle-mcp.git ~/circle-mcp"
fi
echo -e "${GREEN}✓ Code updated${NC}"

echo -e "${YELLOW}Step 3: Checking Docker installation...${NC}"
if ! ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "command -v docker &> /dev/null"; then
    echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
    ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" << 'ENDSSH'
        sudo yum update -y
        sudo yum install docker -y
        sudo service docker start
        sudo usermod -aG docker ec2-user
ENDSSH
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

echo -e "${YELLOW}Step 4: Checking Docker Compose installation...${NC}"
if ! ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "command -v docker-compose &> /dev/null"; then
    echo -e "${YELLOW}Docker Compose not found. Installing...${NC}"
    ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" << 'ENDSSH'
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
ENDSSH
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

echo -e "${YELLOW}Step 5: Checking .env file...${NC}"
if ! ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "[ -f ~/circle-mcp/.env ]"; then
    echo -e "${YELLOW}No .env file found. Please create one manually:${NC}"
    echo -e "${RED}ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST}${NC}"
    echo -e "${RED}cd ~/circle-mcp${NC}"
    echo -e "${RED}nano .env${NC}"
    echo ""
    echo "Required environment variables:"
    echo "  CIRCLE_HEADLESS_TOKEN="
    echo "  CIRCLE_ADMIN_V2_TOKEN="
    echo "  CIRCLE_COMMUNITY_URL="
    echo "  GCP_CLIENT_ID="
    echo "  GCP_CLIENT_SECRET="
    echo "  GCP_REDIRECT_URI=http://$EC2_HOST:3000/auth/google/callback"
    echo ""
    read -p "Press Enter after creating .env file..."
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

echo -e "${YELLOW}Step 6: Building Docker image...${NC}"
ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "cd ~/circle-mcp && docker-compose build"
echo -e "${GREEN}✓ Docker image built${NC}"

echo -e "${YELLOW}Step 7: Starting service...${NC}"
ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "cd ~/circle-mcp && docker-compose down && docker-compose up -d"
echo -e "${GREEN}✓ Service started${NC}"

echo -e "${YELLOW}Step 8: Checking service health...${NC}"
sleep 5
HEALTH_STATUS=$(curl -s "http://$EC2_HOST:3001/health" | grep -o '"status":"[^"]*"' || echo "failed")
if [[ $HEALTH_STATUS == *"healthy"* ]]; then
    echo -e "${GREEN}✓ Service is healthy!${NC}"
else
    echo -e "${RED}✗ Service health check failed${NC}"
    echo -e "${YELLOW}Checking logs:${NC}"
    ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" "cd ~/circle-mcp && docker-compose logs --tail=50"
fi

echo -e "${GREEN}======================================"
echo "Deployment Complete!"
echo "======================================${NC}"
echo -e "${YELLOW}Server URL: http://$EC2_HOST:3001${NC}"
echo -e "${YELLOW}Health Check: http://$EC2_HOST:3001/health${NC}"
echo -e "${YELLOW}API Info: http://$EC2_HOST:3001/api/mcp/info${NC}"
echo ""
echo -e "${YELLOW}Client Configuration:${NC}"
echo '{'
echo '  "mcpServers": {'
echo '    "circle": {'
echo '      "command": "npx",'
echo '      "args": ["-y", "circle-mcp-client"],'
echo '      "env": {'
echo "        \"CIRCLE_MCP_SERVER_URL\": \"http://$EC2_HOST:3001\""
echo '      }'
echo '    }'
echo '  }'
echo '}'
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} 'cd ~/circle-mcp && docker-compose logs -f'"
