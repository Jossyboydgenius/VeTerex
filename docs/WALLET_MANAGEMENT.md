# VeTerex Wallet Management Guide

## Overview

VeTerex uses two different wallet approaches depending on how users authenticate:

1. **Wepin Users**: Managed wallet with built-in security
2. **VeryChat Users**: Self-custodial wallet created locally

---

## 🔐 Wepin Wallet (Recommended)

### How It Works

When users log in with Wepin (email/social), Wepin SDK manages the wallet entirely:

```typescript
// User logs in with Wepin
const user = await loginWithWepin();

// Wepin automatically provides wallets
const accounts = await getWepinAccounts();

// accounts[0].address is the user's wallet
// Private key is managed securely by Wepin - never exposed to app
```

### Characteristics

- ✅ **Secure**: Private keys stored in Wepin's secure enclave
- ✅ **Easy**: Users don't need to manage seed phrases
- ✅ **Multi-chain**: Supports multiple networks (BNB, Ethereum, etc.)
- ✅ **Recovery**: Wepin handles account recovery
- ❌ **Not fully self-custodial**: Users rely on Wepin service

### User Access

Users can access their Wepin wallet through:
- VeTerex app (via Wepin SDK)
- Wepin web interface
- Wepin mobile app

---

## 🌟 VeryChat Wallet (Self-Custodial)

### How It Works

When users log in with VeryChat (social login without wallet), VeTerex creates a local wallet using **Viem**:

```typescript
// services/wallet.ts

// When VeryChat user logs in
const wallet = getOrCreateWalletForUser(user.profileId);

// Wallet is created ONCE on first login and stored in localStorage
```

### Creation Flow

1. **User logs in with VeryChat**
   ```typescript
   // Header.tsx - handleVeryChatSuccess()
   const wallet = getOrCreateWalletForUser(user.profileId);
   // Wallet address: 0x5817527F5d5864C2707B6a950A9D24262E6687F8
   ```

2. **Wallet is generated using Viem**
   ```typescript
   // wallet.ts - createWalletFromPrivateKey()
   const privateKey = generatePrivateKey(); // Random private key
   const account = privateKeyToAccount(privateKey);
   
   const walletData = {
     address: account.address,
     privateKey: privateKey, // ⚠️ Stored in localStorage
     userId: user.profileId,
     createdAt: new Date().toISOString()
   };
   
   localStorage.setItem('veterex_verychat_wallet', JSON.stringify(walletData));
   ```

3. **Wallet is attached to backend user**
   ```typescript
   // Backend creates wallet record
   await createOrUpdateUser({
     authId: user.profileId,
     authMethod: "verychat",
     profileName: user.profileName,
     walletAddress: wallet.address // Stored in database
   });
   ```

### When Is It Created?

**ONCE** - On first VeryChat login:

```typescript
// services/wallet.ts - getOrCreateWalletForUser()

export function getOrCreateWalletForUser(userId: string) {
  // 1. Check if wallet already exists in localStorage
  const existing = getStoredWallet(userId);
  if (existing) {
    console.log("[Wallet] Found existing wallet");
    return existing;
  }

  // 2. If not found, create new wallet
  console.log("[Wallet] Creating new wallet for user:", userId);
  return createWalletFromPrivateKey(userId);
}
```

**Subsequent logins**: Wallet is retrieved from localStorage - not recreated.

### Storage Location

```javascript
// Browser localStorage (ENCRYPTED with AES)
Key: "veterex_verychat_wallet"
Value: {
  "address": "0x5817527F5d5864C2707B6a950A9D24262E6687F8",
  "privateKey": "U2FsdGVkX1...", // ✅ AES ENCRYPTED!
  "userId": "femillion",
  "createdAt": "2026-01-02T13:54:19.896Z",
  "encrypted": true
}

// Encryption key salt (device-specific)
Key: "veterex_wallet_salt"
Value: "a1b2c3d4..." // Random salt generated per device
```

✅ **Security Improvement**: Private keys are now encrypted using AES-256 with a device-specific salt!

### How Users Access Their Wallet

#### Option 1: Export Private Key (Current Implementation)

