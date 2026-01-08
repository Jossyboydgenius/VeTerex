/**
 * Wallet Service for VeryChat Users
 * Creates and manages wallets for users who login via VeryChat (social auth)
 * Uses viem for EVM-compatible wallet generation
 * Implements AES encryption for private key security
 */

import {
  generatePrivateKey,
  privateKeyToAccount,
  generateMnemonic,
  mnemonicToAccount,
  english,
} from "viem/accounts";
import { createPublicClient, http, formatEther } from "viem";
import CryptoJS from "crypto-js";

// Verychain configuration
const VERYCHAIN_RPC = "https://rpc.verylabs.io";
const CHAIN_ID = 4613;

// Storage keys
const WALLET_STORAGE_KEY = "veterex_verychat_wallet";
const WALLET_SALT_KEY = "veterex_wallet_salt";

export interface VeryChainWallet {
  address: string;
  privateKey: string; // Will be encrypted if password is set
  mnemonic?: string;
  userId: string; // VeryChat profileId
  createdAt: string;
  encrypted?: boolean; // Flag to indicate if private key is encrypted
}

// Define Verychain as a custom chain
const verychain = {
  id: CHAIN_ID,
  name: "Verychain",
  nativeCurrency: {
    decimals: 18,
    name: "VERY",
    symbol: "VERY",
  },
  rpcUrls: {
    default: { http: [VERYCHAIN_RPC] },
  },
  blockExplorers: {
    default: { name: "Veryscan", url: "https://veryscan.io" },
  },
} as const;

/**
 * Generate a wallet password from user's auth ID
 * This creates a deterministic password based on user ID + device salt
 * Better than plain localStorage but still client-side security
 */
function generateWalletPassword(userId: string): string {
  // Get or create a device-specific salt
  let salt = localStorage.getItem(WALLET_SALT_KEY);
  if (!salt) {
    // Try to load from chrome.storage.local if in extension
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      // This is synchronous fallback, ideally should be async
      // But we need sync access for encryption/decryption
      const storedSalt = localStorage.getItem(WALLET_SALT_KEY);
      if (storedSalt) {
        salt = storedSalt;
      }
    }

    if (!salt) {
      salt = CryptoJS.lib.WordArray.random(256 / 8).toString();
      localStorage.setItem(WALLET_SALT_KEY, salt);

      // Also save to chrome.storage.local in extension
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.set({ [WALLET_SALT_KEY]: salt });
      }
    }
  }

  // Create password from userId + salt
  const password = CryptoJS.SHA256(userId + salt).toString();
  return password;
}

/**
 * Encrypt private key using AES encryption
 */
function encryptPrivateKey(privateKey: string, userId: string): string {
  try {
    const password = generateWalletPassword(userId);
    const encrypted = CryptoJS.AES.encrypt(privateKey, password).toString();
    return encrypted;
  } catch (error) {
    console.error("[Wallet] Encryption error:", error);
    throw error;
  }
}

/**
 * Decrypt private key using AES decryption
 */
function decryptPrivateKey(encryptedKey: string, userId: string): string {
  try {
    const password = generateWalletPassword(userId);
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, password);
    const privateKey = decrypted.toString(CryptoJS.enc.Utf8);

    if (!privateKey) {
      throw new Error("Decryption failed - invalid password or corrupted data");
    }

    return privateKey;
  } catch (error) {
    console.error("[Wallet] Decryption error:", error);
    throw error;
  }
}

/**
 * Get Verychain public client for reading data
 */
export function getVeryChainClient() {
  return createPublicClient({
    chain: verychain,
    transport: http(VERYCHAIN_RPC),
  });
}

/**
 * Create a new random wallet for a VeryChat user
 * Now includes mnemonic generation for backup/recovery
 */
export function createWalletForUser(userId: string): VeryChainWallet {
  try {
    // Generate a random mnemonic phrase (12 words)
    const mnemonic = generateMnemonic(english);

    // Create account from mnemonic
    const account = mnemonicToAccount(mnemonic);

    const walletData: VeryChainWallet = {
      address: account.address,
      privateKey: account.getHdKey().privateKey
        ? `0x${Buffer.from(account.getHdKey().privateKey!).toString("hex")}`
        : generatePrivateKey(),
      mnemonic,
      userId,
      createdAt: new Date().toISOString(),
    };

    // Store wallet securely (in localStorage for now, should use secure storage in production)
    storeWallet(walletData);

    console.log("[Wallet] Created new wallet for VeryChat user:", userId);
    console.log("[Wallet] Address:", account.address);
    console.warn(
      "[Wallet] ⚠️ IMPORTANT: User should backup their recovery phrase immediately!"
    );

    return walletData;
  } catch (error) {
    console.error("[Wallet] Error creating wallet:", error);
    throw error;
  }
}

/**
 * Create wallet from private key (simpler approach)
 */
