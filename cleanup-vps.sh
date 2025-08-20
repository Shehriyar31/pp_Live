#!/bin/bash

# VPS Cleanup Script - Remove all site files
echo "🗑️ Starting VPS cleanup..."

# Variables
VPS_IP="168.231.121.18"

# Connect to VPS and cleanup
ssh root@$VPS_IP << 'EOF'
    echo "⚠️ Stopping services..."
    systemctl stop nginx
    pm2 stop all
    pm2 delete all
    
    echo "🗑️ Removing website files..."
    rm -rf /var/www/html/*
    rm -rf /var/www/html/.*
    
    echo "🗑️ Removing backups (optional)..."
    rm -rf /var/backups/old_site_*
    
    echo "🗑️ Removing Node.js packages..."
    rm -rf /root/.npm
    rm -rf /tmp/npm-*
    
    echo "🧹 Cleaning package caches..."
    apt autoremove -y
    apt autoclean
    
    echo "✅ VPS cleanup completed!"
EOF

echo "🎉 All files removed from VPS!"