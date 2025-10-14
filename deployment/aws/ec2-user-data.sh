#!/bin/bash
#
# EC2 User Data Script for Circle MCP Server Deployment
# This script sets up a fresh EC2 instance with Docker and deploys the MCP server
#

set -e

# Update system
echo "Updating system packages..."
yum update -y

# Install Docker
echo "Installing Docker..."
amazon-linux-extras install docker -y
service docker start
usermod -a -G docker ec2-user
chkconfig docker on

# Install Docker Compose
echo "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git
echo "Installing Git..."
yum install git -y

# Clone repository
echo "Cloning Circle MCP repository..."
cd /home/ec2-user
git clone https://github.com/DeepakChander/circle-mcp.git
cd circle-mcp

# Create .env file from environment variables or AWS Systems Manager Parameter Store
echo "Creating .env file..."
cat > .env << EOF
CIRCLE_HEADLESS_TOKEN=${CIRCLE_HEADLESS_TOKEN}
CIRCLE_ADMIN_V2_TOKEN=${CIRCLE_ADMIN_V2_TOKEN}
CIRCLE_COMMUNITY_URL=${CIRCLE_COMMUNITY_URL}
CIRCLE_HEADLESS_BASE_URL=https://app.circle.so
GCP_CLIENT_ID=${GCP_CLIENT_ID}
GCP_CLIENT_SECRET=${GCP_CLIENT_SECRET}
GCP_REDIRECT_URI=${GCP_REDIRECT_URI}
OAUTH_PORT=3000
PORT=3001
HOST=0.0.0.0
LOG_LEVEL=info
READ_ONLY_MODE=false
ALLOWED_ORIGINS=*
NODE_ENV=production
EOF

# Set proper permissions
chown -R ec2-user:ec2-user /home/ec2-user/circle-mcp

# Build and start Docker containers
echo "Building and starting Docker containers..."
docker-compose up -d --build

# Setup log rotation
echo "Setting up log rotation..."
cat > /etc/logrotate.d/circle-mcp << EOF
/home/ec2-user/circle-mcp/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 ec2-user ec2-user
}
EOF

# Setup systemd service for auto-restart
echo "Setting up systemd service..."
cat > /etc/systemd/system/circle-mcp.service << EOF
[Unit]
Description=Circle MCP Server
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ec2-user/circle-mcp
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=ec2-user

[Install]
WantedBy=multi-user.target
EOF

systemctl enable circle-mcp.service

# Install CloudWatch Logs agent (optional)
echo "Installing CloudWatch Logs agent..."
yum install -y awslogs
systemctl start awslogsd
systemctl enable awslogsd.service

echo "======================================"
echo "Circle MCP Server Deployment Complete!"
echo "======================================"
echo "Server is running on port 3001"
echo "Health check: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3001/health"
echo "WebSocket: ws://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3001"
