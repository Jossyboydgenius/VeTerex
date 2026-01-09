import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create or update user after VeryChat/Wepin login
 */
export async function createOrUpdateUser(
  authId: string,
  authMethod: "verychat" | "wepin",
  profileName: string,
  profileImage?: string,
  email?: string
) {
  try {
    const whereClause =
      authMethod === "verychat" ? { verychatId: authId } : { wepinId: authId };

    const user = await prisma.user.upsert({
      where: whereClause,
      update: {
        profileName,
        profileImage: profileImage || undefined,
        email: email || undefined,
        updatedAt: new Date(),
      },
      create: {
        ...(authMethod === "verychat"
          ? { verychatId: authId }
          : { wepinId: authId }),
        profileName,
        profileImage: profileImage || undefined,
        email: email || undefined,
      },
    });

    console.log("✅ User created/updated:", user.id);
    return user;
  } catch (error) {
    console.error("❌ Error creating user:", error);
    throw error;
  }
}

/**
 * Get user by auth ID (VeryChat or Wepin)
 */
export async function getUserByAuthId(
  authId: string,
  authMethod: "verychat" | "wepin"
) {
  try {
    const user = await prisma.user.findUnique({
      where:
        authMethod === "verychat"
          ? { verychatId: authId }
          : { wepinId: authId },
      include: {
        wallets: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        media: {
          where: { purpose: "profile-image" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return user;
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    return user;
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    profileName?: string;
    profileImage?: string;
    bio?: string;
    email?: string;
  }
) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Profile updated:", user.id);
    return user;
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    throw error;
  }
}

/**
 * Delete user (cascade deletes wallets, transactions & media)
 */
export async function deleteUser(userId: string) {
  try {
    const user = await prisma.user.delete({
      where: { id: userId },
    });

    console.log("✅ User deleted:", user.id);
    return user;
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    throw error;
  }
}

/**
 * Set wallet password for user (for private key export protection)
 */
export async function setWalletPassword(
  userId: string,
  password: string
): Promise<void> {
  try {
    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: userId },
      data: {
        walletPasswordHash: passwordHash,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Wallet password set for user:", userId);
  } catch (error) {
    console.error("❌ Error setting wallet password:", error);
    throw error;
  }
}

/**
 * Verify wallet password for user
 */
export async function verifyWalletPassword(
  userId: string,
  password: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletPasswordHash: true },
    });

    if (!user || !user.walletPasswordHash) {
      // No password set
      return false;
    }

    const isValid = await verifyPassword(password, user.walletPasswordHash);
    console.log("🔐 Password verification result:", isValid);
    return isValid;
  } catch (error) {
    console.error("❌ Error verifying wallet password:", error);
    return false;
  }
}

/**
 * Check if user has wallet password set
 */
export async function hasWalletPassword(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletPasswordHash: true },
    });

    return !!user?.walletPasswordHash;
  } catch (error) {
    console.error("❌ Error checking wallet password:", error);
    return false;
  }
}

/**
 * Reset wallet password (for forgot password flow)
 */
export async function resetWalletPassword(
  userId: string,
  newPassword: string
): Promise<void> {
  try {
    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        walletPasswordHash: passwordHash,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Wallet password reset for user:", userId);
  } catch (error) {
    console.error("❌ Error resetting wallet password:", error);
    throw error;
  }
}
