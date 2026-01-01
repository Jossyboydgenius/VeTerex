# VeTerex Backend

Production-ready backend API using **Prisma + Supabase + Express**.

## Stack

- **Express** - Web framework
- **Prisma** - Type-safe ORM
- **Supabase** - PostgreSQL database & file storage
- **Sharp** - Image optimization
- **TypeScript** - Type safety

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - Supabase PostgreSQL connection string (with pgbouncer)
- `DIRECT_URL` - Direct PostgreSQL connection (for migrations)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase public API key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)

### 3. Create Supabase Storage Buckets

In your Supabase dashboard:

1. Go to **Storage**
2. Create bucket: `profile-images` (public)
3. Create bucket: `uploads` (public)

### 4. Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Or create a migration
npm run prisma:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:3001`

## API Endpoints

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/profile` | Create/update user |
| GET | `/api/user/profile/:authMethod/:authId` | Get user by auth ID |
| PUT | `/api/user/profile/:userId` | Update user profile |
| DELETE | `/api/user/profile/:userId` | Delete user |

### File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/upload-image/:userId` | Upload profile image |
| DELETE | `/api/user/profile-image/:userId` | Delete profile image |
| GET | `/api/user/media/:userId` | Get user's media files |

### Wallet Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/wallet` | Create wallet record |
| GET | `/api/user/wallets/:userId` | Get user's wallets |
| PUT | `/api/user/wallet/:walletAddress/balance` | Update wallet balance |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/transaction` | Record transaction |
| GET | `/api/user/transactions/:userId` | Get user's transactions |
| GET | `/api/user/transaction/:txHash` | Get transaction by hash |

## Example Requests

### Create User Profile

```bash
curl -X POST http://localhost:3001/api/user/profile \
  -H "Content-Type: application/json" \
  -d '{
    "authId": "femillion",
    "authMethod": "verychat",
    "profileName": "Femi",
    "walletAddress": "0x5817...87F8"
  }'
```

### Upload Profile Image

```bash
curl -X POST http://localhost:3001/api/user/upload-image/{userId} \
  -F "file=@profile.jpg"
```

### Record Transaction

```bash
curl -X POST http://localhost:3001/api/user/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id_here",
    "fromAddress": "0x...",
    "toAddress": "0x...",
    "amount": 0,
    "txHash": "0x...",
    "status": "confirmed",
    "tokenId": "1",
    "mediaType": "video"
  }'
```

## Database Schema

```prisma
model User {
  id           String   @id
  verychatId   String?  @unique
  wepinId      String?  @unique
  profileName  String
  profileImage String?
  bio          String?
  email        String?
  wallets      Wallet[]
  transactions Transaction[]
  media        Media[]
}

model Wallet {
  walletAddress String @unique
  network       String // "verychain"
  chainId       Int    // 4613
  balance       Float
  nftCount      Int
}

model Transaction {
  txHash      String @unique
  fromAddress String
  toAddress   String
  amount      Float
  status      String // pending, confirmed, failed
  tokenId     String?
  mediaType   String?
}

model Media {
  fileName    String
  fileUrl     String
  fileType    String
  fileSize    Int
  storagePath String
  purpose     String // profile-image, upload
}
```

## Production Deployment

### Build

```bash
npm run build
```

### Start

```bash
npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
CORS_ORIGIN=https://your-frontend-domain.com
```
