/**
 * Chrome Extension Tracking Service
 * Communicates with background script for media tracking
 */

// Check if we're running as an extension
export const isExtension =
  typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;

interface TrackingSession {
  tabId: number;
  mediaInfo: {
    platform: string;
    type: string;
    title: string;
    url: string;
    progress?: number;
    timestamp: number;
  };
  startTime: number;
  watchTime: number;
  completed: boolean;
}

interface PendingCompletion {
  platform: string;
  type: string;
  title: string;
  url: string;
  watchTime: number;
  detectedAt: string;
}

interface TrackingSettings {
  trackingEnabled: boolean;
  notificationsEnabled: boolean;
}

/**
 * Send message to background script
 */
async function sendMessage<T>(type: string, data?: any): Promise<T> {
  if (!isExtension) {
    console.warn("[Tracking] Not running as extension");
    throw new Error("Not running as extension");
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (response?.success) {
        resolve(response.data);
      } else {
        reject(new Error(response?.error || "Unknown error"));
      }
    });
  });
}

/**
 * Get active tracking sessions
 */
export async function getActiveSessions(): Promise<TrackingSession[]> {
  try {
    return await sendMessage<TrackingSession[]>("GET_ACTIVE_SESSIONS");
  } catch (error) {
    console.error("[Tracking] Failed to get active sessions:", error);
    return [];
  }
}

/**
 * Get pending completions (media that was completed but not minted)
 */
export async function getPendingCompletions(): Promise<PendingCompletion[]> {
  try {
    return await sendMessage<PendingCompletion[]>("GET_PENDING_COMPLETIONS");
  } catch (error) {
    console.error("[Tracking] Failed to get pending completions:", error);
    return [];
  }
}

/**
 * Clear pending completions
 */
export async function clearPendingCompletions(): Promise<void> {
  try {
    await sendMessage("CLEAR_PENDING_COMPLETIONS");
  } catch (error) {
    console.error("[Tracking] Failed to clear pending completions:", error);
  }
}

/**
 * Get tracking settings
 */
export async function getTrackingSettings(): Promise<TrackingSettings> {
  try {
    return await sendMessage<TrackingSettings>("GET_SETTINGS");
  } catch (error) {
    console.error("[Tracking] Failed to get settings:", error);
    return { trackingEnabled: true, notificationsEnabled: true };
  }
}

/**
 * Update tracking settings
 */
export async function updateTrackingSettings(
  settings: Partial<TrackingSettings>
): Promise<void> {
  try {
    await sendMessage("UPDATE_SETTINGS", settings);
  } catch (error) {
    console.error("[Tracking] Failed to update settings:", error);
  }
}

/**
 * Get all stored completions
 */
export async function getStoredCompletions(): Promise<any[]> {
  try {
    return await sendMessage<any[]>("GET_COMPLETIONS");
  } catch (error) {
    console.error("[Tracking] Failed to get completions:", error);
    return [];
  }
}

/**
 * Add a completion
 */
export async function addCompletion(completion: any): Promise<void> {
  try {
    await sendMessage("ADD_COMPLETION", completion);
  } catch (error) {
    console.error("[Tracking] Failed to add completion:", error);
    throw error;
  }
}

/**
 * Get user data from storage
 */
export async function getUserData(): Promise<any> {
  try {
    return await sendMessage<any>("GET_USER_DATA");
  } catch (error) {
    console.error("[Tracking] Failed to get user data:", error);
    return null;
  }
}

/**
 * Save user data to storage
 */
export async function saveUserData(data: any): Promise<void> {
  try {
    await sendMessage("SAVE_USER_DATA", data);
  } catch (error) {
    console.error("[Tracking] Failed to save user data:", error);
    throw error;
  }
}

/**
 * Clear user data
 */
export async function clearUserData(): Promise<void> {
  try {
    await sendMessage("CLEAR_USER_DATA");
  } catch (error) {
    console.error("[Tracking] Failed to clear user data:", error);
  }
}
