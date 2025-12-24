# Deployment Guide

This guide walks you through deploying the Character Creator application. We'll use **Railway.app** for the easiest experience, but alternatives are also covered.

## Table of Contents

1. [Quick Start with Railway](#quick-start-with-railway)
2. [Alternative: Render.com](#alternative-rendercom)
3. [Alternative: Docker on VPS](#alternative-docker-on-vps)
4. [Environment Variables Reference](#environment-variables-reference)
5. [Post-Deployment Checklist](#post-deployment-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start with Railway

Railway is the easiest option for beginners. It offers:
- Automatic deployments from GitHub
- Built-in PostgreSQL database
- Free tier for small projects (~$5/month for production)

### Step 1: Create a Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign in with your GitHub account

### Step 2: Deploy the Backend

1. Click "New Project" → "Deploy from GitHub repo"
2. Select your `character-creator` repository
3. Railway will detect it's a Node.js project

4. **Configure the Backend Service:**
   - Click on the service → "Settings"
   - Set **Root Directory**: `packages/backend`
   - Set **Build Command**: `npm run build`
   - Set **Start Command**: `npm start`

5. **Add PostgreSQL Database:**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway automatically creates `DATABASE_URL` variable

6. **Set Environment Variables** (click "Variables" tab):
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=<generate-a-64-character-random-string>
   JWT_EXPIRE=15m
   JWT_REFRESH_EXPIRE=7d
   USE_SQLITE=false
   ```

   **To generate a secure JWT_SECRET**, run this in your terminal:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

7. Click "Deploy" and wait for it to complete

8. Note your backend URL (e.g., `https://character-creator-backend.up.railway.app`)

### Step 3: Deploy the Frontend

1. In the same Railway project, click "New" → "Deploy from GitHub repo"
2. Select your `character-creator` repository again

3. **Configure the Frontend Service:**
   - Click on the service → "Settings"
   - Set **Root Directory**: `packages/frontend`
   - Set **Build Command**: `npm run build`
   - Set **Start Command**: `npx serve dist -s -l 3000`

4. **Set Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url.up.railway.app
   ```
   (Replace with your actual backend URL from Step 2)

5. Click "Deploy"

### Step 4: Configure CORS

Go back to your **Backend** service and add:
```
CORS_ORIGINS=https://your-frontend-url.up.railway.app
```

Redeploy the backend.

### Step 5: Run Database Migrations

1. In Railway, go to your Backend service
2. Click "Settings" → "Deploy" section
3. Add a **Deploy Command** (runs after build):
   ```
   npm run db:migrate
   ```

Or run it manually via Railway CLI:
```bash
railway run npm run db:migrate
```

---

## Alternative: Render.com

Render is similar to Railway with a generous free tier.

### Backend Setup

1. Go to [render.com](https://render.com) and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub repository

4. Configure:
   - **Name**: `character-creator-api`
   - **Root Directory**: `packages/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

5. Add Environment Variables (same as Railway)

6. Click "Create Web Service"

### Frontend Setup

1. Click "New" → "Static Site"
2. Connect the same repository

3. Configure:
   - **Name**: `character-creator-web`
   - **Root Directory**: `packages/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

### Database Setup

1. Click "New" → "PostgreSQL"
2. Copy the **Internal Database URL**
3. Add it to your backend as `DATABASE_URL`

---

## Alternative: Docker on VPS

For more control, deploy to a VPS (DigitalOcean, Linode, AWS EC2).

### Prerequisites

- A VPS with Docker and Docker Compose installed
- A domain name (optional but recommended)

### Step 1: Clone Repository

```bash
ssh your-server
git clone https://github.com/jsking74/character-creator.git
cd character-creator
```

### Step 2: Create Production Environment

```bash
cp .env.example .env
nano .env
```

Fill in your production values:
```env
# Database
DB_USER=character_creator
DB_PASSWORD=<secure-password>
DB_NAME=character_creator_db

# JWT (generate secure secrets!)
JWT_SECRET=<64-character-random-string>
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# URLs
CORS_ORIGINS=https://your-domain.com
VITE_API_URL=https://api.your-domain.com
```

### Step 3: Build and Run

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend npm run db:migrate

# Seed initial data (optional)
docker-compose exec backend npm run db:seed
```

### Step 4: Set Up Reverse Proxy (Nginx)

Install Nginx and configure:

```nginx
# /etc/nginx/sites-available/character-creator

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 5: Add SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

---

## Environment Variables Reference

### Backend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | Yes | Server port | `5000` |
| `JWT_SECRET` | Yes | Secret for signing tokens (64+ chars) | `abc123...` |
| `JWT_EXPIRE` | No | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRE` | No | Refresh token expiry | `7d` |
| `USE_SQLITE` | No | Use SQLite instead of PostgreSQL | `false` |
| `DATABASE_URL` | If PostgreSQL | Full database connection string | `postgresql://...` |
| `DB_HOST` | If PostgreSQL | Database host | `localhost` |
| `DB_PORT` | If PostgreSQL | Database port | `5432` |
| `DB_USER` | If PostgreSQL | Database username | `postgres` |
| `DB_PASSWORD` | If PostgreSQL | Database password | `secret` |
| `DB_NAME` | If PostgreSQL | Database name | `character_creator` |
| `CORS_ORIGINS` | Yes | Allowed frontend origins | `https://your-domain.com` |
| `LOG_LEVEL` | No | Logging verbosity | `info` |

### Frontend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API URL | `https://api.your-domain.com` |

---

## Post-Deployment Checklist

After deploying, verify everything works:

### 1. Health Checks
```bash
# Backend health
curl https://your-api-url.com/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### 2. Database Connection
```bash
# Check database is connected
curl https://your-api-url.com/health/ready
```

### 3. Test Authentication
1. Open your frontend URL
2. Register a new account
3. Log in
4. Create a character
5. Log out and log back in

### 4. Test Core Features
- [ ] User registration works
- [ ] User login works
- [ ] Character creation works
- [ ] Character editing works
- [ ] Character deletion works
- [ ] PDF export works
- [ ] JSON export/import works
- [ ] Share links work

### 5. Security Verification
- [ ] HTTPS is working (no mixed content warnings)
- [ ] API only accepts requests from your frontend domain
- [ ] JWT tokens expire correctly
- [ ] Passwords are hashed (check database)

---

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` or individual DB variables are set correctly
- Ensure the database server is running
- Check if firewall allows connections on port 5432

### "CORS error" in browser console
- Verify `CORS_ORIGINS` includes your frontend URL exactly
- Include protocol (https://) but no trailing slash
- Redeploy backend after changing CORS settings

### "JWT token invalid"
- Ensure `JWT_SECRET` is the same across all backend instances
- Check the secret is at least 32 characters
- Clear browser cookies and try again

### Build fails on Railway/Render
- Check the build logs for specific errors
- Ensure `Root Directory` is set correctly
- Try running `npm run build` locally first

### "Module not found" errors
- Run `npm install` before building
- Check that all dependencies are in `package.json`
- Delete `node_modules` and reinstall

### Frontend shows blank page
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Ensure the API is accessible from the browser

---

## Updating Your Deployment

### Railway/Render (Automatic)
Push to your main branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
```
Deployment happens automatically.

### Docker/VPS (Manual)
```bash
cd character-creator
git pull origin main
docker-compose build
docker-compose up -d
docker-compose exec backend npm run db:migrate
```

---

## Cost Estimates

| Platform | Free Tier | Production |
|----------|-----------|------------|
| Railway | 500 hours/month | ~$5-20/month |
| Render | 750 hours/month | ~$7-25/month |
| DigitalOcean Droplet | None | $6-12/month |
| AWS EC2 t3.micro | 750 hours (first year) | ~$10-15/month |

---

## Need Help?

- Check the [GitHub Issues](https://github.com/jsking74/character-creator/issues)
- Review the [Development Guide](./DEVELOPMENT.md)
- Read the [Design Document](./DESIGN.md)
