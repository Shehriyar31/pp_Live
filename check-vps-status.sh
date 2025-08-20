#!/bin/bash

# Check VPS cleanup status
echo "🔍 Checking VPS status..."

VPS_IP="168.231.121.18"

ssh root@$VPS_IP << 'EOF'
    echo "📁 Website directory contents:"
    ls -la /var/www/html/
    echo ""
    
    echo "📊 Disk usage:"
    df -h /var/www/
    echo ""
    
    echo "🔧 Service status:"
    systemctl status nginx --no-pager -l
    pm2 list
    echo ""
    
    echo "🗂️ Backup files:"
    ls -la /var/backups/ | grep old_site || echo "No backups found"
EOF