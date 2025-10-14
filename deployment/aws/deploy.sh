#!/bin/bash
#
# AWS Deployment Script for Circle MCP Server
# This script automates the deployment process to AWS
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
ECR_REPOSITORY="circle-mcp-server"
CLUSTER_NAME="${ECS_CLUSTER_NAME:-circle-mcp-cluster}"
SERVICE_NAME="${ECS_SERVICE_NAME:-circle-mcp-service}"
TASK_DEFINITION="circle-mcp-server"

echo -e "${GREEN}======================================"
echo "Circle MCP Server - AWS Deployment"
echo "======================================${NC}"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${YELLOW}AWS_ACCOUNT_ID not set. Attempting to retrieve...${NC}"
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo -e "${GREEN}AWS Account ID: $AWS_ACCOUNT_ID${NC}"
fi

# Login to ECR
echo -e "${YELLOW}Logging in to Amazon ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repository if it doesn't exist
echo -e "${YELLOW}Checking ECR repository...${NC}"
if ! aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION > /dev/null 2>&1; then
    echo -e "${YELLOW}Creating ECR repository...${NC}"
    aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION
fi

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
cd ../..
docker build -t $ECR_REPOSITORY:latest .

# Tag and push to ECR
echo -e "${YELLOW}Pushing image to ECR...${NC}"
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest"
docker tag $ECR_REPOSITORY:latest $ECR_URI
docker push $ECR_URI

echo -e "${GREEN}Docker image pushed successfully!${NC}"
echo -e "Image URI: ${ECR_URI}"

# Register task definition (if using ECS)
if [ "$DEPLOYMENT_TYPE" == "ecs" ]; then
    echo -e "${YELLOW}Registering ECS task definition...${NC}"

    # Update task definition with actual values
    sed -e "s|YOUR_ACCOUNT_ID|$AWS_ACCOUNT_ID|g" \
        -e "s|YOUR_ECR_REPOSITORY_URL|$ECR_URI|g" \
        -e "s|REGION|$AWS_REGION|g" \
        deployment/aws/ecs-task-definition.json > /tmp/task-definition.json

    aws ecs register-task-definition \
        --cli-input-json file:///tmp/task-definition.json \
        --region $AWS_REGION

    # Update service
    echo -e "${YELLOW}Updating ECS service...${NC}"
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $TASK_DEFINITION \
        --force-new-deployment \
        --region $AWS_REGION

    echo -e "${GREEN}ECS service updated successfully!${NC}"
fi

echo -e "${GREEN}======================================"
echo "Deployment Complete!"
echo "======================================${NC}"
echo -e "${YELLOW}Note: It may take a few minutes for the service to stabilize${NC}"
echo -e "${YELLOW}Check service status with:${NC}"
echo -e "  aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION"
