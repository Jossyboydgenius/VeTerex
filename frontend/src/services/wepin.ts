import type { WepinUser, WepinAccount } from '@/types'

// Wepin SDK Configuration
const WEPIN_APP_ID = import.meta.env.VITE_WEPIN_APP_ID || 'your-wepin-app-id'
const WEPIN_APP_KEY = import.meta.env.VITE_WEPIN_APP_KEY || 'your-wepin-api-key'

// WepinSDK instance
let wepinSDK: any = null

/**
 * Initialize Wepin SDK
 * Must be called before any other Wepin operations
 */
export async function initWepin(): Promise<boolean> {
  try {
    // Dynamic import for CSR environment
    const { WepinSDK } = await import('@wepin/sdk-js')
    
    wepinSDK = new WepinSDK({
      appId: WEPIN_APP_ID,
      appKey: WEPIN_APP_KEY,
    })
    
    await wepinSDK.init({
      type: 'hide',
      defaultLanguage: 'en',
      defaultCurrency: 'USD',
      loginProviders: ['google', 'apple', 'discord']
    })
    
    console.log('[VeTerex] Wepin SDK initialized successfully')
    return true
  } catch (error) {
    console.error('[VeTerex] Failed to initialize Wepin SDK:', error)
    return false
  }
}

/**
 * Check if Wepin SDK is initialized
 */
export function isWepinInitialized(): boolean {
  return wepinSDK?.isInitialized() ?? false
}

/**
 * Get current Wepin lifecycle status
 */
export async function getWepinStatus(): Promise<string> {
  if (!wepinSDK) return 'not_initialized'
  return await wepinSDK.getStatus()
}

/**
 * Login with Wepin Widget UI
 * Opens the Wepin login modal
 */
export async function loginWithWepin(email?: string): Promise<WepinUser | null> {
  try {
    if (!wepinSDK) {
      await initWepin()
    }
    
    const userInfo = email 
      ? await wepinSDK.loginWithUI({ email })
      : await wepinSDK.loginWithUI()
    
    console.log('[VeTerex] User logged in:', userInfo)
    return userInfo as WepinUser
  } catch (error) {
    console.error('[VeTerex] Login failed:', error)
    throw error
  }
}

/**
 * Register user with Wepin if needed
 */
export async function registerWithWepin(): Promise<WepinUser | null> {
  try {
    if (!wepinSDK) {
      throw new Error('Wepin SDK not initialized')
    }
    
    const userInfo = await wepinSDK.register()
    console.log('[VeTerex] User registered:', userInfo)
    return userInfo as WepinUser
  } catch (error) {
    console.error('[VeTerex] Registration failed:', error)
    throw error
  }
}

/**
 * Open Wepin Widget
 */
export async function openWepinWidget(): Promise<void> {
  if (!wepinSDK) {
    throw new Error('Wepin SDK not initialized')
  }
  await wepinSDK.openWidget()
}

/**
 * Close Wepin Widget
 */
export function closeWepinWidget(): void {
  if (wepinSDK) {
    wepinSDK.closeWidget()
  }
}

/**
 * Get user accounts from Wepin
 */
export async function getWepinAccounts(networks?: string[]): Promise<WepinAccount[]> {
  try {
    if (!wepinSDK) {
      throw new Error('Wepin SDK not initialized')
    }
    
    const options = networks ? { networks, withEoa: true } : undefined
    const accounts = await wepinSDK.getAccounts(options)
    
    console.log('[VeTerex] Accounts retrieved:', accounts)
    return accounts as WepinAccount[]
  } catch (error) {
    console.error('[VeTerex] Failed to get accounts:', error)
    throw error
  }
}

/**
 * Get account balance
 */
export async function getAccountBalance(accounts?: WepinAccount[]): Promise<any[]> {
  try {
    if (!wepinSDK) {
      throw new Error('Wepin SDK not initialized')
    }
    
    const balance = accounts 
      ? await wepinSDK.getBalance(accounts)
      : await wepinSDK.getBalance()
    
    return balance
  } catch (error) {
    console.error('[VeTerex] Failed to get balance:', error)
    throw error
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
      throw new Error('Wepin SDK not initialized')
    }
    
    const result = await wepinSDK.send({
      account: {
        address: account.address,
        network: account.network,
      },
      txData: {
        to,
        amount,
      }
    })
    
    console.log('[VeTerex] Transaction sent:', result)
    return result
  } catch (error) {
    console.error('[VeTerex] Transaction failed:', error)
    throw error
  }
}

/**
 * Logout from Wepin
 */
export async function logoutWepin(): Promise<void> {
  try {
    if (wepinSDK) {
      await wepinSDK.logout()
      console.log('[VeTerex] User logged out')
    }
  } catch (error) {
    console.error('[VeTerex] Logout failed:', error)
    throw error
  }
}

/**
 * Finalize Wepin SDK
 */
export function finalizeWepin(): void {
  if (wepinSDK) {
    wepinSDK.finalize()
    wepinSDK = null
    console.log('[VeTerex] Wepin SDK finalized')
  }
}

/**
 * Get login session tokens
 */
export async function getLoginSession(): Promise<any> {
  try {
    if (!wepinSDK) {
      throw new Error('Wepin SDK not initialized')
    }
    
    return await wepinSDK.getLoginSession()
  } catch (error) {
    console.error('[VeTerex] Failed to get login session:', error)
    throw error
  }
}
