import { prisma } from "../lib/prisma.js";

/**
 * Create wallet record in database
 */
export async function createWalletRecord(
  userId: string,
  walletAddress: string,
  network: string = "verychain",
  chainId: number = 4613
) {
  try {
    // Check if wallet already exists
    const existingWallet = await prisma.wallet.findUnique({
      where: { walletAddress },
    });

    if (existingWallet) {
      // Update if it exists
      const wallet = await prisma.wallet.update({
        where: { walletAddress },
        data: {
          userId,
          network,
          chainId,
          updatedAt: new Date(),
        },
      });
      console.log("✅ Wallet updated:", wallet.id);
      return wallet;
    }

    // Create new wallet
    const wallet = await prisma.wallet.create({
      data: {
        userId,
        walletAddress,
        network,
        chainId,
      },
    });

    console.log("✅ Wallet created:", wallet.id);
    return wallet;
  } catch (error) {
    console.error("❌ Error creating wallet:", error);
    throw error;
  }
}

/**
 * Get wallets for user
 */
export async function getUserWallets(userId: string) {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return wallets;
  } catch (error) {
    console.error("❌ Error fetching wallets:", error);
    throw error;
  }
}

/**
 * Get wallet by address
 */
export async function getWalletByAddress(walletAddress: string) {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { walletAddress },
      include: {
        user: true,
      },
    });

    return wallet;
  } catch (error) {
    console.error("❌ Error fetching wallet:", error);
    throw error;
  }
}

/**
 * Update wallet balance
 */
export async function updateWalletBalance(
  walletAddress: string,
  balance: number
) {
  try {
    const wallet = await prisma.wallet.update({
      where: { walletAddress },
      data: {
        balance,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Wallet balance updated:", wallet.id);
    return wallet;
  } catch (error) {
    console.error("❌ Error updating balance:", error);
    throw error;
  }
}

/**
 * Update wallet NFT count
 */
export async function updateWalletNftCount(
  walletAddress: string,
  nftCount: number
) {
  try {
    const wallet = await prisma.wallet.update({
      where: { walletAddress },
      data: {
        nftCount,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Wallet NFT count updated:", wallet.id);
    return wallet;
  } catch (error) {
    console.error("❌ Error updating NFT count:", error);
    throw error;
  }
}

/**
 * Delete wallet
 */
export async function deleteWallet(walletAddress: string) {
  try {
    const wallet = await prisma.wallet.delete({
      where: { walletAddress },
    });

    console.log("✅ Wallet deleted:", wallet.id);
    return wallet;
  } catch (error) {
    console.error("❌ Error deleting wallet:", error);
    throw error;
  }
}
