# VeTerex Database Setup Guide

## Database Connection Error Fix

If you're seeing the error:
```
Can't reach database server at `aws-0-us-east-1.pooler.supabase.com:6543`
```

This means your `.env` file is missing or has incorrect database credentials.

## Step 1: Create .env file

Copy the example file:
```bash
cd backend
cp .env.example .env
```

## Step 2: Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project or create a new one
3. Go to **Settings** > **Database**
4. Find **Connection String** section
5. Copy the **Connection pooling** URL (for DATABASE_URL)
6. Copy the **Direct connection** URL (for DIRECT_URL)

## Step 3: Update .env file

Edit `backend/.env`:

```dotenv
# ========== SUPABASE ==========
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://[YOUR-PROJECT-ID].supabase.co"
SUPABASE_ANON_KEY="your_anon_key_here"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# ========== VERYCHAT API ==========
VERYAPI_PROJECT_ID="your_project_id_here"

# ========== APPLICATION ==========
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

## Step 4: Run Database Migrations

```bash
cd backend
pnpm run prisma:push
```

This will:
- Create all tables (User, Wallet, Transaction, Media)
- Set up relationships
- Create indexes

## Step 5: Generate Prisma Client

```bash
pnpm run prisma:generate
```

## Step 6: Test Database Connection

Run the test script to verify everything works:

```bash
pnpm run test:user
```

This script will:
- ✅ Test database connection
- ✅ Create user record for "femillion" if not exists
- ✅ Attach wallet `0x5817527F5d5864C2707B6a950A9D24262E6687F8`
- ✅ Display all user and wallet details

## Step 7: Start the Backend

```bash
pnpm run dev
```

The backend should now start successfully at `http://localhost:3001`

## Common Issues

### Issue: "Can't reach database server"
**Solution**: Check your DATABASE_URL and DIRECT_URL in `.env`

### Issue: "Invalid credentials"
**Solution**: Make sure you replaced `[YOUR-PASSWORD]` with your actual Supabase database password

### Issue: "Table doesn't exist"
**Solution**: Run `pnpm run prisma:push` to create tables

### Issue: "Module not found .prisma/client"
**Solution**: Run `pnpm run prisma:generate` to generate Prisma client

## Database Schema

The database has 4 main tables:

### User
- Stores VeryChat and Wepin user profiles
- Linked to wallets, transactions, and media

### Wallet
- Stores blockchain wallet addresses
- Each user can have multiple wallets
- Tracks balance and NFT count

### Transaction  
- Records all blockchain transactions
- Includes NFT minting transactions
- Links to user and wallet

### Media
- Stores uploaded files (profile images, etc.)
- Uses Supabase Storage for file hosting
- Links to user

## Next Steps

After successful setup:

1. **Test the API**: Visit `http://localhost:3001/health`
2. **View Data**: Run `pnpm run prisma:studio` to open Prisma Studio
3. **Test Login**: Try logging in with VeryChat in the frontend
4. **Upload Image**: Test profile image upload in the Profile page
