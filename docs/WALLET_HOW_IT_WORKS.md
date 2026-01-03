# VeryChat Wallet System - How It Works

## Quick Answers

### Q: How does VeryChat wallet creation work?

**Answer**: The wallet is created **automatically on first login** when a user logs in with VeryChat.

### Q: When is the wallet created or triggered?

**Answer**: **ONCE** - The first time a VeryChat user successfully logs in to VeTerex.

### Q: How can users access their wallet?

**Answer**: Users can export their private key from the **Settings page** and import it into MetaMask, Trust Wallet, or any EVM-compatible wallet.

---

## Detailed Explanation

### 1. When is the Wallet Created?

**Location**: `frontend/src/components/Header.tsx` (Line ~378)

```typescript
// When user successfully logs in with VeryChat
const handleVeryChatSuccess = (loginResult: LoginResult) => {
  try {
    const userData = loginResult.user;
    
    // ✅ WALLET CREATED HERE - On first login
    const wallet = getOrCreateWalletForUser(userData.profileId);
    
    console.log("[Header] VeryChat wallet:", wallet.address);
    
    // Store user and wallet info
    setVeryChatUser(userData);
    setAccounts([{ address: wallet.address }]);
    
    // Call backend to create user record
    await createOrUpdateUser({
      authId: userData.profileId,
      authMethod: "verychat",
      profileName: userData.profileName,
      walletAddress: wallet.address, // ← Wallet attached to user
    });
  } catch (error) {
    console.error("VeryChat login error:", error);
  }
};
```

### 2. How Does `getOrCreateWalletForUser()` Work?

**Location**: `frontend/src/services/wallet.ts` (Line ~286)

```typescript
export function getOrCreateWalletForUser(userId: string): VeryChainWallet {
  // 1. Check if wallet already exists in localStorage
  const existingWallet = getWalletForUser(userId);
  
  if (existingWallet) {
    console.log("[Wallet] Found existing wallet for user:", userId);
    return existingWallet; // ← Return existing wallet (no new creation)
  }

  // 2. If no wallet exists, create a new one
  console.log("[Wallet] Creating new wallet for user:", userId);
  return createWalletFromPrivateKey(userId); // ← Creates NEW wallet
}
```

**Key Points**:
- ✅ Checks localStorage FIRST before creating
- ✅ Only creates wallet if none exists
- ✅ Subsequent logins return the **same wallet** (not creating new ones)

### 3. Wallet Creation Process

**Location**: `frontend/src/services/wallet.ts` (Line ~129)

```typescript
export function createWalletFromPrivateKey(userId: string): VeryChainWallet {
  try {
    // Step 1: Generate random private key using Viem
    const privateKey = generatePrivateKey();
    // Example: "0x1234567890abcdef..."

    // Step 2: Create account from private key
    const account = privateKeyToAccount(privateKey);
    // Generates wallet address from private key
    // Example address: "0x5817527F5d5864C2707B6a950A9D24262E6687F8"

    // Step 3: Create wallet data structure
    const walletData: VeryChainWallet = {
      address: account.address,
      privateKey: privateKey,  // Will be encrypted before storage
      userId: userId,          // VeryChat profileId
      createdAt: new Date().toISOString(),
    };

    // Step 4: Store wallet (with AES encryption)
    storeWallet(walletData);
    // Private key is encrypted before saving to localStorage

    console.log("[Wallet] Created new wallet for VeryChat user:", userId);
    console.log("[Wallet] Address:", account.address);

    return walletData;
  } catch (error) {
    console.error("[Wallet] Error creating wallet:", error);
    throw error;
  }
}
```

**Encryption Details**:

```typescript
function storeWallet(wallet: VeryChainWallet): void {
  // Encrypt the private key before storing
  const encryptedWallet: VeryChainWallet = {
    ...wallet,
    privateKey: encryptPrivateKey(wallet.privateKey, wallet.userId), // ← AES-256
    encrypted: true,
  };

  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(encryptedWallet));
  console.log("[Wallet] Wallet stored with AES encryption");
}
```

