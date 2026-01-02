# Backend Deployment Guide

This guide covers deploying the VeTerex backend to various platforms.

## Prerequisites

- Node.js 18+ installed locally
- pnpm package manager
- Supabase account with configured database
- Git repository (GitHub recommended)

## Environment Variables

Your backend requires these environment variables:

```env
# Database
DATABASE_URL="postgresql://postgres.xxx:password@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:password@xxx.pooler.supabase.com:5432/postgres"

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# VeryChat
VERYAPI_PROJECT_ID="your_project_id"

# Application
NODE_ENV="production"
PORT=3001
CORS_ORIGIN="https://your-frontend-domain.vercel.app"
```

---

## Option 1: Vercel (Recommended - Same as Frontend)

### Pros
- Free tier available
- Automatic deployments from Git
- Built-in environment variable management
- Same platform as your frontend
- Automatic HTTPS

### Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Backend Directory**
   ```bash
   cd backend
   vercel
   ```

4. **Configure Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all environment variables from your `.env` file
   - Make sure to set `NODE_ENV=production`
   - Set `CORS_ORIGIN` to your Vercel frontend URL

5. **Update `vercel.json`** (create if not exists):
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/server.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/server.ts"
       }
     ]
   }
   ```

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

7. **Update Frontend Environment**
   - In your frontend `.env` or Vercel env vars:
   ```env
   VITE_BACKEND_URL=https://your-backend.vercel.app
   ```

---

## Option 2: Railway.app

### Pros
- Free tier: $5 credit/month
- PostgreSQL database included
- Simple deployment
- Automatic HTTPS

### Steps

1. **Sign up at** [Railway.app](https://railway.app)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your VeTerex repository
   - Select the `backend` folder as root

3. **Configure Environment Variables**
   - Go to Variables tab
   - Add all variables from `.env`

4. **Deploy**
   - Railway will automatically build and deploy
   - Get your public URL from Settings → Domains

5. **Update Frontend**
   ```env
   VITE_BACKEND_URL=https://your-app.railway.app
   ```

---

## Option 3: Render.com

### Pros
- Free tier available
- Automatic deployments
- Managed PostgreSQL option

### Steps

1. **Sign up at** [Render.com](https://render.com)

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Root Directory: `backend`
   - Build Command: `pnpm install && pnpm run build`
   - Start Command: `pnpm start`

3. **Environment Variables**
   - Add all variables in Environment section

4. **Deploy**
   - Render will build and deploy automatically

---

## Option 4: Heroku

### Pros
- Mature platform
- Easy to use
- Good documentation

### Steps

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   cd backend
   heroku create your-app-name
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set DATABASE_URL="your_value"
   heroku config:set SUPABASE_URL="your_value"
   # ... set all variables
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

---

## Post-Deployment Checklist

### 1. Test Backend API
```bash
curl https://your-backend-url.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-01-02T...",
  "environment": "production"
}
```

### 2. Test Database Connection
```bash
curl https://your-backend-url.com/api
```

### 3. Update Frontend Environment Variables

In your Vercel frontend project:
```env
VITE_BACKEND_URL=https://your-backend-url.com
```

Redeploy frontend:
```bash
cd frontend
vercel --prod
```

### 4. Test Profile Upload

1. Login to your deployed frontend
2. Go to Profile page
3. Upload an image
4. Check if it appears in header dropdown
5. Verify in Supabase Storage that file was uploaded

### 5. Update CORS

Make sure your backend `.env` has:
```env
CORS_ORIGIN=https://your-frontend.vercel.app
```

Or for multiple origins:
```typescript
// In server.ts
app.use(cors({
  origin: [
    "https://your-frontend.vercel.app",
    "chrome-extension://your-extension-id"
  ],
  credentials: true
}));
```

---

## Troubleshooting

### "Can't reach database"
- Check DATABASE_URL and DIRECT_URL are correct
- Verify Supabase allows connections from your hosting provider
- Check if DATABASE_URL includes `?pgbouncer=true`

### "CORS Error"
- Update CORS_ORIGIN in backend
- Redeploy backend
- Clear browser cache

### "File upload fails"
- Check SUPABASE_SERVICE_ROLE_KEY is set correctly
- Verify storage bucket `profile-images` exists and is public
- Check file size limits in server.ts multer config

### "Backend not responding"
- Check logs in your hosting dashboard
- Verify all environment variables are set
- Test /health endpoint
- Check if port is correct (most platforms assign dynamically)

---

## Monitoring

### Check Logs
- **Vercel**: Dashboard → Deployments → View Logs
- **Railway**: Dashboard → Deployments → Logs
- **Render**: Dashboard → Logs
- **Heroku**: `heroku logs --tail`

### Monitor Uptime
Consider adding:
- [UptimeRobot](https://uptimerobot.com) - Free monitoring
- [Better Uptime](https://betteruptime.com) - Free tier
- Vercel Analytics (built-in)

---

## Cost Estimates

| Platform | Free Tier | Paid Starting |
|----------|-----------|---------------|
| Vercel | 100GB bandwidth/month | $20/month |
| Railway | $5 credit/month | $5/month pay-as-you-go |
| Render | 750 hours/month | $7/month |
| Heroku | Limited free dynos | $7/month |

**Recommendation**: Start with **Vercel** since you're already using it for frontend. Easy to manage both in one place!

---

## Next Steps After Deployment

1. ✅ Test all API endpoints
2. ✅ Upload profile images from both web and extension
3. ✅ Monitor error logs for first 24 hours
4. ✅ Set up error monitoring (optional: Sentry)
5. ✅ Configure custom domain (optional)

Need help? Check the logs and error messages - they're usually very descriptive!
