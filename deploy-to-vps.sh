#!/bin/bash

# VPS Deployment Script for ProfitsPro
# Replace old code with new GitHub repository

echo "🚀 Starting deployment to VPS..."

# Variables
VPS_IP="168.231.121.18"
DOMAIN="profitspro.click"
REPO_URL="https://github.com/Shehriyar31/pp_Live.git"
PROJECT_DIR="/var/www/html"
BACKUP_DIR="/var/backups/old_site_$(date +%Y%m%d_%H%M%S)"

# Connect to VPS and deploy
ssh root@$VPS_IP << 'EOF'
    echo "📦 Creating backup of old files..."
    mkdir -p /var/backups
    cp -r /var/www/html /var/backups/old_site_$(date +%Y%m%d_%H%M%S)
    
    echo "🗑️ Removing old files..."
    rm -rf /var/www/html/*
    
    echo "📥 Cloning new repository..."
    cd /var/www
    git clone https://github.com/Shehriyar31/pp_Live.git temp_repo
    mv temp_repo/* html/
    mv temp_repo/.* html/ 2>/dev/null || true
    rm -rf temp_repo
    
    echo "🔧 Setting up backend..."
    cd /var/www/html/backend
    npm install
    
    echo "🎨 Building frontend..."
    cd /var/www/html
    npm install
    npm run build
    
    echo "📁 Setting permissions..."
    chown -R www-data:www-data /var/www/html
    chmod -R 755 /var/www/html
    
    echo "🔄 Restarting services..."
    systemctl restart nginx
    systemctl restart pm2 || pm2 restart all
    
    echo "✅ Deployment completed!"
EOF

echo "🎉 Deployment script executed!"
echo "🌐 Your site should be live at: https://profitspro.click"