```typescript
// services/wallet.ts - exportPrivateKey()

// Get decrypted private key
import { exportPrivateKey } from '@/services/wallet';

const privateKey = exportPrivateKey(userId);
// Returns decrypted key: "0x..."

// User can copy and import to MetaMask, Trust Wallet, etc.
// MetaMask: Settings → Import Account → Private Key
// Trust Wallet: Settings → Wallets → Import Wallet
```

**✅ Security**: Private key is automatically decrypted from AES-encrypted storage when exported.

#### Option 2: Export Mnemonic (Alternative - currently disabled)

The code supports mnemonic generation but uses private key approach for simplicity:

```typescript
// wallet.ts - createWalletForUser() - currently not used
const mnemonic = generateMnemonic(english);
// 12-word phrase like: "abandon abandon abandon..."

// User can use this phrase to restore wallet anywhere
```

### Using the Wallet for Transactions

When minting NFTs or sending transactions:

```typescript
// services/tracking.ts

import { privateKeyToAccount } from 'viem/accounts';

export async function mintAchievementNFT(data: NFTMetadata) {
  // 1. Get stored wallet
  const walletData = getStoredWallet(userId);
  
  // 2. Create account from private key
  const account = privateKeyToAccount(walletData.privateKey);
  
  // 3. Create wallet client
  const walletClient = createWalletClient({
    account,
    chain: verychain,
    transport: http(VERYCHAIN_RPC)
  });
  
  // 4. Send transaction
  const hash = await walletClient.writeContract({
    address: MEDIA_TRACKER_ADDRESS,
    abi: MediaTrackerABI,
    functionName: 'mint',
    args: [tokenURI]
  });
  
  return hash;
}
```

---

## Security Improvements (✅ IMPLEMENTED!)

### ✅ Current Implementation

1. **✅ AES-256 Encryption** - Private keys encrypted before storage
2. **✅ Device-specific Salt** - Each device has unique encryption salt  
3. **✅ Automatic Decryption** - Keys decrypted only when needed
4. **✅ Secure Export** - exportPrivateKey() function for safe key export

### 🔒 How It Works

```typescript
// services/wallet.ts

// 1. Generate device salt (once per device)
const salt = CryptoJS.lib.WordArray.random(256 / 8).toString();
localStorage.setItem("veterex_wallet_salt", salt);

// 2. Create encryption password
const password = CryptoJS.SHA256(userId + salt).toString();

// 3. Encrypt private key before storing
const encrypted = CryptoJS.AES.encrypt(privateKey, password).toString();

// 4. Decrypt when needed
const decrypted = CryptoJS.AES.decrypt(encrypted, password).toString(CryptoJS.enc.Utf8);
```

### 🎯 Security Benefits

- ✅ **Not plain text**: Private keys encrypted in localStorage
- ✅ **Device-bound**: Salt makes keys device-specific
- ✅ **User-bound**: Password derived from user ID
- ✅ **Auto-managed**: No password prompts needed
- ✅ **Export safe**: Decryption only happens when explicitly exported

### ⚠️ Current Limitations

1. **Client-side encryption**: Salt stored in same localStorage (better than nothing!)
2. **Deterministic password**: Based on userId + device salt (convenient but less secure than user password)
3. **No user password**: Users don't set their own password (trade-off for UX)

### 🚀 Further Improvements (Optional)

### 🚀 Further Improvements (Optional)

#### 1. Add User Password (Most Secure)

```typescript
// Let user set their own password
const userPassword = prompt("Create wallet password");

// Encrypt with user's password instead of derived one
const encrypted = CryptoJS.AES.encrypt(privateKey, userPassword).toString();

// Prompt for password when needed
const password = prompt("Enter wallet password");
const decrypted = CryptoJS.AES.decrypt(encrypted, password);
```

**Pros**: Maximum security, user controls access  
**Cons**: UX friction, password management burden

#### 2. Use Hardware Wallet (Advanced)

```typescript
import { WalletConnectConnector } from '@wagmi/core/connectors';

// Let users connect hardware wallets like Ledger/Trezor
const connector = new WalletConnectConnector({
  chains: [verychain],
  options: {
    projectId: 'your_walletconnect_id',
  },
});
```

