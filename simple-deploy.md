# Simple VPS Deployment - No Backup

## Step 1: Connect to VPS
```bash
ssh root@168.231.121.18
```

## Step 2: Delete Old Files
```bash
cd /var/www/html
rm -rf *
rm -rf .*
```

## Step 3: Clone New Repository
```bash
git clone https://github.com/Shehriyar31/pp_site.git .
```

## Step 4: Install Backend
```bash
cd backend
npm install
```

## Step 5: Install & Build Frontend
```bash
cd ..
npm install
npm run build
```

## Step 6: Set Permissions
```bash
chown -R www-data:www-data /var/www/html
```

## Step 7: Restart Services
```bash
systemctl restart nginx
pm2 restart all
```

Done! Site live at https://profitspro.click