export function createWalletFromPrivateKey(userId: string): VeryChainWallet {
  try {
    // Generate a random private key
    const privateKey = generatePrivateKey();

    // Create account from private key
    const account = privateKeyToAccount(privateKey);

    const walletData: VeryChainWallet = {
      address: account.address,
      privateKey,
      userId,
      createdAt: new Date().toISOString(),
    };

    // Store wallet
    storeWallet(walletData);

    console.log("[Wallet] Created new wallet for VeryChat user:", userId);
    console.log("[Wallet] Address:", account.address);

    return walletData;
  } catch (error) {
    console.error("[Wallet] Error creating wallet:", error);
    throw error;
  }
}

/**
 * Import wallet from private key
 */
export function importWalletFromPrivateKey(
  privateKey: string,
  userId: string
): VeryChainWallet {
  try {
    // Ensure private key has 0x prefix
    const formattedKey = (
      privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
    ) as `0x${string}`;

    const account = privateKeyToAccount(formattedKey);

    const walletData: VeryChainWallet = {
      address: account.address,
      privateKey: formattedKey,
      userId,
      createdAt: new Date().toISOString(),
    };

    storeWallet(walletData);

    console.log("[Wallet] Imported wallet for user:", userId);
    return walletData;
  } catch (error) {
    console.error("[Wallet] Error importing wallet:", error);
    throw error;
  }
}

/**
 * Import wallet from mnemonic phrase
 */
export function importWalletFromMnemonic(
  mnemonic: string,
  userId: string
): VeryChainWallet {
  try {
    const account = mnemonicToAccount(mnemonic);

    const walletData: VeryChainWallet = {
      address: account.address,
      privateKey: account.getHdKey().privateKey
        ? `0x${Buffer.from(account.getHdKey().privateKey!).toString("hex")}`
        : generatePrivateKey(),
      mnemonic,
      userId,
      createdAt: new Date().toISOString(),
    };

    storeWallet(walletData);

    console.log("[Wallet] Imported wallet from mnemonic for user:", userId);
    return walletData;
  } catch (error) {
    console.error("[Wallet] Error importing wallet from mnemonic:", error);
    throw error;
  }
}

/**
 * Store wallet data securely with encryption
 */
function storeWallet(wallet: VeryChainWallet): void {
  try {
    // Encrypt the private key before storing
    const encryptedWallet: VeryChainWallet = {
      ...wallet,
      privateKey: encryptPrivateKey(wallet.privateKey, wallet.userId),
      encrypted: true,
    };

    const existingWallets = getStoredWallets();
    const walletIndex = existingWallets.findIndex(
      (w) => w.userId === wallet.userId
    );

    if (walletIndex >= 0) {
      existingWallets[walletIndex] = encryptedWallet;
    } else {
      existingWallets.push(encryptedWallet);
    }

    // Store in localStorage
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(existingWallets));

    // Also store in chrome.storage.local for extension persistence
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set({
        [WALLET_STORAGE_KEY]: existingWallets,
        [WALLET_SALT_KEY]: localStorage.getItem(WALLET_SALT_KEY),
      });
      console.log(
        "[Wallet] Wallet stored with AES encryption (localStorage + chrome.storage)"
      );
    } else {
      console.log(
        "[Wallet] Wallet stored with AES encryption (localStorage only)"
      );
    }
  } catch (error) {
    console.error("[Wallet] Error storing wallet:", error);
  }
}

/**
 * Get all stored wallets
 * Works in both web and extension contexts
 * In extension context, stores in BOTH localStorage AND chrome.storage.local for persistence
 */
function getStoredWallets(): VeryChainWallet[] {
  try {
    // Always use localStorage as primary storage
    // Extension also syncs to chrome.storage.local via storeWallet()
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("[Wallet] Error reading stored wallets:", error);
    return [];
  }
}

/**
 * Get wallet for a specific VeryChat user
 * Automatically decrypts the private key if encrypted
 */
export function getWalletForUser(userId: string): VeryChainWallet | null {
  try {
    const wallets = getStoredWallets();
    console.log("[Wallet] getWalletForUser called for:", userId);
    console.log("[Wallet] Total wallets in storage:", wallets.length);
    console.log(
      "[Wallet] Wallet userIds:",
      wallets.map((w) => w.userId)
    );

    const wallet = wallets.find((w) => w.userId === userId);

    if (!wallet) {
      console.warn("[Wallet] No wallet found for user:", userId);
      return null;
    }

    // If wallet is encrypted, decrypt the private key
    if (wallet.encrypted) {
      return {
        ...wallet,
        privateKey: decryptPrivateKey(wallet.privateKey, userId),
        encrypted: false, // Return decrypted wallet
      };
    }

    return wallet;
  } catch (error) {
    console.error("[Wallet] Error getting wallet for user:", error);
    return null;
  }
}

