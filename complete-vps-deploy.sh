#!/bin/bash

# Complete Full-Stack Deployment for ProfitsPro
echo "🚀 Starting complete VPS deployment..."

VPS_IP="168.231.121.18"
DOMAIN="profitspro.click"
REPO_URL="https://github.com/Shehriyar31/pp_Live.git"

ssh root@$VPS_IP << 'EOF'
    echo "📦 System update..."
    apt update && apt upgrade -y
    
    echo "🔧 Installing packages..."
    apt install -y nginx nodejs npm git curl mongodb-server
    
    echo "📁 Setup directories..."
    mkdir -p /var/www/html
    rm -rf /var/www/html/*
    
    echo "📥 Clone repository..."
    cd /var/www
    git clone https://github.com/Shehriyar31/pp_Live.git temp_repo
    cp -r temp_repo/* html/
    cp -r temp_repo/.* html/ 2>/dev/null || true
    rm -rf temp_repo
    
    echo "🎨 Build frontend..."
    cd /var/www/html
    npm install
    npm run build
    
    echo "⚙️ Setup backend..."
    cd /var/www/html/backend
    npm install
    
    echo "🗄️ Start MongoDB..."
    systemctl enable mongodb
    systemctl start mongodb
    
    echo "🚀 Start backend with PM2..."
    npm install -g pm2
    pm2 start server.js --name "profitspro-backend"
    pm2 startup
    pm2 save
    
    echo "🌐 Configure Nginx..."
    cat > /etc/nginx/sites-available/profitspro.click << 'NGINX_EOF'
server {
    listen 80;
    server_name profitspro.click www.profitspro.click;
    root /var/www/html/dist;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

    ln -sf /etc/nginx/sites-available/profitspro.click /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    echo "📁 Set permissions..."
    chown -R www-data:www-data /var/www/html
    chmod -R 755 /var/www/html
    
    echo "🔄 Start services..."
    nginx -t
    systemctl enable nginx
    systemctl restart nginx
    
    echo "✅ Deployment completed!"
    echo "🌐 Frontend: http://profitspro.click"
    echo "🔌 Backend: http://profitspro.click/api"
    
    pm2 status
    systemctl status nginx --no-pager
EOF

echo "🎉 Complete deployment finished!"