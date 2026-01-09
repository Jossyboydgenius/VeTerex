import { Router, Request, Response } from "express";
import type { Router as IRouter } from "express";
import { verifyVeryChatToken, optionalAuth } from "../middleware/auth.js";
import * as userService from "../services/userService.js";
import * as walletService from "../services/walletService.js";
import * as fileService from "../services/fileService.js";
import * as transactionService from "../services/transactionService.js";

const router: IRouter = Router();

// ========== USER ROUTES ==========

/**
 * Create or update user profile
 * POST /api/user/profile
 */
router.post("/profile", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      authId,
      authMethod,
      profileName,
      profileImage,
      email,
      walletAddress,
    } = req.body;

    if (!authId || !authMethod || !profileName) {
      res.status(400).json({
        error: "Missing required fields: authId, authMethod, profileName",
      });
      return;
    }

    if (!["verychat", "wepin"].includes(authMethod)) {
      res
        .status(400)
        .json({ error: "Invalid authMethod. Must be 'verychat' or 'wepin'" });
      return;
    }

    // Create/update user
    const user = await userService.createOrUpdateUser(
      authId,
      authMethod,
      profileName,
      profileImage,
      email
    );

    // Create wallet record if walletAddress provided
    if (walletAddress) {
      await walletService.createWalletRecord(user.id, walletAddress);
    }

    // Refetch user with wallets to include in response
    const userWithWallets = await userService.getUserByAuthId(
      authId,
      authMethod
    );

    res.json({
      success: true,
      user: userWithWallets,
    });
  } catch (error: any) {
    console.error("Profile creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user profile by auth ID
 * GET /api/user/profile/:authMethod/:authId
 */
router.get(
  "/profile/:authMethod/:authId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { authMethod, authId } = req.params;

      if (!["verychat", "wepin"].includes(authMethod)) {
        res.status(400).json({ error: "Invalid authMethod" });
        return;
      }

      const user = await userService.getUserByAuthId(
        authId,
        authMethod as "verychat" | "wepin"
      );

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Update user profile
 * PUT /api/user/profile/:userId
 */
router.put(
  "/profile/:userId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { profileName, bio, email } = req.body;

      const user = await userService.updateUserProfile(userId, {
        profileName,
        bio,
        email,
      });

      res.json({
        success: true,
        user,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Delete user
 * DELETE /api/user/profile/:userId
 */
router.delete(
  "/profile/:userId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const user = await userService.deleteUser(userId);

      res.json({
        success: true,
        message: "User deleted",
        user,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ========== IMAGE UPLOAD ROUTES ==========

/**
 * Upload profile image
 * POST /api/user/upload-image/:userId
 */
router.post(
  "/upload-image/:userId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const file = req.file;

      console.log("📸 [Upload Image] Request received for userId:", userId);
      console.log(
        "📸 [Upload Image] File:",
        file ? file.originalname : "NO FILE"
      );

      if (!file) {
        console.error("❌ [Upload Image] No file provided");
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const result = await fileService.uploadProfileImage(
        file.buffer,
        file.originalname,
        file.mimetype,
        userId
      );

      console.log("✅ [Upload Image] Success:", result.imageUrl);
      res.json(result);
    } catch (error: any) {
      console.error("❌ [Upload Image] Error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Delete profile image
 * DELETE /api/user/profile-image/:userId
 */
router.delete(
  "/profile-image/:userId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const user = await fileService.deleteProfileImage(userId);

      res.json({
        success: true,
        user,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Get user's media files
 * GET /api/user/media/:userId
 */
router.get(
  "/media/:userId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { purpose } = req.query;

      const media = await fileService.getUserMedia(
        userId,
        purpose as string | undefined
      );

      res.json(media);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ========== WALLET ROUTES ==========

/**
 * Get user by wallet address
 * GET /api/user/by-wallet/:walletAddress
 */
router.get(
  "/by-wallet/:walletAddress",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.params;

      const wallet = await walletService.getWalletByAddress(walletAddress);

      if (!wallet) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        success: true,
        user: wallet.user,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Create or update wallet
 * POST /api/user/wallet
 */
router.post("/wallet", async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, walletAddress, network, chainId } = req.body;

    if (!userId || !walletAddress) {
      res
        .status(400)
        .json({ error: "Missing required fields: userId, walletAddress" });
      return;
    }

    const wallet = await walletService.createWalletRecord(
      userId,
      walletAddress,
      network,
      chainId
    );

    res.json({
      success: true,
      wallet,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's wallets
 * GET /api/user/wallets/:userId
 */
router.get(
  "/wallets/:userId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const wallets = await walletService.getUserWallets(userId);

      res.json(wallets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Update wallet balance
 * PUT /api/user/wallet/:walletAddress/balance
 */
router.put(
  "/wallet/:walletAddress/balance",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.params;
      const { balance } = req.body;

      const wallet = await walletService.updateWalletBalance(
        walletAddress,
        balance
      );

      res.json({
        success: true,
        wallet,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ========== TRANSACTION ROUTES ==========

/**
 * Record transaction
 * POST /api/user/transaction
 */
router.post(
  "/transaction",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        userId,
        fromAddress,
        toAddress,
        amount,
        txHash,
        status,
        tokenId,
        mediaType,
      } = req.body;

      if (!userId || !fromAddress || !toAddress || !txHash) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const transaction = await transactionService.recordTransaction(
        userId,
        fromAddress,
        toAddress,
        amount || 0,
        txHash,
        status,
        tokenId,
        mediaType
      );

      res.json({
        success: true,
        transaction,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Get user's transactions
 * GET /api/user/transactions/:userId
 */
router.get(
  "/transactions/:userId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { limit, offset } = req.query;

      const result = await transactionService.getUserTransactions(
        userId,
        limit ? parseInt(limit as string) : 20,
        offset ? parseInt(offset as string) : 0
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Get transaction by hash
 * GET /api/user/transaction/:txHash
 */
router.get(
  "/transaction/:txHash",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { txHash } = req.params;

      const transaction = await transactionService.getTransaction(txHash);

      if (!transaction) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }

      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ========== WALLET PASSWORD ROUTES ==========

/**
 * Set wallet password
 * POST /api/user/wallet-password
 */
router.post(
  "/wallet-password",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, password } = req.body;

      if (!userId || !password) {
        res.status(400).json({ error: "Missing userId or password" });
        return;
      }

      // Password validation
      if (password.length < 8) {
        res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
        return;
      }

      await userService.setWalletPassword(userId, password);

      res.json({
        success: true,
        message: "Wallet password set successfully",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Verify wallet password
 * POST /api/user/wallet-password/verify
 */
router.post(
  "/wallet-password/verify",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, password } = req.body;

      if (!userId || !password) {
        res.status(400).json({ error: "Missing userId or password" });
        return;
      }

      const isValid = await userService.verifyWalletPassword(userId, password);

      res.json({
        success: true,
        isValid,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Check if user has wallet password
 * GET /api/user/wallet-password/check/:userId
 */
router.get(
  "/wallet-password/check/:userId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      const hasPassword = await userService.hasWalletPassword(userId);

      res.json({
        success: true,
        hasPassword,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Reset wallet password
 * PUT /api/user/wallet-password/reset
 */
router.put(
  "/wallet-password/reset",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, newPassword } = req.body;

      if (!userId || !newPassword) {
        res.status(400).json({ error: "Missing userId or newPassword" });
        return;
      }

      // Password validation
      if (newPassword.length < 8) {
        res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
        return;
      }

      await userService.resetWalletPassword(userId, newPassword);

      res.json({
        success: true,
        message: "Wallet password reset successfully",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Update user's wallet address (for wallet import)
 * PUT /api/user/wallet-address
 */
router.put(
  "/wallet-address",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, walletAddress, network, chainId } = req.body;

      if (!userId || !walletAddress) {
        res.status(400).json({ error: "Missing userId or walletAddress" });
        return;
      }

      const wallet = await walletService.updateUserWalletAddress(
        userId,
        walletAddress,
        network || "verychain",
        chainId || 4613
      );

      res.json({
        success: true,
        wallet,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
