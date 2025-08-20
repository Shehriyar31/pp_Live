#!/bin/bash

# Direct deployment without temp folder
echo "🚀 Direct deployment..."

VPS_IP="168.231.121.18"

ssh root@$VPS_IP << 'EOF'
    echo "📦 System update..."
    apt update && apt upgrade -y
    apt install -y nginx nodejs npm git curl
    
    echo "📥 Direct clone to html..."
    rm -rf /var/www/html
    cd /var/www
    git clone https://github.com/Shehriyar31/pp_Live.git html
    
    echo "🎨 Build frontend..."
    cd /var/www/html
    npm install
    npm run build
    
    echo "⚙️ Setup backend..."
    cd backend
    npm install
    
    echo "🚀 Start backend..."
    npm install -g pm2
    pm2 start server.js --name "profitspro-backend"
    
    echo "🔄 Start nginx..."
    systemctl enable nginx
    systemctl start nginx
    
    echo "✅ Done!"
EOF