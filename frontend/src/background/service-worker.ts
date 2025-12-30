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
    duration?: number;
    thumbnail?: string;
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
        const trackingData = message.data;
        const session: TrackingSession = {
          tabId: sender.tab.id,
          mediaInfo: {
            platform: trackingData.platform,
            type: trackingData.type,
            title: trackingData.title,
            url: trackingData.url,
            progress: trackingData.progress || 0,
            timestamp: Date.now(),
          },
          startTime: Date.now(),
          watchTime: 0,
          completed: false,
        };
        activeSessions.set(sender.tab.id, session);
        console.log("[VeTerex] Tracking started:", session.mediaInfo.title);

        // Store in chrome.storage for popup access
        updateActiveTrackingStorage();
      }
      sendResponse({ success: true });
      return true;

    case "TRACKING_UPDATE":
      if (sender.tab?.id) {
        const session = activeSessions.get(sender.tab.id);
        const updateData = message.data;
        if (session) {
          session.watchTime = updateData.watchTime || session.watchTime || 0;
          session.mediaInfo.progress = updateData.progress || 0;
          session.mediaInfo.duration =
            updateData.duration || session.mediaInfo.duration || 0;
          session.mediaInfo.thumbnail =
            updateData.thumbnail || session.mediaInfo.thumbnail || "";
          session.completed = updateData.completed || session.completed;
          console.log("[VeTerex] Tracking update:", {
            title: session.mediaInfo.title,
            progress: session.mediaInfo.progress,
            watchTime: session.watchTime,
          });

          // Update storage for popup
          updateActiveTrackingStorage();
        } else {
          // Session doesn't exist, create one from update data
          const newSession: TrackingSession = {
            tabId: sender.tab.id,
            mediaInfo: {
              platform: updateData.platform || "unknown",
              type: updateData.type || "video",
              title: updateData.title || "Unknown",
              url: updateData.url || "",
              progress: updateData.progress || 0,
              duration: updateData.duration || 0,
              thumbnail: updateData.thumbnail || "",
              timestamp: Date.now(),
            },
            startTime: updateData.startTime || Date.now(),
            watchTime: updateData.watchTime || 0,
            completed: updateData.completed || false,
          };
          activeSessions.set(sender.tab.id, newSession);
          console.log(
            "[VeTerex] Created new session from update:",
            newSession.mediaInfo.title
          );
          updateActiveTrackingStorage();
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
            totalWatchTime: message.data?.watchTime || session.watchTime,
          });
          activeSessions.delete(sender.tab.id);
          updateActiveTrackingStorage();
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
      {
        const sessions = Array.from(activeSessions.values());
        sendResponse({ success: true, data: sessions });
        return true;
      }

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

// Update active tracking in chrome.storage for popup access
function updateActiveTrackingStorage() {
  const sessions = Array.from(activeSessions.values());

  // Deduplicate by URL (same video on different tabs shouldn't create duplicates)
  const uniqueSessions = new Map<string, (typeof sessions)[0]>();
  for (const session of sessions) {
    const existingSession = uniqueSessions.get(session.mediaInfo.url);
    if (!existingSession || session.watchTime > existingSession.watchTime) {
      uniqueSessions.set(session.mediaInfo.url, session);
    }
  }

  const trackingData = Array.from(uniqueSessions.values()).map((session) => ({
    id: `track-${session.tabId}-${session.startTime}`,
    platform: session.mediaInfo.platform,
    type: session.mediaInfo.type,
    title: session.mediaInfo.title,
    url: session.mediaInfo.url,
    progress: session.mediaInfo.progress || 0,
    duration: session.mediaInfo.duration || 0,
    watchTime: Math.round(session.watchTime),
    thumbnail: session.mediaInfo.thumbnail || "",
    completed: session.completed,
    startTime: session.startTime,
    lastUpdate: Date.now(),
  }));

  chrome.storage.local.set({ activeTracking: trackingData }, () => {
    console.log(
      "[VeTerex] Updated active tracking storage:",
      trackingData.length,
      "sessions"
    );
  });
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

// Dynamic content script registration for granted origins
chrome.permissions.getAll().then((p) => {
  const origins = p.origins || [];
  const manifest = chrome.runtime.getManifest();
  const scriptPaths = ((manifest.content_scripts || []).flatMap((cs) => cs.js || [])
    .filter((s): s is string => typeof s === "string")) as string[];
  if (origins.length && scriptPaths.length) {
    chrome.scripting.registerContentScripts([
      {
        id: "veterex-dynamic",
        matches: origins,
        js: scriptPaths,
        runAt: "document_idle",
      },
    ]);
  }
});

chrome.permissions.onAdded.addListener(async (p) => {
  const origins = p.origins || [];
  const manifest = chrome.runtime.getManifest();
  const scriptPaths = ((manifest.content_scripts || []).flatMap((cs) => cs.js || [])
    .filter((s): s is string => typeof s === "string")) as string[];
  if (origins.length && scriptPaths.length) {
    chrome.scripting.registerContentScripts([
      {
        id: "veterex-dynamic",
        matches: origins,
        js: scriptPaths,
        runAt: "document_idle",
      },
    ]);

    // Fallback: inject into active tab immediately
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab?.id) {
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: scriptPaths });
      } catch {
        // ignore
      }
    }
  }
});

chrome.permissions.onRemoved.addListener(() => {
  chrome.scripting.unregisterContentScripts({ ids: ["veterex-dynamic"] });
});
