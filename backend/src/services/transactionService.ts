import { prisma } from "../lib/prisma.js";

/**
 * Record transaction after blockchain confirmation
 */
export async function recordTransaction(
  userId: string,
  fromAddress: string,
  toAddress: string,
  amount: number,
  txHash: string,
  status: string = "confirmed",
  tokenId?: string,
  mediaType?: string
) {
  try {
    // Check if transaction already exists
    const existingTx = await prisma.transaction.findUnique({
      where: { txHash },
    });

    if (existingTx) {
      console.log("⚠️ Transaction already recorded:", txHash);
      return existingTx;
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        fromAddress,
        toAddress,
        amount,
        txHash,
        status,
        tokenId,
        mediaType,
      },
    });

    console.log("✅ Transaction recorded:", transaction.id);
    return transaction;
  } catch (error) {
    console.error("❌ Error recording transaction:", error);
    throw error;
  }
}

/**
 * Get user's transactions
 */
export async function getUserTransactions(
  userId: string,
  limit: number = 20,
  offset: number = 0
) {
  try {
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({
        where: { userId },
      }),
    ]);

    return {
      transactions,
      total,
      hasMore: offset + transactions.length < total,
    };
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    throw error;
  }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  txHash: string,
  status: "pending" | "confirmed" | "failed"
) {
  try {
    const transaction = await prisma.transaction.update({
      where: { txHash },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Transaction status updated:", transaction.id);
    return transaction;
  } catch (error) {
    console.error("❌ Error updating transaction:", error);
    throw error;
  }
}

/**
 * Get transaction by hash
 */
export async function getTransaction(txHash: string) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { txHash },
      include: {
        user: true,
      },
    });

    return transaction;
  } catch (error) {
    console.error("❌ Error fetching transaction:", error);
    throw error;
  }
}

/**
 * Get transactions by wallet address
 */
export async function getTransactionsByAddress(
  address: string,
  limit: number = 20
) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ fromAddress: address }, { toAddress: address }],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return transactions;
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
    throw error;
  }
}
