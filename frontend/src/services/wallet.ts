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

  if (!userId) {
    console.error("[Wallet] userId is required but was empty/null");
    throw new Error("User ID is required to create wallet");
  }

  try {
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
  } catch (error) {
    console.error("[Wallet] Error in getOrCreateWalletForUser:", error);
    throw new Error(
      `Failed to initialize wallet: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
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
 * Import wallet from recovery phrase (mnemonic)
 * This allows users to restore their wallet on new devices
 * @param mnemonic - 12/24 word recovery phrase
 * @param userId - VeryChat profileId
 * @param previewOnly - If true, only returns the address without saving
 * @returns The wallet address (0x...)
 */
export async function importWalletFromMnemonic(
  mnemonic: string,
  previewOnly: boolean = false
): Promise<string> {
  try {
    console.log(
      "[Wallet] importWalletFromMnemonic called, preview:",
      previewOnly
    );

    // Clean and validate mnemonic
    const cleanedMnemonic = mnemonic.trim().toLowerCase().replace(/\s+/g, " ");
    const words = cleanedMnemonic.split(" ");

    // Validate word count
    const validLengths = [12, 15, 18, 21, 24];
    if (!validLengths.includes(words.length)) {
      throw new Error(
        `Invalid mnemonic length. Expected 12, 15, 18, 21, or 24 words, got ${words.length}`
      );
    }

    // Create account from mnemonic (BIP-39 standard)
    let account;
    try {
      account = mnemonicToAccount(cleanedMnemonic);
    } catch (error) {
      console.error("[Wallet] Failed to derive account from mnemonic:", error);
      throw new Error(
        "Invalid recovery phrase. Please check that all words are correct and in the right order."
      );
    }

    // If preview mode, just return the address
    if (previewOnly) {
      console.log("[Wallet] Preview mode - derived address:", account.address);
      return account.address;
    }

    // Get current user from VeryChat (we need userId to encrypt)
    // Note: This requires the user to be logged in
    // The calling component should handle getting userId

    console.warn(
      "[Wallet] ⚠️ Importing wallet will replace any existing wallet!"
    );

    // Return the address - the actual import with userId will be done by the component
    return account.address;
  } catch (error) {
    console.error("[Wallet] Error importing wallet from mnemonic:", error);
    throw error;
  }
}

/**
 * Import wallet from recovery phrase with user ID
 * This is the actual import that saves to storage
 * @param mnemonic - 12/24 word recovery phrase
 * @param userId - VeryChat profileId for encryption
 * @returns The imported wallet
 */
export function importWalletWithUserId(
  mnemonic: string,
  userId: string
): VeryChainWallet {
  try {
    console.log("[Wallet] importWalletWithUserId called for user:", userId);

    // Clean mnemonic
    const cleanedMnemonic = mnemonic.trim().toLowerCase().replace(/\s+/g, " ");

    // Create account from mnemonic
    const account = mnemonicToAccount(cleanedMnemonic);

    // Extract private key
    const privateKey = account.getHdKey().privateKey
      ? `0x${Buffer.from(account.getHdKey().privateKey!).toString("hex")}`
      : generatePrivateKey();

    // Create wallet data
    const walletData: VeryChainWallet = {
      address: account.address,
      privateKey,
      mnemonic: cleanedMnemonic,
      userId,
      createdAt: new Date().toISOString(),
    };

    // Delete any existing wallet first
    const existingWallets = getStoredWallets();
    const filteredWallets = existingWallets.filter(
      (w: VeryChainWallet) => w.userId !== userId
    );

    if (filteredWallets.length < existingWallets.length) {
      console.warn("[Wallet] Removed existing wallet for user:", userId);
    }

    // Store the imported wallet
    storeWallet(walletData);

    console.log("[Wallet] ✅ Wallet imported successfully!");
    console.log("[Wallet] Address:", account.address);
    console.warn("[Wallet] ⚠️ Make sure to backup your recovery phrase!");

    return walletData;
  } catch (error) {
    console.error("[Wallet] Error importing wallet with userId:", error);
    throw error;
  }
}

/**
 * Preview wallet address from private key (doesn't save)
 * @param privateKey - Private key with or without 0x prefix
 * @returns The wallet address
 */
export function previewAddressFromPrivateKey(privateKey: string): string {
  try {
    // Normalize private key format
    let cleanedKey = privateKey.trim();
    if (!cleanedKey.startsWith("0x")) {
      cleanedKey = `0x${cleanedKey}`;
    }

    // Create account from private key
    const account = privateKeyToAccount(cleanedKey as `0x${string}`);

    return account.address;
  } catch (error) {
    console.error("[Wallet] Error previewing private key:", error);
    throw new Error("Invalid private key format");
  }
}

/**
 * Import wallet from private key with user ID
 * This saves to storage and replaces existing wallet
 * @param privateKey - Private key with or without 0x prefix
 * @param userId - VeryChat profileId for encryption
 * @returns The imported wallet
 */
export function importWalletFromPrivateKey(
  privateKey: string,
  userId: string
): VeryChainWallet {
  try {
    console.log("[Wallet] importWalletFromPrivateKey called for user:", userId);

    // Normalize private key format
    let cleanedKey = privateKey.trim();
    if (!cleanedKey.startsWith("0x")) {
      cleanedKey = `0x${cleanedKey}`;
    }

    // Create account from private key
    const account = privateKeyToAccount(cleanedKey as `0x${string}`);

    // Create wallet data (no mnemonic for private key imports)
    const walletData: VeryChainWallet = {
      address: account.address,
      privateKey: cleanedKey,
      // No mnemonic for private key imports
      userId,
      createdAt: new Date().toISOString(),
    };

    // Delete any existing wallet first
    const existingWallets = getStoredWallets();
    const filteredWallets = existingWallets.filter(
      (w: VeryChainWallet) => w.userId !== userId
    );

    if (filteredWallets.length < existingWallets.length) {
      console.warn("[Wallet] Removed existing wallet for user:", userId);
    }

    // Store the imported wallet
    storeWallet(walletData);

    console.log("[Wallet] ✅ Wallet imported from private key successfully!");
    console.log("[Wallet] Address:", account.address);
    console.warn("[Wallet] ⚠️ No recovery phrase - backup your private key!");

    return walletData;
  } catch (error) {
    console.error("[Wallet] Error importing wallet from private key:", error);
    throw new Error("Invalid private key or import failed");
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
