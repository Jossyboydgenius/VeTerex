# VeTerex Deployment Guide

## Backend Deployment

### Environment Variables

When deploying the backend to production, you need to configure these environment variables:

```env
# ========== SUPABASE ==========
DATABASE_URL="postgresql://postgres.bpltsawmawuhbyuzhgbp:KISSJ@5H455@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.bpltsawmawuhbyuzhgbp:KISSJ@5H455@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://bpltsawmawuhbyuzhgbp.supabase.co"
SUPABASE_ANON_KEY="sb_publishable_-IgO4vLTQAuEtsjicvrOWQ_CcJxY52J"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwbHRzYXdtYXd1aGJ5dXpoZ2JwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzIwNjIxOSwiZXhwIjoyMDgyNzgyMjE5fQ.t9xqPdOzRqPnpJRQZPfvMnGnqeJcRHo4U47o359taC0"

# ========== VERYCHAT API ==========
VERYAPI_PROJECT_ID="550e8400-e29b-41d4-a716-446655440000"

# ========== APPLICATION ==========
NODE_ENV="production"
PORT=3001
CORS_ORIGIN="https://your-frontend-domain.com"  # ← CHANGE THIS TO YOUR FRONTEND URL
```

### Deployment Platforms

**Option 1: Railway**
1. Create account at railway.app
2. Create new project
3. Connect GitHub repository
4. Add environment variables from above
5. Deploy from `backend/` directory

**Option 2: Render**
1. Create account at render.com
2. Create new Web Service
3. Connect GitHub repository
4. Root directory: `backend`
5. Build command: `pnpm install && pnpm run build`
6. Start command: `pnpm start`
7. Add environment variables

**Option 3: Vercel**
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to `backend/` directory
3. Run `vercel`
4. Add environment variables in Vercel dashboard

## Frontend Deployment

### Update Backend URL

Before deploying frontend, update `.env` with your deployed backend URL:

```env
# Backend API URL (change to deployed URL in production)
VITE_BACKEND_URL=https://your-backend-url.railway.app  # ← CHANGE THIS
```

### Build & Deploy

**Option 1: Vercel (Recommended)**
1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to `frontend/` directory
3. Run `vercel`
4. Follow prompts

**Option 2: Netlify**
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Navigate to `frontend/` directory
3. Build: `pnpm run build`
4. Deploy: `netlify deploy --prod --dir=dist`

**Option 3: GitHub Pages**
```bash
cd frontend
pnpm run build
# Push dist/ to gh-pages branch
```

## Extension Distribution

### Chrome Web Store

1. Build extension:
```bash
cd frontend
pnpm run build:extension
```

2. Zip the extension:
```bash
cd dist-extension
zip -r ../veterex-extension.zip .
```

3. Upload to Chrome Web Store:
   - Go to https://chrome.google.com/webstore/devconsole
   - Create developer account ($5 one-time fee)
   - Upload `veterex-extension.zip`
   - Fill in store listing details
   - Submit for review

### Manual Installation (Testing)

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `/Users/dreytech/Projects/VeTerex/frontend/dist-extension`

## Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Database connected successfully
- [ ] Frontend deployed and accessible
- [ ] Frontend `.env` updated with backend URL
- [ ] Backend CORS configured with frontend URL
- [ ] Test wallet creation in production
- [ ] Test NFT minting in production
- [ ] Test file uploads in production
- [ ] Extension works with production backend
- [ ] All API endpoints responding correctly

## Monitoring

### Backend Health Check
```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-02T...",
  "environment": "production"
}
```

### Frontend Health Check
Visit: `https://your-frontend-url.com`
Should load homepage successfully

## Troubleshooting

### CORS Issues
If you get CORS errors, ensure `backend/.env` has:
```env
CORS_ORIGIN="https://your-exact-frontend-url.com"
```

### Database Connection Issues
Check DATABASE_URL is correct and Supabase project is active

### Extension Not Loading
1. Check Chrome console for errors
2. Verify manifest.json is valid
3. Rebuild extension: `pnpm run build:extension`

## Security Notes

⚠️ **Never commit `.env` files to git!**

- Keep `.env` in `.gitignore`
- Use environment variables in deployment platforms
- Rotate API keys if accidentally exposed
- Use different keys for development vs production

## Support

For issues:
1. Check logs in deployment platform
2. Test API endpoints with curl/Postman
3. Verify environment variables are set correctly
4. Check browser console for frontend errors