### 4. Wallet Storage Location

**Browser localStorage**:

```json
{
  "key": "veterex_verychat_wallet",
  "value": {
    "address": "0x5817527F5d5864C2707B6a950A9D24262E6687F8",
    "privateKey": "U2FsdGVkX1+abc123...",  // ✅ AES Encrypted
    "userId": "femillion",
    "createdAt": "2026-01-02T13:54:19.896Z",
    "encrypted": true
  }
}
```

**Database** (Backend):

```sql
-- User table
id: "cmjwxql4n0000ovuvjnx5xysz"
verychatId: "femillion"
profileName: "Femi"

-- Wallet table
userId: "cmjwxql4n0000ovuvjnx5xysz"
walletAddress: "0x5817527F5d5864C2707B6a950A9D24262E6687F8"
network: "verychain"
chainId: 4613
```

### 5. How Users Access Their Wallet

#### Step 1: Export Private Key

**New Feature** - Settings Page:

1. User logs in with VeryChat
2. Goes to **Profile** → **Settings**
3. Scrolls to **"Wallet Security"** section
4. Clicks **"Export Private Key"** button
5. Private key is decrypted and displayed

**UI Features**:
- ✅ Show/Hide private key (Eye icon)
- ✅ Copy to clipboard button
- ✅ Download as `.txt` file
- ⚠️ Security warning displayed

#### Step 2: Import to MetaMask

**Mobile App (Recommended - Easiest)**:

1. **Open MetaMask Mobile** or **Trust Wallet** app on your phone
2. Tap **Menu** (☰) → **"Import Wallet"** or **"Add Account"**
3. Select **"Import with private key"**
4. Either:
   - **Paste** the exported private key, OR
   - **Scan the QR code** shown in VeTerex Settings
5. Wallet is now imported! ✅

**Desktop/Browser Extension**:

1. **Open MetaMask** extension → Click **account icon** (top right) → **Import Account**
2. Select **"Private Key"** as import type
3. **Paste** the exported private key
4. Click **"Import"**
5. Wallet is now imported! ✅

**Trust Wallet**:

1. Open Trust Wallet app
2. Tap **Settings** → **Wallets** → **"+"** (Add Wallet)
3. Select **"I already have a wallet"**
4. Choose **"Multi-Coin"** or **"Ethereum"**
5. Select **"Import with private key"**
6. Paste your private key or scan QR code
7. Done! ✅

#### Step 3: Add Verychain Network

MetaMask doesn't know about Verychain by default. Users need to add it manually.

**On Mobile App**:

1. Open MetaMask/Trust Wallet
2. Tap **Networks** (top of screen)
3. Tap **"Add Network"** or **"+"**
4. Tap **"Add network manually"**
5. Enter network details:
   - **Network Name**: `Verychain`
   - **RPC URL**: `https://rpc.verylabs.io`
   - **Chain ID**: `4613`
   - **Currency Symbol**: `VERY`
   - **Block Explorer**: `https://veryscan.io`
6. Tap **"Add"** or **"Save"**
7. Switch to Verychain network
8. User can now see their VERY balance and NFTs! ✅

**On Desktop/Extension**:

1. Open MetaMask → Click **Networks dropdown** (top left)
2. Click **"Add Network"** → **"Add network manually"**
3. Enter the same network details as above
4. Click **"Save"**
5. Switch to Verychain
6. Done! ✅

**For Trust Wallet**:

Trust Wallet automatically supports Verychain if you select "Multi-Coin" wallet. The network should appear in your network list. If not, you can add it manually using the same details.

### 6. Using the Wallet for NFT Minting

**Location**: `frontend/src/services/tracking.ts`

```typescript
export async function mintAchievementNFT(data: NFTMetadata) {
  // 1. Get the stored wallet
  const walletData = getWalletForUser(userId);
  // Auto-decrypts the private key
  
  // 2. Create account from decrypted private key
  const account = privateKeyToAccount(walletData.privateKey);
  
  // 3. Create wallet client
  const walletClient = createWalletClient({
    account,                    // ← Uses the VeryChat wallet
    chain: verychain,
    transport: http(VERYCHAIN_RPC)
  });
  
  // 4. Send transaction to mint NFT
  const hash = await walletClient.writeContract({
    address: MEDIA_TRACKER_ADDRESS,
    abi: MediaTrackerABI,
    functionName: 'mint',
    args: [tokenURI]
  });
  
  return hash;
}
```