/**
 * Get or create wallet for a VeryChat user
 * If wallet exists, return it. Otherwise, create a new one.
 * Returns both the wallet and whether it was newly created
 */
export function getOrCreateWalletForUser(userId: string): {
  wallet: VeryChainWallet;
  isNewWallet: boolean;
} {
  console.log("[Wallet] getOrCreateWalletForUser called for:", userId);
  const existingWallet = getWalletForUser(userId);
  if (existingWallet) {
    console.log(
      "[Wallet] Found existing wallet for user:",
      userId,
      "address:",
      existingWallet.address
    );
    return { wallet: existingWallet, isNewWallet: false };
  }

  console.log("[Wallet] Creating new wallet for user:", userId);
  // Create wallet with mnemonic for backup capability
  const newWallet = createWalletForUser(userId);
  console.log("[Wallet] New wallet created with address:", newWallet.address);
  return { wallet: newWallet, isNewWallet: true };
}

/**
 * Get wallet balance on Verychain
 */
export async function getWalletBalance(address: string): Promise<string> {
  try {
    const client = getVeryChainClient();
    const balance = await client.getBalance({
      address: address as `0x${string}`,
    });
    // Convert from wei to VERY (18 decimals)
    return formatEther(balance);
  } catch (error) {
    console.error("[Wallet] Error getting balance:", error);
    return "0";
  }
}

/**
 * Delete wallet for a user (on logout)
 */
export function deleteWalletForUser(userId: string): void {
  try {
    const wallets = getStoredWallets();
    const filtered = wallets.filter((w) => w.userId !== userId);
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(filtered));
    console.log("[Wallet] Deleted wallet for user:", userId);
  } catch (error) {
    console.error("[Wallet] Error deleting wallet:", error);
  }
}

/**
 * Clear all stored wallets and salt
 */
export function clearAllWallets(): void {
  localStorage.removeItem(WALLET_STORAGE_KEY);
  localStorage.removeItem(WALLET_SALT_KEY);
  console.log("[Wallet] Cleared all wallets and encryption keys");
}

/**
 * Export wallet private key for user (for backup/import to other wallets)
 * Returns decrypted private key - handle with care!
 */
export function exportPrivateKey(userId: string): string | null {
  try {
    console.log("[Wallet] exportPrivateKey called for:", userId);
    const wallet = getWalletForUser(userId);
    if (!wallet) {
      console.warn("[Wallet] No wallet found for export, userId:", userId);
      return null;
    }

    console.log("[Wallet] Wallet found for export, address:", wallet.address);
    console.warn("[Wallet] ⚠️ Private key exported - Keep it secure!");
    return wallet.privateKey;
  } catch (error) {
    console.error("[Wallet] Error exporting private key:", error);
    return null;
  }
}

/**
 * Export wallet recovery phrase (mnemonic) for user
 * This is the preferred backup method - users should write this down
 * Returns 12-word mnemonic phrase
 */
export function exportRecoveryPhrase(userId: string): string | null {
  try {
    console.log("[Wallet] exportRecoveryPhrase called for:", userId);
    const wallet = getWalletForUser(userId);
    if (!wallet) {
      console.warn(
        "[Wallet] No wallet found for recovery phrase export, userId:",
        userId
      );
      return null;
    }

    if (!wallet.mnemonic) {
      console.warn(
        "[Wallet] Wallet has no mnemonic (created from private key)"
      );
      return null;
    }

    console.log("[Wallet] Recovery phrase found for export");
    console.warn(
      "[Wallet] ⚠️ Recovery phrase exported - Keep it secure and offline!"
    );
    return wallet.mnemonic;
  } catch (error) {
    console.error("[Wallet] Error exporting recovery phrase:", error);
    return null;
  }
}

/**
 * Initialize wallet storage from chrome.storage.local in extension context
 * Call this on extension startup to ensure wallet data is synced
 */
export function initWalletStorageFromExtension(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(
        [WALLET_STORAGE_KEY, WALLET_SALT_KEY],
        (result) => {
          if (result[WALLET_STORAGE_KEY]) {
            localStorage.setItem(
              WALLET_STORAGE_KEY,
              JSON.stringify(result[WALLET_STORAGE_KEY])
            );
            console.log(
              "[Wallet] Loaded wallet data from chrome.storage.local"
            );
          }
          if (result[WALLET_SALT_KEY]) {
            localStorage.setItem(WALLET_SALT_KEY, result[WALLET_SALT_KEY]);
            console.log(
              "[Wallet] Loaded wallet salt from chrome.storage.local"
            );
          }
          resolve();
        }
      );
    } else {
      resolve();
    }
  });
}

/**
 * Check if wallet is encrypted
 */
export function isWalletEncrypted(userId: string): boolean {
  try {
    const wallets = getStoredWallets();
    const wallet = wallets.find((w) => w.userId === userId);
    return wallet?.encrypted === true;
  } catch {
    return false;
  }
}
