/**
 * VeTerex Backend API Service
 * Handles communication with the VeTerex backend (Prisma + Supabase)
 */

// Backend API URL - defaults to localhost for development
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

/**
 * Generic API request handler for VeTerex backend
 */
async function backendRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error || `Backend request failed: ${response.status}`
    );
  }

  return response.json();
}

// ==================
// User Profile API
// ==================

export interface UserProfile {
  id: string;
  verychatId?: string;
  wepinId?: string;
  profileName: string;
  profileImage?: string;
  bio?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserParams {
  authId: string;
  authMethod: "verychat" | "wepin";
  profileName: string;
  profileImage?: string;
  email?: string;
  walletAddress?: string;
}

/**
 * Create or update user profile
 */
export async function createOrUpdateUser(
  params: CreateUserParams
): Promise<{ success: boolean; user: UserProfile }> {
  return backendRequest("/api/user/profile", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * Get user profile by auth ID
 */
export async function getUserProfile(
  authMethod: string,
  authId: string
): Promise<UserProfile | null> {
  try {
    return await backendRequest(`/api/user/profile/${authMethod}/${authId}`);
  } catch {
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, "id" | "createdAt" | "updatedAt">>
): Promise<UserProfile> {
  return backendRequest(`/api/user/profile/${userId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

// ==================
// Profile Image Upload
// ==================

/**
 * Upload profile image
 * Note: This uses FormData, not JSON
 */
export async function uploadProfileImage(
  userId: string,
  file: File
): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${BACKEND_URL}/api/user/upload-image/${userId}`,
    {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to upload image");
  }

  return response.json();
}

/**
 * Delete profile image
 */
export async function deleteProfileImage(userId: string): Promise<void> {
  await backendRequest(`/api/user/profile-image/${userId}`, {
    method: "DELETE",
  });
}

// ==================
// Wallet API
// ==================

export interface WalletRecord {
  id: string;
  userId: string;
  address: string;
  privateKeyEncrypted?: string;
  network: string;
  chainId: number;
  balance?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletParams {
  userId: string;
  address: string;
  privateKeyEncrypted?: string;
  network: string;
  chainId: number;
  isDefault?: boolean;
}

/**
 * Create wallet record
 */
export async function createWallet(
  params: CreateWalletParams
): Promise<WalletRecord> {
  return backendRequest("/api/user/wallet", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * Get user's wallets
 */
export async function getUserWallets(userId: string): Promise<WalletRecord[]> {
  return backendRequest(`/api/user/wallets/${userId}`);
}

/**
 * Update wallet balance
 */
export async function updateWalletBalance(
  walletAddress: string,
  balance: string
): Promise<WalletRecord> {
  return backendRequest(`/api/user/wallet/${walletAddress}/balance`, {
    method: "PUT",
    body: JSON.stringify({ balance }),
  });
}

// ==================
// Transaction API
// ==================

export interface Transaction {
  id: string;
  userId: string;
  walletAddress: string;
  txHash: string;
  type: string;
  status: string;
  amount?: string;
  tokenId?: string;
  mediaId?: string;
  gasUsed?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface CreateTransactionParams {
  userId: string;
  walletAddress: string;
  txHash: string;
  type: string;
  amount?: string;
  tokenId?: string;
  mediaId?: string;
  gasUsed?: string;
}

/**
 * Record a new transaction
 */
export async function createTransaction(
  params: CreateTransactionParams
): Promise<Transaction> {
  return backendRequest("/api/user/transaction", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * Get user's transactions
 */
export async function getUserTransactions(
  userId: string,
  params?: { type?: string; status?: string }
): Promise<Transaction[]> {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.append("type", params.type);
  if (params?.status) queryParams.append("status", params.status);

  const query = queryParams.toString();
  return backendRequest(
    `/api/user/transactions/${userId}${query ? `?${query}` : ""}`
  );
}

/**
 * Get transaction by hash
 */
export async function getTransactionByHash(
  txHash: string
): Promise<Transaction | null> {
  try {
    return await backendRequest(`/api/user/transaction/${txHash}`);
  } catch {
    return null;
  }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  txHash: string,
  status: "pending" | "confirmed" | "failed"
): Promise<Transaction> {
  return backendRequest(`/api/user/transaction/${txHash}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

// ==================
// Health Check
// ==================

/**
 * Check if backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
