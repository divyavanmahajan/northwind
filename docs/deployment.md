# Deployment Guide

This guide covers deploying the Northwind Web Application to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Database Management](#database-management)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Server Requirements

- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: Minimum 20GB free space
- **CPU**: 2+ cores recommended

### Software Requirements

- Docker 24.0+
- Docker Compose 2.0+
- Git
- (Optional) Nginx for reverse proxy
- (Optional) Certbot for SSL certificates

### Domain & DNS

- Domain name pointing to your server IP
- DNS A record configured

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd northwind-test
```

### 2. Configure Production Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with your production values
nano .env.production
```

**Required environment variables:**

```bash
# Database
DB_NAME=northwind_prod
DB_USER=northwind_user
DB_PASSWORD=<generate-strong-password>

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=<your-generated-secret>

# CORS Origins (your domain)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# API URL
VITE_API_URL=/api/v1
```

### 3. Generate Secrets

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate database password
openssl rand -base64 32
```

## Docker Deployment

### Build and Start Services

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services in detached mode
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Verify Deployment

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Check individual service
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Check health
curl http://localhost/api/v1/health
```

### Database Initialization

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Verify database
docker-compose -f docker-compose.prod.yml exec db psql -U northwind_user -d northwind_prod -c "\dt"
```

## SSL/TLS Configuration

### Option 1: Using Certbot (Let's Encrypt)

#### Install Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

#### Obtain Certificate

```bash
# Stop services temporarily
docker-compose -f docker-compose.prod.yml down

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be in: /etc/letsencrypt/live/yourdomain.com/
```

#### Configure Nginx with SSL

Create `nginx/nginx-ssl.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Update docker-compose.prod.yml

Add SSL certificate volumes to frontend service:

```yaml
frontend:
  # ... existing config ...
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
  ports:
    - "80:80"
    - "443:443"
```

#### Restart Services

```bash
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

### Option 2: Using Reverse Proxy (Recommended)

Use a separate Nginx instance as reverse proxy:

```nginx
# /etc/nginx/sites-available/northwind
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Management

### Backup Database

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U northwind_user northwind_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U northwind_user northwind_prod | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database

```bash
# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U northwind_user northwind_prod < backup.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | docker-compose -f docker-compose.prod.yml exec -T db psql -U northwind_user northwind_prod
```

### Automated Backups

Create a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/northwind-test && docker-compose -f docker-compose.prod.yml exec db pg_dump -U northwind_user northwind_prod | gzip > /backups/northwind_$(date +\%Y\%m\%d).sql.gz
```

## Monitoring

### Check Service Health

```bash
# All services
docker-compose -f docker-compose.prod.yml ps

# Service logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Resource usage
docker stats
```

### Application Logs

```bash
# Backend logs
docker-compose -f docker-compose.prod.yml logs backend -f

# Frontend/Nginx logs
docker-compose -f docker-compose.prod.yml logs frontend -f

# Database logs
docker-compose -f docker-compose.prod.yml logs db -f
```

### Health Endpoints

```bash
# Backend health
curl https://yourdomain.com/api/v1/health

# Frontend health
curl https://yourdomain.com/
```

## Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Clean Up

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused containers
docker container prune
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check specific service
docker-compose -f docker-compose.prod.yml logs backend

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Database Connection Issues

```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps db

# Test connection
docker-compose -f docker-compose.prod.yml exec backend python -c "from app.core.database import engine; engine.connect()"

# Check environment variables
docker-compose -f docker-compose.prod.yml exec backend env | grep DB
```

### Frontend Not Loading

```bash
# Check nginx logs
docker-compose -f docker-compose.prod.yml logs frontend

# Verify build
docker-compose -f docker-compose.prod.yml exec frontend ls -la /usr/share/nginx/html

# Rebuild frontend
docker-compose -f docker-compose.prod.yml build frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase resources in docker-compose.prod.yml
# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

## Security Checklist

- [ ] Strong database password set
- [ ] JWT secret generated and set
- [ ] SSL/TLS certificates configured
- [ ] CORS origins restricted to production domain
- [ ] Debug mode disabled (DEBUG=false)
- [ ] Database not exposed to public internet
- [ ] Regular backups configured
- [ ] Security headers configured in Nginx
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Regular security updates applied

## Support

For issues and questions:
- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Review documentation in `docs/`
- Check GitHub issues