**Transaction Flow**:

1. User completes media (e.g., finishes a movie)
2. VeTerex detects completion
3. App calls `mintAchievementNFT()`
4. Wallet auto-decrypts private key
5. Transaction signed with private key
6. NFT minted to user's wallet address
7. User owns the NFT!

### 7. Security & Best Practices

#### Current Implementation ✅

- ✅ **AES-256 Encryption**: Private keys encrypted before storage
- ✅ **Device-Specific Salt**: Each device has unique encryption key
- ✅ **Auto-Decryption**: Only decrypts when needed (export or mint)
- ✅ **No Password Prompts**: Seamless UX (trade-off for convenience)

#### User Warnings ⚠️

When exporting private key, we show:

```
⚠️ Warning: Never share your private key with anyone! 
Anyone with your private key has full access to your wallet.
```

#### Recommendations for Users

1. **Export and backup** private key after first login
2. Store backup in **secure location** (password manager, encrypted USB)
3. **Never share** private key with anyone
4. For **high-value wallets**, use hardware wallet (Ledger/Trezor)
5. **Test first** - Send small amount before storing large amounts

---

## Comparison: VeryChat vs Wepin Wallets

| Feature | VeryChat Wallet | Wepin Wallet |
|---------|-----------------|--------------|
| **Creation** | Auto-created on first login | Managed by Wepin SDK |
| **Private Key** | User can export (Settings) | Never exposed to user |
| **Storage** | localStorage (AES encrypted) | Wepin secure cloud |
| **User Control** | Full self-custody | Managed service |
| **Export** | ✅ Can export anytime | ❌ Cannot export |
| **Import to MetaMask** | ✅ Yes, via private key | ❌ No |
| **Recovery** | Via exported private key | Email/social recovery |
| **Best For** | Power users, developers | Casual users |

---

## Frequently Asked Questions

### Q: What if user logs in on different device?

**Answer**: The wallet is **device-specific** (stored in localStorage). User needs to:
1. Export private key from first device
2. Import to second device's MetaMask/wallet
3. OR: Use the same private key to import in any wallet app

### Q: What if user clears browser data?

**Answer**: ⚠️ Wallet is **LOST** unless user exported the private key!

**Solution**: We should prompt users to export on first wallet creation.

### Q: Can user have multiple wallets?

**Answer**: Currently, **one wallet per VeryChat user**. The same wallet is used across:
- VeTerex web app
- VeTerex extension
- Any wallet app where they import the key (MetaMask, Trust Wallet, etc.)

### Q: What happens if someone steals the private key?

**Answer**: ⚠️ They have **full access** to the wallet. They can:
- Transfer all funds
- Transfer all NFTs
- Make transactions

**Prevention**:
- Keep private key secret
- Use password manager
- Consider hardware wallet for high-value assets

---

## Summary

### The Complete Flow

1. **User logs in** with VeryChat (first time)
2. **Wallet auto-created** with Viem (`generatePrivateKey()`)
3. **Private key encrypted** with AES-256
4. **Stored in localStorage** (encrypted)
5. **Also stored in backend** (wallet address only)
6. **User completes media** → NFT auto-minted to their wallet
7. **User exports private key** from Settings page
8. **Imports to MetaMask** for full wallet control
9. **Uses wallet anywhere** - web, mobile, hardware

### Key Features

- ✅ **Automatic**: No manual wallet setup needed
- ✅ **Secure**: AES-256 encryption
- ✅ **Portable**: Export and use anywhere
- ✅ **Standard**: Compatible with all EVM wallets
- ✅ **Self-Custody**: Users own their keys

---

**Last Updated**: January 2, 2026  
**Version**: 1.0.0
