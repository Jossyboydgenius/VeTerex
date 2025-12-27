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

// Get the extension ID if running as extension
const getExtensionId = (): string | null => {
  if (isExtension && chrome.runtime?.id) {
    return chrome.runtime.id;
  }
  return null;
};

// Get the domain to register in Wepin
export const getWepinDomainForRegistration = (): string => {
  if (isExtension) {
    return `chrome-extension://${getExtensionId()}`;
  }
  return window.location.origin;
};

// WepinSDK instance
let wepinSDK: any = null;
let initializationError: string | null = null;

/**
 * Initialize Wepin SDK
 * Must be called before any other Wepin operations
 * Note: Wepin SDK requires domain registration. Extensions using chrome-extension://
 * protocol need special handling.
 *
 * For Chrome extensions:
 * 1. Go to Wepin Workspace (https://workspace.wepin.io)
 * 2. Navigate to your app's settings
 * 3. Add a new domain: chrome-extension://<your-extension-id>
 * 4. You can find your extension ID in chrome://extensions
 */
export async function initWepin(): Promise<boolean> {
  try {
    initializationError = null;

    // Check if running in extension context
    if (isExtension) {
      const extensionId = getExtensionId();
      const extensionDomain = `chrome-extension://${extensionId}`;

      console.log("[VeTerex] Running in Chrome extension context");
      console.log(`[VeTerex] Extension ID: ${extensionId}`);
      console.log(`[VeTerex] To enable Wepin wallet in this extension:`);
      console.log(`  1. Go to Wepin Workspace: https://workspace.wepin.io`);
      console.log(`  2. Add this domain to your app: ${extensionDomain}`);
      console.log(`  3. Reload the extension after adding the domain`);
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
    const errorMessage = error?.message || error?.response?.data?.message || "";
    const isDomainError =
      errorMessage.includes("Invalid domain") ||
      errorMessage.includes("domain") ||
      errorMessage.includes("404") ||
      errorMessage.includes("not registered");

    if (isDomainError && isExtension) {
      const extensionId = getExtensionId();
      const extensionDomain = `chrome-extension://${extensionId}`;

      initializationError = `Wallet requires domain registration. Please add "${extensionDomain}" to your Wepin Workspace domains, or use the web version.`;

      console.error("[VeTerex] Domain validation failed for Chrome extension.");
      console.error("[VeTerex] Please add this domain to Wepin Workspace:");
      console.error(`  Domain: ${extensionDomain}`);

      throw new Error(initializationError);
    }

    initializationError = error?.message || "Failed to initialize Wepin SDK";
    return false;
  }
}

/**
 * Get the initialization error message if any
 */
export function getWepinInitError(): string | null {
  return initializationError;
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
