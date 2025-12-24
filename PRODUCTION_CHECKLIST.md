# Production Deployment Checklist

Use this checklist before going live with your Character Creator deployment.

## Pre-Deployment

### Environment Setup
- [ ] Generated secure JWT_SECRET (64+ characters)
- [ ] Set NODE_ENV=production
- [ ] Configured DATABASE_URL or individual DB credentials
- [ ] Set CORS_ORIGINS to frontend URL (exact match, with https://)
- [ ] Set VITE_API_URL to backend URL (no trailing slash)

### Security
- [ ] JWT_SECRET is unique and not committed to git
- [ ] Database password is strong (16+ characters)
- [ ] All secrets are stored in environment variables, not in code
- [ ] .env files are in .gitignore

### Database
- [ ] PostgreSQL is set up (not SQLite for production)
- [ ] Database migrations have been run
- [ ] Database backups are configured (optional but recommended)

## Deployment

### Railway/Render
- [ ] Backend service created with correct root directory
- [ ] Frontend service created with correct root directory
- [ ] PostgreSQL database provisioned
- [ ] All environment variables set
- [ ] Build and deploy succeeded

### Self-Hosted (VPS)
- [ ] Docker and Docker Compose installed
- [ ] .env file created from .env.example
- [ ] docker-compose build completed
- [ ] docker-compose up -d running
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed (Let's Encrypt)

## Post-Deployment Verification

### API Health
- [ ] `GET /health` returns `{"status":"ok"}`
- [ ] `GET /health/ready` confirms database connection

### Authentication Flow
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens are returned
- [ ] Token refresh works
- [ ] Logout clears tokens

### Core Features
- [ ] Create new character works
- [ ] Edit character works
- [ ] Delete character works
- [ ] Character list loads correctly
- [ ] PDF export generates file
- [ ] JSON export/import works

### Security Checks
- [ ] HTTPS is enforced (no mixed content)
- [ ] API rejects requests from unauthorized origins
- [ ] Password validation is enforced
- [ ] Rate limiting is active

## Optional Enhancements

### Monitoring
- [ ] Application logs are accessible
- [ ] Error tracking service configured (Sentry, etc.)
- [ ] Uptime monitoring set up

### Performance
- [ ] Frontend assets are cached
- [ ] Gzip compression enabled
- [ ] Database connection pooling configured

### Backup & Recovery
- [ ] Database backup schedule configured
- [ ] Tested restore from backup
- [ ] Documented recovery procedures

---

## Quick Commands

### Check Backend Health
```bash
curl https://your-api-url.com/health
```

### View Logs (Railway)
```bash
railway logs
```

### View Logs (Docker)
```bash
docker-compose logs -f backend
```

### Run Migrations (Railway)
```bash
railway run npm run db:migrate
```

### Run Migrations (Docker)
```bash
docker-compose exec backend npm run db:migrate
```

---

**Tip:** Bookmark this checklist and go through it each time you deploy to production!
