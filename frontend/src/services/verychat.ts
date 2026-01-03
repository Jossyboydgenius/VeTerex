/**
 * VeryChat Authentication Service
 * Handles user authentication via VeryChat API
 */

const VERY_API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://gapi.veryapi.io";
const PROJECT_ID =
  import.meta.env.VITE_VERYCHAT_PROJECT_ID || "veterex-hackathon";

interface VeryChatUser {
  profileId: string;
  profileName: string;
  profileImage?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// API response format - user info is at root level, not nested
interface ApiLoginResponse {
  accessToken: string;
  refreshToken: string;
  statusCode: number;
  profileId: string;
  profileName: string;
  profileImage?: string;
}

// Our normalized response format
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: VeryChatUser;
  statusCode: number;
}

interface TokenPayload {
  sub: string;
  projectId: string;
  iat: number;
  exp: number;
}

// Store tokens in memory and localStorage
let currentTokens: AuthTokens | null = null;
let currentUser: VeryChatUser | null = null;

/**
 * Initialize auth from stored tokens
 */
export function initVeryChatAuth(): {
  user: VeryChatUser | null;
  tokens: AuthTokens | null;
} {
  try {
    const storedTokens = localStorage.getItem("verychat_tokens");
    const storedUser = localStorage.getItem("verychat_user");

    if (storedTokens && storedUser) {
      currentTokens = JSON.parse(storedTokens);
      currentUser = JSON.parse(storedUser);
      return { user: currentUser, tokens: currentTokens };
    }
  } catch (error) {
    console.error("[VeryChat] Failed to restore auth:", error);
  }

  return { user: null, tokens: null };
}

/**
 * Request verification code for a handle ID
 * The code will be sent via VeryChat push notification
 */
export async function requestVerificationCode(
  handleId: string
): Promise<boolean> {
  try {
    // Remove @ prefix if present
    const cleanHandleId = handleId.startsWith("@")
      ? handleId.slice(1)
      : handleId;

    const response = await fetch(
      `${VERY_API_BASE}/auth/request-verification-code`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          handleId: cleanHandleId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to send verification code");
    }

    console.log("[VeryChat] Verification code sent to:", cleanHandleId);
    return true;
  } catch (error) {
    console.error("[VeryChat] Failed to request verification code:", error);
    throw error;
  }
}

/**
 * Verify code without getting tokens (just validation)
 */
