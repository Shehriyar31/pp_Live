#!/bin/bash

# Complete VPS Setup and Deployment
echo "🚀 Starting VPS setup and deployment..."

VPS_IP="168.231.121.18"
DOMAIN="profitspro.click"
REPO_URL="https://github.com/Shehriyar31/pp_Live.git"

ssh root@$VPS_IP << 'EOF'
    echo "📦 Updating system..."
    apt update
    apt upgrade -y
    
    echo "🔧 Installing required packages..."
    apt install -y nginx nodejs npm git curl
    
    echo "📁 Creating directories..."
    mkdir -p /var/www/html
    
    echo "📥 Cloning repository..."
    cd /var/www
    git clone https://github.com/Shehriyar31/pp_Live.git temp_repo
    mv temp_repo/* html/
    mv temp_repo/.* html/ 2>/dev/null || true
    rm -rf temp_repo
    
    echo "📦 Installing dependencies..."
    cd /var/www/html
    npm install
    npm run build
    
    echo "📁 Setting permissions..."
    chown -R www-data:www-data /var/www/html
    chmod -R 755 /var/www/html
    
    echo "🔧 Starting services..."
    systemctl enable nginx
    systemctl start nginx
    
    echo "✅ Deployment completed!"
EOF

echo "🎉 Setup and deployment finished!"
echo "🌐 Check: http://profitspro.click"