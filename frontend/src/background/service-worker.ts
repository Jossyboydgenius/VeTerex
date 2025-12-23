// VeTerex Chrome Extension - Background Service Worker

// Track active tracking sessions
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

const activeSessions = new Map<number, TrackingSession>();

// Extension lifecycle events
chrome.runtime.onInstalled.addListener((details) => {
  console.log("[VeTerex] Extension installed:", details.reason);

  if (details.reason === "install") {
    // First time installation - show onboarding
    chrome.storage.local.set({
      installed: true,
      installDate: new Date().toISOString(),
      version: chrome.runtime.getManifest().version,
      trackingEnabled: true,
      notificationsEnabled: true,
    });

    // Create context menus
    setupContextMenus();
  }

  if (details.reason === "update") {
    console.log(
      "[VeTerex] Extension updated to:",
      chrome.runtime.getManifest().version
    );
  }
});

// Setup context menus
function setupContextMenus() {
  chrome.contextMenus.create({
    id: "veterex-search",
    title: "Search on VeTerex",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "veterex-track",
    title: "Track this media with VeTerex",
    contexts: ["page"],
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "veterex-search" && info.selectionText) {
    // Open popup with search query
    const searchText = encodeURIComponent(info.selectionText);
    chrome.action.setPopup({
      popup: `index.html#/explore?search=${searchText}`,
    });
    chrome.action.openPopup();
  }

  if (info.menuItemId === "veterex-track" && tab?.id) {
    // Request manual tracking on current page
    chrome.tabs.sendMessage(tab.id, { type: "REQUEST_TRACKING" });
  }
});

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[VeTerex] Message received:", message.type);

  switch (message.type) {
    // User data management
    case "GET_USER_DATA":
      chrome.storage.local.get(["userData"], (result) => {
        sendResponse({ success: true, data: result.userData });
      });
      return true;

    case "SAVE_USER_DATA":
      chrome.storage.local.set({ userData: message.data }, () => {
        sendResponse({ success: true });
      });
      return true;

    case "CLEAR_USER_DATA":
      chrome.storage.local.remove(["userData"], () => {
        sendResponse({ success: true });
      });
      return true;

    // Completions management
    case "GET_COMPLETIONS":
      chrome.storage.local.get(["completions"], (result) => {
        sendResponse({ success: true, data: result.completions || [] });
      });
      return true;

    case "ADD_COMPLETION":
      chrome.storage.local.get(["completions"], (result) => {
        const completions = result.completions || [];
        completions.push({
          ...message.data,
          id: `completion-${Date.now()}`,
          addedAt: new Date().toISOString(),
        });
        chrome.storage.local.set({ completions }, () => {
          sendResponse({ success: true });

          // Update badge
          updateBadge(completions.length);
        });
      });
      return true;

    // Media tracking messages from content script
    case "TRACKING_START":
      if (sender.tab?.id) {
        const session: TrackingSession = {
          tabId: sender.tab.id,
          mediaInfo: message.data.mediaInfo,
          startTime: message.data.startTime,
          watchTime: 0,
          completed: false,
        };
        activeSessions.set(sender.tab.id, session);
        console.log("[VeTerex] Tracking started:", session.mediaInfo.title);
      }
      sendResponse({ success: true });
      return true;

    case "TRACKING_UPDATE":
      if (sender.tab?.id) {
        const session = activeSessions.get(sender.tab.id);
        if (session) {
          session.watchTime = message.data.watchTime;
          session.mediaInfo.progress = message.data.mediaInfo.progress;
          console.log("[VeTerex] Tracking update:", {
            title: session.mediaInfo.title,
            progress: session.mediaInfo.progress,
            watchTime: session.watchTime,
          });
        }
      }
      sendResponse({ success: true });
      return true;

    case "TRACKING_END":
      if (sender.tab?.id) {
        const session = activeSessions.get(sender.tab.id);
        if (session) {
          console.log("[VeTerex] Tracking ended:", {
            title: session.mediaInfo.title,
            totalWatchTime: message.data.watchTime,
          });
          activeSessions.delete(sender.tab.id);
        }
      }
      sendResponse({ success: true });
      return true;

    case "MEDIA_COMPLETED":
      console.log("[VeTerex] Media completed!", message.data);

      // Store pending completion
      chrome.storage.local.get(["pendingCompletions"], (result) => {
        const pending = result.pendingCompletions || [];
        pending.push({
          ...message.data,
          detectedAt: new Date().toISOString(),
        });
        chrome.storage.local.set({ pendingCompletions: pending });
      });

      // Show notification
      chrome.storage.local.get(["notificationsEnabled"], (result) => {
        if (result.notificationsEnabled !== false) {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon128.png",
            title: "Media Completed! 🎉",
            message: `You finished "${message.data.title}". Mint an NFT to record your achievement!`,
            priority: 2,
          });
        }
      });

      // Update badge
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "#00d4ff" });

      sendResponse({ success: true });
      return true;

    case "OPEN_MINT_MODAL":
      // Store the media to mint and open extension popup
      chrome.storage.local.set({ pendingMint: message.data }, () => {
        chrome.action.setPopup({ popup: `index.html#/mint` });
        chrome.action.openPopup();
      });
      sendResponse({ success: true });
      return true;

    // Get pending completions
    case "GET_PENDING_COMPLETIONS":
      chrome.storage.local.get(["pendingCompletions"], (result) => {
        sendResponse({ success: true, data: result.pendingCompletions || [] });
      });
      return true;

    case "CLEAR_PENDING_COMPLETIONS":
      chrome.storage.local.remove(["pendingCompletions"], () => {
        chrome.action.setBadgeText({ text: "" });
        sendResponse({ success: true });
      });
      return true;

    // Settings
    case "GET_SETTINGS":
      chrome.storage.local.get(
        ["trackingEnabled", "notificationsEnabled"],
        (result) => {
          sendResponse({
            success: true,
            data: {
              trackingEnabled: result.trackingEnabled ?? true,
              notificationsEnabled: result.notificationsEnabled ?? true,
            },
          });
        }
      );
      return true;

    case "UPDATE_SETTINGS":
      chrome.storage.local.set(message.data, () => {
        sendResponse({ success: true });
      });
      return true;

    // Active sessions
    case "GET_ACTIVE_SESSIONS":
      const sessions = Array.from(activeSessions.values());
      sendResponse({ success: true, data: sessions });
      return true;

    default:
      sendResponse({ success: false, error: "Unknown message type" });
  }
});

// Update extension badge with completion count
function updateBadge(count: number) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "#7c3aed" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// Handle tab updates (when URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete") {
    // Session will be managed by content script
    console.log("[VeTerex] Tab updated:", tabId);
  }
});

// Handle tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeSessions.has(tabId)) {
    console.log("[VeTerex] Tab closed, ending session:", tabId);
    activeSessions.delete(tabId);
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener(() => {
  chrome.action.openPopup();
});

export {};
