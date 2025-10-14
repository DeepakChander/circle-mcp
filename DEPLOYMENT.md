# Circle MCP Server - AWS Deployment Guide

Complete guide for deploying Circle MCP Server to AWS for public access.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Deployment Options](#deployment-options)
- [Prerequisites](#prerequisites)
- [Option 1: AWS EC2 Deployment](#option-1-aws-ec2-deployment)
- [Option 2: AWS ECS (Fargate) Deployment](#option-2-aws-ecs-fargate-deployment)
- [Option 3: Docker Compose (Any Server)](#option-3-docker-compose-any-server)
- [Environment Configuration](#environment-configuration)
- [Security Best Practices](#security-best-practices)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide helps you deploy the Circle MCP Server to AWS, making it accessible via HTTP/WebSocket for remote MCP clients.

### Architecture

```
Internet
    ↓
Load Balancer (optional)
    ↓
EC2/ECS Instance
    ↓
Docker Container (Circle MCP Server)
    ├── HTTP API (Port 3001)
    ├── WebSocket (Port 3001)
    └── Health Check (/health)
```

---

## Deployment Options

| Option | Best For | Complexity | Cost |
|--------|----------|------------|------|
| **EC2** | Simple setups, full control | Low | ~$15-30/month |
| **ECS Fargate** | Scalable, managed | Medium | ~$20-40/month |
| **Docker Compose** | Existing servers | Very Low | Varies |

---

## Prerequisites

### 1. AWS Account Setup
- Active AWS account
- AWS CLI installed and configured
- IAM user with appropriate permissions

### 2. Required Credentials
- Circle.so headless token
- Circle.so admin V2 token
- Google Cloud Platform OAuth credentials
- Circle community URL

### 3. Tools
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure

# Install Docker (if deploying locally first)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

---

## Option 1: AWS EC2 Deployment

### Step 1: Launch EC2 Instance

1. **Go to EC2 Console**
   - https://console.aws.amazon.com/ec2/

2. **Launch Instance**
   - **AMI**: Amazon Linux 2023
   - **Instance Type**: t3.small (minimum)
   - **Key Pair**: Create/select for SSH access
   - **Security Group**:
     - Port 22 (SSH) - Your IP only
     - Port 3001 (HTTP/WebSocket) - 0.0.0.0/0 (or specific IPs)
     - Port 80/443 (if using Nginx) - 0.0.0.0/0

3. **Advanced Details - User Data**
   ```bash
   #!/bin/bash
   # Set environment variables before running
   export CIRCLE_HEADLESS_TOKEN="your_token"
   export CIRCLE_ADMIN_V2_TOKEN="your_admin_token"
   export CIRCLE_COMMUNITY_URL="https://learn.1to10x.ai"
   export GCP_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   export GCP_CLIENT_SECRET="GOCSPX-your-secret"
   export GCP_REDIRECT_URI="http://YOUR_PUBLIC_IP:3000/auth/google/callback"

   # Run deployment script
   curl -fsSL https://raw.githubusercontent.com/DeepakChander/circle-mcp/main/deployment/aws/ec2-user-data.sh | bash
   ```

4. **Launch** and wait for instance to be ready (~5 minutes)

### Step 2: Verify Deployment

```bash
# SSH into instance
ssh -i your-key.pem ec2-user@YOUR_PUBLIC_IP

# Check Docker status
sudo docker ps

# Check logs
sudo docker logs circle-mcp-server

# Test health endpoint
curl http://localhost:3001/health
```

### Step 3: Access Your MCP Server

```bash
# HTTP API
curl http://YOUR_PUBLIC_IP:3001/api/mcp/info

# WebSocket (from client)
ws://YOUR_PUBLIC_IP:3001
```

---

## Option 2: AWS ECS (Fargate) Deployment

### Step 1: Setup ECR Repository

```bash
# Set variables
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create ECR repository
aws ecr create-repository \
    --repository-name circle-mcp-server \
    --region $AWS_REGION

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
```

### Step 2: Build and Push Docker Image

```bash
# Clone repository
git clone https://github.com/DeepakChander/circle-mcp.git
cd circle-mcp

# Build image
docker build -t circle-mcp-server .

# Tag for ECR
docker tag circle-mcp-server:latest \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/circle-mcp-server:latest

# Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/circle-mcp-server:latest
```

### Step 3: Store Secrets in AWS Secrets Manager

```bash
# Create secrets
aws secretsmanager create-secret \
    --name circle-mcp/headless-token \
    --secret-string "your_headless_token" \
    --region $AWS_REGION

aws secretsmanager create-secret \
    --name circle-mcp/admin-token \
    --secret-string "your_admin_token" \
    --region $AWS_REGION

# ... create other secrets similarly
```

### Step 4: Create ECS Cluster

```bash
aws ecs create-cluster \
    --cluster-name circle-mcp-cluster \
    --region $AWS_REGION
```

### Step 5: Register Task Definition

```bash
# Update deployment/aws/ecs-task-definition.json with your values
# Then register it
aws ecs register-task-definition \
    --cli-input-json file://deployment/aws/ecs-task-definition.json \
    --region $AWS_REGION
```

### Step 6: Create ECS Service

```bash
# Create service
aws ecs create-service \
    --cluster circle-mcp-cluster \
    --service-name circle-mcp-service \
    --task-definition circle-mcp-server \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
    --region $AWS_REGION
```

### Step 7: Setup Application Load Balancer (Optional but Recommended)

```bash
# Create ALB
aws elbv2 create-load-balancer \
    --name circle-mcp-alb \
    --subnets subnet-xxxxx subnet-yyyyy \
    --security-groups sg-xxxxx \
    --region $AWS_REGION

# Create target group
aws elbv2 create-target-group \
    --name circle-mcp-targets \
    --protocol HTTP \
    --port 3001 \
    --vpc-id vpc-xxxxx \
    --target-type ip \
    --health-check-path /health \
    --region $AWS_REGION

# Register targets and configure listeners...
```

---

## Option 3: Docker Compose (Any Server)

### Step 1: Setup Server

```bash
# SSH into your server
ssh user@your-server.com

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 2: Deploy Application

```bash
# Clone repository
git clone https://github.com/DeepakChander/circle-mcp.git
cd circle-mcp

# Create .env file
cp .env.production .env
nano .env  # Edit with your credentials

# Start services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f circle-mcp
```

### Step 3: Setup Reverse Proxy (Nginx)

```bash
# If using the built-in nginx service
docker-compose up -d nginx

# Access via:
# HTTP: http://your-server.com
# WebSocket: ws://your-server.com/ws
```

---

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CIRCLE_HEADLESS_TOKEN` | Circle API headless token | `abc123...` |
| `CIRCLE_ADMIN_V2_TOKEN` | Circle admin V2 token | `xyz789...` |
| `CIRCLE_COMMUNITY_URL` | Your Circle community URL | `https://learn.1to10x.ai` |
| `GCP_CLIENT_ID` | Google OAuth client ID | `123-abc.apps.googleusercontent.com` |
| `GCP_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-abc123` |
| `GCP_REDIRECT_URI` | OAuth redirect URI | `http://your-ip:3000/auth/google/callback` |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP server port |
| `HOST` | `0.0.0.0` | Server bind address |
| `LOG_LEVEL` | `info` | Logging level |
| `ALLOWED_ORIGINS` | `*` | CORS allowed origins |
| `NODE_ENV` | `production` | Node environment |

---

## Security Best Practices

### 1. Use HTTPS

```bash
# Install certbot for Let's Encrypt
sudo snap install --classic certbot

# Get certificate
sudo certbot --nginx -d your-domain.com
```

### 2. Restrict Security Group

```bash
# Allow only specific IPs if possible
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxx \
    --protocol tcp \
    --port 3001 \
    --cidr YOUR_IP/32
```

### 3. Use AWS Secrets Manager

Store all sensitive data in AWS Secrets Manager instead of environment variables.

### 4. Enable CloudWatch Logs

Monitor application logs in real-time:
```bash
aws logs tail /ecs/circle-mcp-server --follow
```

### 5. Regular Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Monitoring & Logging

### CloudWatch Logs

```bash
# View logs
aws logs tail /ecs/circle-mcp-server --follow --region $AWS_REGION

# Search logs
aws logs filter-log-events \
    --log-group-name /ecs/circle-mcp-server \
    --filter-pattern "ERROR" \
    --region $AWS_REGION
```

### Health Checks

```bash
# Manual health check
curl http://YOUR_SERVER:3001/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-10-14T...",
#   "version": "1.0.0"
# }
```

### Metrics Dashboard

Create CloudWatch dashboard for:
- CPU utilization
- Memory usage
- Request count
- Error rate
- Response time

---

## Troubleshooting

### Issue: Container won't start

```bash
# Check logs
docker logs circle-mcp-server

# Common issues:
# 1. Missing environment variables
# 2. Port already in use
# 3. Invalid credentials
```

### Issue: Can't connect to WebSocket

```bash
# Check firewall/security group
# Ensure port 3001 is open

# Test connectivity
telnet YOUR_SERVER 3001
```

### Issue: OAuth redirect fails

```bash
# Update GCP_REDIRECT_URI to match your public URL
# Example: http://YOUR_PUBLIC_IP:3000/auth/google/callback
```

### Issue: High memory usage

```bash
# Increase instance size or container memory
# Monitor with:
docker stats circle-mcp-server
```

---

## Cost Estimation

### EC2 (t3.small)
- Instance: ~$15/month
- Storage: ~$2/month
- Data transfer: ~$5/month
- **Total: ~$22/month**

### ECS Fargate
- vCPU: ~$15/month
- Memory: ~$10/month
- Data transfer: ~$5/month
- **Total: ~$30/month**

---

## Next Steps

1. ✅ Deploy to AWS
2. ✅ Configure domain name
3. ✅ Setup HTTPS/SSL
4. ✅ Configure monitoring
5. ✅ Setup auto-scaling (for ECS)
6. ✅ Configure backups
7. ✅ Test with MCP clients

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/DeepakChander/circle-mcp/issues
- Documentation: https://github.com/DeepakChander/circle-mcp

---

**🎉 Your Circle MCP Server is now deployed and accessible to anyone!**
