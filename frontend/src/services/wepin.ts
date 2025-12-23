import type { WepinUser, WepinAccount } from "@/types";

// Wepin SDK Configuration
const WEPIN_APP_ID = import.meta.env.VITE_WEPIN_APP_ID || "your-wepin-app-id";
const WEPIN_APP_KEY =
  import.meta.env.VITE_WEPIN_APP_KEY || "your-wepin-api-key";

// Check if running as Chrome extension
const isExtension =
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.id &&
  window.location.protocol === "chrome-extension:";

// WepinSDK instance
let wepinSDK: any = null;

/**
 * Initialize Wepin SDK
 * Must be called before any other Wepin operations
 * Note: Wepin SDK requires domain registration. Extensions using chrome-extension://
 * protocol need special handling.
 */
export async function initWepin(): Promise<boolean> {
  try {
    // Check if running in extension context
    if (isExtension) {
      console.warn(
        "[VeTerex] Running in Chrome extension context. Wepin SDK requires domain registration."
      );
      console.warn("[VeTerex] To use Wepin in extension:");
      console.warn(
        '  1. Open extension in a new tab (right-click extension icon > "Open in new tab")'
      );
      console.warn(
        "  2. Or register chrome-extension://<extension-id> domain in Wepin dashboard"
      );
      console.warn("  3. Or use the web version at localhost:5173");

      // Try to initialize anyway - it may work if domain is registered
      // If not, we'll catch the error and provide helpful message
    }

    // Dynamic import for CSR environment
    const { WepinSDK } = await import("@wepin/sdk-js");

    wepinSDK = new WepinSDK({
      appId: WEPIN_APP_ID,
      appKey: WEPIN_APP_KEY,
    });

    await wepinSDK.init({
      type: "hide",
      defaultLanguage: "en",
      defaultCurrency: "USD",
      loginProviders: ["google", "apple", "discord"],
    });

    console.log("[VeTerex] Wepin SDK initialized successfully");
    return true;
  } catch (error: any) {
    console.error("[VeTerex] Failed to initialize Wepin SDK:", error);

    // Check if this is a domain validation error
    if (
      error?.message?.includes("Invalid domain") ||
      error?.response?.data?.message === "Invalid domain" ||
      (error?.message && error.message.includes("404"))
    ) {
      if (isExtension) {
        console.error(
          "[VeTerex] Domain validation failed for Chrome extension."
        );
        console.error(
          "[VeTerex] Please add your extension domain to Wepin dashboard:"
        );
        console.error(`  Domain: chrome-extension://${chrome.runtime.id}`);
        throw new Error(
          "Wepin requires domain registration. Please use the web version or register your extension domain in Wepin dashboard."
        );
      }
    }

    return false;
  }
}

/**
 * Check if Wepin SDK is initialized
 */
export function isWepinInitialized(): boolean {
  return wepinSDK?.isInitialized() ?? false;
}

/**
 * Get current Wepin lifecycle status
 */
export async function getWepinStatus(): Promise<string> {
  if (!wepinSDK) return "not_initialized";
  return await wepinSDK.getStatus();
}

/**
 * Login with Wepin Widget UI
 * Opens the Wepin login modal
 */
export async function loginWithWepin(
  email?: string
): Promise<WepinUser | null> {
  try {
    if (!wepinSDK) {
      await initWepin();
    }

    const userInfo = email
      ? await wepinSDK.loginWithUI({ email })
      : await wepinSDK.loginWithUI();

    console.log("[VeTerex] User logged in:", userInfo);
    return userInfo as WepinUser;
  } catch (error) {
    console.error("[VeTerex] Login failed:", error);
    throw error;
  }
}

/**
 * Register user with Wepin if needed
 */
export async function registerWithWepin(): Promise<WepinUser | null> {
  try {
    if (!wepinSDK) {
      throw new Error("Wepin SDK not initialized");
    }

    const userInfo = await wepinSDK.register();
    console.log("[VeTerex] User registered:", userInfo);
    return userInfo as WepinUser;
  } catch (error) {
    console.error("[VeTerex] Registration failed:", error);
    throw error;
  }
}

/**
 * Open Wepin Widget
 */
export async function openWepinWidget(): Promise<void> {
  if (!wepinSDK) {
    throw new Error("Wepin SDK not initialized");
  }
  await wepinSDK.openWidget();
}

/**
 * Close Wepin Widget
 */
export function closeWepinWidget(): void {
  if (wepinSDK) {
    wepinSDK.closeWidget();
  }
}

/**
 * Get user accounts from Wepin
 */
export async function getWepinAccounts(
  networks?: string[]
): Promise<WepinAccount[]> {
  try {
    if (!wepinSDK) {
      throw new Error("Wepin SDK not initialized");
    }

    const options = networks ? { networks, withEoa: true } : undefined;
    const accounts = await wepinSDK.getAccounts(options);

    console.log("[VeTerex] Accounts retrieved:", accounts);
    return accounts as WepinAccount[];
  } catch (error) {
    console.error("[VeTerex] Failed to get accounts:", error);
    throw error;
  }
}

/**
 * Get account balance
 */
export async function getAccountBalance(
  accounts?: WepinAccount[]
): Promise<any[]> {
  try {
    if (!wepinSDK) {
      throw new Error("Wepin SDK not initialized");
    }

    const balance = accounts
      ? await wepinSDK.getBalance(accounts)
      : await wepinSDK.getBalance();

    return balance;
  } catch (error) {
    console.error("[VeTerex] Failed to get balance:", error);
    throw error;
  }
}

/**
 * Send transaction using Wepin Widget
 */
export async function sendTransaction(
  account: WepinAccount,
  to: string,
  amount: string
): Promise<{ txId: string }> {
  try {
    if (!wepinSDK) {
      throw new Error("Wepin SDK not initialized");
    }

    const result = await wepinSDK.send({
      account: {
        address: account.address,
        network: account.network,
      },
      txData: {
        to,
        amount,
      },
    });

    console.log("[VeTerex] Transaction sent:", result);
    return result;
  } catch (error) {
    console.error("[VeTerex] Transaction failed:", error);
    throw error;
  }
}

/**
 * Logout from Wepin
 */
export async function logoutWepin(): Promise<void> {
  try {
    if (wepinSDK) {
      await wepinSDK.logout();
      console.log("[VeTerex] User logged out");
    }
  } catch (error) {
    console.error("[VeTerex] Logout failed:", error);
    throw error;
  }
}

/**
 * Finalize Wepin SDK
 */
export function finalizeWepin(): void {
  if (wepinSDK) {
    wepinSDK.finalize();
    wepinSDK = null;
    console.log("[VeTerex] Wepin SDK finalized");
  }
}

/**
 * Get login session tokens
 */
export async function getLoginSession(): Promise<any> {
  try {
    if (!wepinSDK) {
      throw new Error("Wepin SDK not initialized");
    }

    return await wepinSDK.getLoginSession();
  } catch (error) {
    console.error("[VeTerex] Failed to get login session:", error);
    throw error;
  }
}
