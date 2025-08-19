# VPS Deployment Guide

## Manual Steps (if script doesn't work):

### 1. Connect to VPS
```bash
ssh root@168.231.121.18
```

### 2. Backup and Remove Old Files
```bash
# Create backup
mkdir -p /var/backups
cp -r /var/www/html /var/backups/old_site_$(date +%Y%m%d_%H%M%S)

# Remove old files
rm -rf /var/www/html/*
```

### 3. Clone New Repository
```bash
cd /var/www/html
git clone https://github.com/Shehriyar31/pp_site.git .
```

### 4. Setup Backend
```bash
cd /var/www/html/backend
npm install
```

### 5. Build Frontend
```bash
cd /var/www/html
npm install
npm run build
```

### 6. Set Permissions
```bash
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html
```

### 7. Configure Environment
```bash
# Copy your .env file to backend directory
cp /var/backups/old_site_*/backend/.env /var/www/html/backend/
```

### 8. Restart Services
```bash
systemctl restart nginx
pm2 restart all
```

## Important Files to Check:
- `/etc/nginx/sites-available/profitspro.click`
- `/var/www/html/backend/.env`
- PM2 process list: `pm2 list`

## Verify Deployment:
- Frontend: https://profitspro.click
- Backend API: https://profitspro.click/api (or your API endpoint)