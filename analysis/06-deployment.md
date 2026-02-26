# Deployment

## Architecture

### Development
```
docker-compose.yml
  ├── db (PostgreSQL 15, port 5432)
  ├── backend (FastAPI/Uvicorn, port 8000, hot-reload)
  └── frontend (Vite dev server, port 5173/15173)
```

### Production
```
docker-compose.prod.yml
  ├── db (PostgreSQL 15)
  ├── backend (FastAPI/Gunicorn)
  └── frontend (Nginx, port 80)
        └── /api/* → proxy → backend:8000
```

## Environment Variables

Copy `.env.example` → `.env` for development.
Copy `.env.production.example` → `.env.production` for production.

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_NAME` | Database name | `northwind` |
| `DB_USER` | DB username | `postgres` |
| `DB_PASSWORD` | DB password | `<strong-password>` |
| `DB_HOST` | DB host (use `db` in Docker) | `db` |
| `DB_PORT` | DB port | `5432` |
| `JWT_SECRET` | JWT signing key (≥32 chars) | `openssl rand -hex 32` |
| `JWT_ALGORITHM` | Token algorithm | `HS256` |
| `JWT_EXPIRATION` | Token TTL in seconds | `86400` |
| `DEBUG` | Enable debug mode | `false` (prod) |
| `CORS_ORIGINS` | Allowed origins | `https://yourdomain.com` |
| `VITE_API_URL` | API URL baked into frontend | `/api/v1` (prod) |
| `FRONTEND_PORT` | Frontend container port | `80` |

## Production Deployment

### 1. Configure Environment

```bash
cp .env.production.example .env.production
# Fill in:
#   DB_PASSWORD (openssl rand -base64 32)
#   JWT_SECRET  (openssl rand -hex 32)
#   CORS_ORIGINS=https://yourdomain.com
#   DEBUG=false
```

### 2. Build and Start

```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Verify

```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
curl http://localhost/api/v1/health
```

### 4. Run Migrations

```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## SSL / TLS

See `docs/deployment.md` for full Nginx SSL configuration examples (Certbot + Let's Encrypt or reverse proxy).

Key points:
- Use `ssl_protocols TLSv1.2 TLSv1.3`
- Add `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options` headers
- Redirect HTTP → HTTPS

## Nginx (Production Frontend)

The frontend container serves the built React SPA via Nginx. Key routing:
- `/api/*` → proxied to `backend:8000`
- `/*` → `index.html` (SPA fallback for React Router)
- Static assets cached with `expires 1y; immutable`

## Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 2 GB | 4 GB+ |
| Storage | 20 GB | 40 GB+ |
| CPU | 1 core | 2+ cores |
| OS | Ubuntu 20.04+ | |
| Docker | 24.0+ | |
| Docker Compose | 2.0+ | |

## Update Procedure

```bash
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Troubleshooting

| Problem | Command |
|---------|---------|
| Services won't start | `docker-compose -f docker-compose.prod.yml logs` |
| DB connection fails | `docker-compose -f docker-compose.prod.yml exec backend env \| grep DB` |
| Frontend not loading | `docker-compose -f docker-compose.prod.yml logs frontend` |
| Check resource usage | `docker stats` |

## Production Security Checklist

- [ ] Strong DB password set
- [ ] JWT secret generated (≥32 chars)
- [ ] SSL/TLS certificates configured
- [ ] `CORS_ORIGINS` restricted to production domain
- [ ] `DEBUG=false`
- [ ] Database not exposed to public internet (no published port 5432)
- [ ] Regular backups configured
- [ ] Security headers in Nginx
- [ ] Firewall: only ports 80, 443, 22 open
- [ ] Regular security updates applied

## Docker Compose — Key Differences

| Setting | Development | Production |
|---------|-------------|-----------|
| Backend server | Uvicorn (hot-reload) | Gunicorn |
| Frontend | Vite dev server | Nginx + built bundle |
| Code mounts | Volume mounts (live reload) | None (immutable image) |
| Debug | `true` | `false` |
| DB port | 5432 exposed | Not exposed |
| Frontend port | 5173 | 80 |
