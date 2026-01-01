/**
 * Wallet Service for VeryChat Users
 * Creates and manages wallets for users who login via VeryChat (social auth)
 * Uses viem for EVM-compatible wallet generation
 */

import {
  generatePrivateKey,
  privateKeyToAccount,
  generateMnemonic,
  mnemonicToAccount,
  english,
} from "viem/accounts";
import { createPublicClient, http, formatEther } from "viem";

// Verychain configuration
const VERYCHAIN_RPC = "https://rpc.verylabs.io";
const CHAIN_ID = 4613;

// Storage keys
const WALLET_STORAGE_KEY = "veterex_verychat_wallet";

export interface VeryChainWallet {
  address: string;
  privateKey: string;
  mnemonic?: string;
  userId: string; // VeryChat profileId
  createdAt: string;
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
 */
export function createWalletForUser(userId: string): VeryChainWallet {
  try {
    // Generate a random mnemonic phrase
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
 * Store wallet data securely
 */
function storeWallet(wallet: VeryChainWallet): void {
  try {
    // In production, use encrypted storage or a more secure method
    // For now, storing in localStorage
    const existingWallets = getStoredWallets();
    const walletIndex = existingWallets.findIndex(
      (w) => w.userId === wallet.userId
    );

    if (walletIndex >= 0) {
      existingWallets[walletIndex] = wallet;
    } else {
      existingWallets.push(wallet);
    }

    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(existingWallets));
  } catch (error) {
    console.error("[Wallet] Error storing wallet:", error);
  }
}

/**
 * Get all stored wallets
 */
function getStoredWallets(): VeryChainWallet[] {
  try {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("[Wallet] Error reading stored wallets:", error);
    return [];
  }
}

/**
 * Get wallet for a specific VeryChat user
 */
export function getWalletForUser(userId: string): VeryChainWallet | null {
  try {
    const wallets = getStoredWallets();
    return wallets.find((w) => w.userId === userId) || null;
  } catch (error) {
    console.error("[Wallet] Error getting wallet for user:", error);
    return null;
  }
}

/**
 * Get or create wallet for a VeryChat user
 * If wallet exists, return it. Otherwise, create a new one.
 */
export function getOrCreateWalletForUser(userId: string): VeryChainWallet {
  const existingWallet = getWalletForUser(userId);
  if (existingWallet) {
    console.log("[Wallet] Found existing wallet for user:", userId);
    return existingWallet;
  }

  console.log("[Wallet] Creating new wallet for user:", userId);
  // Use the simpler private key approach to avoid mnemonic complexity
  return createWalletFromPrivateKey(userId);
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
 * Clear all stored wallets
 */
export function clearAllWallets(): void {
  localStorage.removeItem(WALLET_STORAGE_KEY);
  console.log("[Wallet] Cleared all wallets");
}