**Pros**: Maximum security, keys never touch browser  
**Cons**: Requires hardware wallet, complex UX

#### 3. Store Salt Separately (Better Security)

```typescript
// Instead of localStorage, use:
// - Session storage (cleared on browser close)
// - IndexedDB with additional encryption layer
// - Server-side key management (requires backend)
```

**Pros**: Harder to access both salt and encrypted data  
**Cons**: More complex implementation

---

## Comparison Table

| Feature | Wepin Wallet | VeryChat Wallet |
|---------|-------------|-----------------|
| **Creation** | Managed by Wepin | Created locally (Viem) |
| **Private Key** | Never exposed | AES encrypted in localStorage |
| **Security** | Secure enclave | AES-256 + device salt ✅ |
| **Recovery** | Email/social recovery | Export private key/mnemonic |
| **Multi-device** | ✅ Yes (cloud sync) | ❌ No (device-specific encryption) |
| **Transaction Signing** | Wepin SDK | Viem + decrypted key |
| **User Control** | Wepin manages | Full self-custody |
| **Best For** | Most users | Power users/developers |

---

## Frequently Asked Questions

### Q: Can VeryChat users access their wallet outside VeTerex?

**Yes!** They need to:
1. Export their private key from localStorage (dev tools)
2. Import to MetaMask/Trust Wallet/any EVM wallet
3. Add Verychain network manually:
   - Network Name: Verychain
   - RPC URL: https://rpc.verylabs.io
   - Chain ID: 4613
   - Currency: VERY

### Q: What happens if user clears browser data?

**Wepin**: Wallet is safe - managed in cloud  
**VeryChat**: Wallet is LOST (encrypted data cleared) ⚠️

**Solution**: Always prompt users to export private key after first wallet creation!

### Q: Is the encryption secure enough for production?

**Current state**: 
- ✅ Better than plain text storage
- ✅ Protects against casual snooping
- ⚠️ Not secure against determined attackers with device access
- ⚠️ Salt stored in same localStorage (separation would be better)

**Recommendation**:
- ✅ Good enough for development/testing
- ✅ Good enough for small amounts
- ⚠️ For high-value wallets, recommend hardware wallet or user password

### Q: Can we migrate VeryChat wallet to Wepin?

**Yes!** Steps:
1. Export VeryChat private key
2. Login with Wepin
3. Import private key to Wepin wallet
4. Update backend to use Wepin auth

### Q: Should we force all users to Wepin?

**Recommendation**: 
- Default: Wepin (easier, safer)
- Advanced option: VeryChat + local wallet (for power users)
- Add warning: "⚠️ You are responsible for wallet security"

---

## Implementation Checklist

- ✅ Wallet created on first VeryChat login
- ✅ Stored in localStorage with AES encryption
- ✅ Device-specific salt for encryption
- ✅ Automatic encryption/decryption
- ✅ Retrieved on subsequent logins
- ✅ Used for NFT minting
- ✅ Attached to backend user record
- ✅ Export function for private key backup
- ⚠️ **TODO**: Add "Export Wallet" button in settings UI
- ⚠️ **TODO**: Show private key warning on first creation
- ⚠️ **TODO**: Add recovery phrase display (optional)
- ⚠️ **OPTIONAL**: Add user password option for higher security

---

## Next Steps

1. **Add Wallet Export UI**
   ```tsx
   // SettingsPage.tsx
   function exportWallet() {
     const wallet = getStoredWallet(userId);
     const blob = new Blob([wallet.privateKey], { type: 'text/plain' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = 'veterex-wallet-private-key.txt';
     a.click();
   }
   ```

2. **Add First-time Wallet Setup Flow**
   - Show private key ONCE
   - Make user acknowledge they saved it
   - Never show again (security)

3. **Add Wallet Lock/Unlock**
   - Require password to access wallet
   - Auto-lock after inactivity
   - Prompt for password before transactions

4. **Add Multi-wallet Support**
   - Let users have multiple wallets
   - Switch between them
   - Different wallets for different purposes

Need more details? Check the code in `/frontend/src/services/wallet.ts`!