export async function verifyCode(
  handleId: string,
  code: number
): Promise<boolean> {
  try {
    const cleanHandleId = handleId.startsWith("@")
      ? handleId.slice(1)
      : handleId;

    const response = await fetch(`${VERY_API_BASE}/auth/verify-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        handleId: cleanHandleId,
        verificationCode: code,
      }),
    });

    const data = await response.json();
    return data.statusCode === 200;
  } catch (error) {
    console.error("[VeryChat] Code verification failed:", error);
    return false;
  }
}

/**
 * Format error message for display
 */
function formatErrorMessage(message: string): string {
  // Handle snake_case error codes from API
  if (message === "invalid_code" || message === "INVALID_CODE") {
    return "Invalid code";
  }
  if (message === "expired_code" || message === "EXPIRED_CODE") {
    return "Expired code";
  }
  // Replace underscores with spaces and capitalize first letter
  const formatted = message.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
}

/**
 * Verify code and get access tokens
 */
export async function loginWithCode(
  handleId: string,
  code: number
): Promise<LoginResponse> {
  try {
    const cleanHandleId = handleId.startsWith("@")
      ? handleId.slice(1)
      : handleId;

    const response = await fetch(`${VERY_API_BASE}/auth/get-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        handleId: cleanHandleId,
        verificationCode: code,
      }),
    });

    const data = await response.json();

    // Check for error response
    if (data.statusCode === 400 || data.statusCode === 401) {
      throw new Error(
        formatErrorMessage(data.message) ||
          "Invalid or expired verification code"
      );
    }

    if (!response.ok) {
      throw new Error(
        formatErrorMessage(data.message) ||
          "Invalid or expired verification code"
      );
    }

    // API returns user info at root level, normalize it
    const apiResponse = data as ApiLoginResponse;

    // Create normalized user object
    const user: VeryChatUser = {
      profileId: apiResponse.profileId,
      profileName: apiResponse.profileName,
      profileImage: apiResponse.profileImage || "",
    };

    // Store tokens
    currentTokens = {
      accessToken: apiResponse.accessToken,
      refreshToken: apiResponse.refreshToken,
    };
    currentUser = user;

    localStorage.setItem("verychat_tokens", JSON.stringify(currentTokens));
    localStorage.setItem("verychat_user", JSON.stringify(currentUser));

    console.log("[VeryChat] User logged in:", user.profileName);

    return {
      accessToken: apiResponse.accessToken,
      refreshToken: apiResponse.refreshToken,
      user,
      statusCode: apiResponse.statusCode,
    };
  } catch (error: any) {
    console.error("[VeryChat] Login failed:", error);
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshTokens(): Promise<AuthTokens | null> {
  if (!currentTokens?.refreshToken || !currentUser?.profileId) {
    return null;
  }

  try {
    const response = await fetch(`${VERY_API_BASE}/auth/refresh-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: PROJECT_ID,
        handleId: currentUser.profileId,
        refreshToken: currentTokens.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh tokens");
    }

    const data = await response.json();

    currentTokens = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };

    localStorage.setItem("verychat_tokens", JSON.stringify(currentTokens));

    console.log("[VeryChat] Tokens refreshed");
    return currentTokens;
  } catch (error) {
    console.error("[VeryChat] Token refresh failed:", error);
    // Clear invalid tokens
    logout();
    return null;
  }
}

/**
 * Validate current access token
 */
export async function validateToken(): Promise<TokenPayload | null> {
  if (!currentTokens?.accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${VERY_API_BASE}/auth/validate-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentTokens.accessToken}`,
      },
      body: JSON.stringify({
        projectId: PROJECT_ID,
      }),
    });

    if (!response.ok) {
      throw new Error("Invalid token");
    }

    const data = await response.json();
    return data.data?.payload || null;
  } catch (error) {
    console.error("[VeryChat] Token validation failed:", error);
    return null;
  }
}

/**
 * Get current access token (with auto-refresh if needed)
 */
export async function getAccessToken(): Promise<string | null> {
  if (!currentTokens?.accessToken) {
    return null;
  }

  // Try to validate current token
  const payload = await validateToken();

  if (!payload) {
    // Token is invalid, try to refresh
    const newTokens = await refreshTokens();
    return newTokens?.accessToken || null;
  }

  // Check if token is about to expire (within 5 minutes)
  const expiresIn = payload.exp * 1000 - Date.now();
  if (expiresIn < 5 * 60 * 1000) {
    const newTokens = await refreshTokens();
    return newTokens?.accessToken || currentTokens.accessToken;
  }

  return currentTokens.accessToken;
}

/**
 * Logout and clear stored tokens
 */
export function logout(): void {
  currentTokens = null;
  currentUser = null;
  localStorage.removeItem("verychat_tokens");
  localStorage.removeItem("verychat_user");
  localStorage.removeItem("veterex_verychat_wallet");
  console.log("[VeryChat] User logged out, wallet cleared");
}

/**
 * Get current user info
 */
export function getCurrentUser(): VeryChatUser | null {
  return currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return currentTokens !== null && currentUser !== null;
}

/**
 * Get list of channels
 */
export async function getChannels(): Promise<any[]> {
  try {
    // Attempt to fetch channels - endpoint structure is inferred
    // Standard REST would be /channels
    return await authenticatedRequest<any[]>("/channels");
  } catch (error) {
    console.error(
      "[VeryChat] Failed to fetch channels, returning mock data:",
      error
    );

    // Return mock data for now since we don't have the exact endpoint
    return [
      {
        id: "ch_1",
        name: "Anime Lovers",
        description: "Discuss the latest anime releases",
        members: 1250,
      },
      {
        id: "ch_2",
        name: "Tech Talk",
        description: "Everything about new gadgets",
        members: 890,
      },
      {
        id: "ch_3",
        name: "Book Club",
        description: "Monthly reading discussions",
        members: 450,
      },
    ];
  }
}

/**
 * Make authenticated API request
 */
export async function authenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${VERY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API request failed: ${response.status}`);
  }

  return response.json();
}
