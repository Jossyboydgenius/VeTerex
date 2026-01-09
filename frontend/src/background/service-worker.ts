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
    // Wepin authentication flow - check localStorage periodically
    case "CHECK_WEPIN_SESSION":
      // This is called from content script when auth page posts message
      chrome.storage.local.get(["veterex_wepin_session"], (result) => {
        if (result.veterex_wepin_session) {
          console.log("[VeTerex] Wepin session found in localStorage");
          sendResponse({
            success: true,
            session: result.veterex_wepin_session,
          });
        } else {
          sendResponse({ success: false });
        }
      });
      return true;

    case "WEPIN_AUTH_SUCCESS":
      // Store authenticated session data from auth page
      const sessionData = message.data;

      chrome.storage.local.set({ veterex_session: sessionData }, () => {
        console.log("[VeTerex] Wepin auth success, session stored");

        // Notify popup to update UI
        chrome.runtime
          .sendMessage({ type: "SESSION_UPDATED", data: sessionData })
          .catch(() => {
            // Ignore if popup not open
          });

        sendResponse({ success: true });
      });
      return true;

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
        console.log("[VeTerex] TRACKING_START received:", {
          tabId: sender.tab.id,
          data: trackingData,
        });
        const session: TrackingSession = {
          tabId: sender.tab.id,
          mediaInfo: {
            platform: trackingData.platform,
            type: trackingData.type,
            title: trackingData.title,
            url: trackingData.url,
            progress: trackingData.progress || 0,
            duration: trackingData.duration || 0,
            thumbnail: trackingData.thumbnail || "",
            timestamp: Date.now(),
            ...(trackingData.id && { id: trackingData.id }),
          } as any,
          startTime: trackingData.startTime || Date.now(),
          watchTime: trackingData.watchTime || 0,
          completed: false,
        };
        activeSessions.set(sender.tab.id, session);
        console.log(
          "[VeTerex] Tracking started:",
          session.mediaInfo.title,
          "Total sessions:",
          activeSessions.size
        );

        // Store in chrome.storage for popup access
        updateActiveTrackingStorage();
      } else {
        console.error("[VeTerex] TRACKING_START: No tab ID in sender");
      }
      sendResponse({ success: true });
      return true;

    case "TRACKING_UPDATE":
      if (sender.tab?.id) {
        const session = activeSessions.get(sender.tab.id);
        const updateData = message.data;
        console.log("[VeTerex] TRACKING_UPDATE received:", {
          tabId: sender.tab.id,
          hasSession: !!session,
          data: updateData,
        });
        if (session) {
          session.watchTime = updateData.watchTime || session.watchTime || 0;
          session.mediaInfo.progress = updateData.progress || 0;
          session.mediaInfo.duration =
            updateData.duration || session.mediaInfo.duration || 0;
          session.mediaInfo.thumbnail =
            updateData.thumbnail || session.mediaInfo.thumbnail || "";
          session.mediaInfo.title = updateData.title || session.mediaInfo.title;
          session.completed = updateData.completed || session.completed;

          // Store the ID from content script if provided
          if (updateData.id) {
            (session.mediaInfo as any).id = updateData.id;
          }

          console.log("[VeTerex] Tracking update:", {
            title: session.mediaInfo.title,
            progress: session.mediaInfo.progress,
            watchTime: session.watchTime,
            totalSessions: activeSessions.size,
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
              timestamp: updateData.lastUpdate || Date.now(),
              ...(updateData.id && { id: updateData.id }),
            } as any,
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

    case "OPEN_EXTENSION_POPUP":
      // Open extension popup to a specific route
      {
        const route = message.data?.route || "/";
        console.log("[VeTerex] Opening extension popup to route:", route);
        chrome.action.setPopup({ popup: `index.html#${route}` });
        try {
          chrome.action
            .openPopup()
            .then(() => {
              console.log("[VeTerex] Popup opened successfully");
              sendResponse({ success: true, message: "Popup opened" });
            })
            .catch((err) => {
              console.log("[VeTerex] Could not open popup:", err);
              sendResponse({
                success: false,
                message: "Could not open popup",
                error: err,
              });
            });
        } catch (e) {
          console.log("[VeTerex] openPopup error:", e);
          sendResponse({
            success: false,
            message: "openPopup failed",
            error: e,
          });
        }
      }
      return true;

    case "PENDING_MINT":
      // Store the pending mint data and open extension popup to mint page
      chrome.storage.local.set({ pendingMint: message.data }, () => {
        console.log("[VeTerex] Pending mint stored:", message.data);
        chrome.action.setPopup({ popup: `index.html#/mint` });
        // Try to open popup, but it may fail if not triggered by user action
        try {
          chrome.action.openPopup().catch(() => {
            console.log("[VeTerex] Could not open popup programmatically");
          });
        } catch (e) {
          console.log("[VeTerex] openPopup not available:", e);
        }
        sendResponse({ success: true, message: "Mint data stored" });
      });
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
    case "GET_ACTIVE_SESSIONS": {
      const sessions = Array.from(activeSessions.values());
      sendResponse({ success: true, data: sessions });
      return true;
    }

    // Series bookmarks
    case "ADD_SERIES_BOOKMARK":
      chrome.storage.local.get(["seriesBookmarks"], (result) => {
        const list = result.seriesBookmarks || [];
        const entry = {
          ...message.data,
          lastChecked: new Date().toISOString(),
          hasUpdate: false,
        };
        chrome.storage.local.set({ seriesBookmarks: [...list, entry] }, () => {
          sendResponse({ success: true });
        });
      });
      return true;

    case "CHECK_SERIES_UPDATES":
      chrome.storage.local.get(["seriesBookmarks"], async (result) => {
        const list = (result.seriesBookmarks || []) as Array<any>;
        const updated: Array<any> = [];
        let updates = 0;
        for (const b of list) {
          let hasUpdate = false;
          let latestEpisode: string | undefined;
          try {
            const res = await fetch(b.url, { method: "GET" });
            if (res.ok) {
              const text = await res.text();
              const host = (() => {
                try {
                  return new URL(b.url).hostname;
                } catch {
                  return "";
                }
              })();

              const nums = Array.from(
                text.matchAll(
                  /(?:Episode|Ep\.|Chapter|Ch\.)\s*(\d+(?:\.\d+)?)/gi
                )
              ).map((m) => m[1]);
              if (nums.length)
                latestEpisode = nums.sort(
                  (a, b) => parseFloat(b) - parseFloat(a)
                )[0];

              if (/webtoons\.com/i.test(host)) {
                // webtoons: presence of episode links indicates potential updates
                hasUpdate =
                  !!latestEpisode &&
                  (!b.currentChapter ||
                    parseFloat(latestEpisode) > parseFloat(b.currentChapter));
              } else if (/mangadex\.org/i.test(host)) {
                hasUpdate =
                  !!latestEpisode &&
                  (!b.currentChapter ||
                    parseFloat(latestEpisode) > parseFloat(b.currentChapter));
              } else if (/manganato|mangakakalot|manganelo/i.test(host)) {
                hasUpdate =
                  !!latestEpisode &&
                  (!b.currentChapter ||
                    parseFloat(latestEpisode) > parseFloat(b.currentChapter));
              } else {
                // generic
                hasUpdate =
                  !!latestEpisode &&
                  (!b.currentChapter ||
                    parseFloat(latestEpisode) > parseFloat(b.currentChapter));
              }
            }
          } catch (e) {
            console.warn("[VeTerex] series check failed", e);
          }
          if (hasUpdate) updates++;
          updated.push({
            ...b,
            hasUpdate,
            latestEpisode,
            lastChecked: new Date().toISOString(),
          });
        }
        chrome.storage.local.set({ seriesBookmarks: updated }, () => {
          if (updates > 0) {
            chrome.action.setBadgeText({ text: "NEW" });
            chrome.action.setBadgeBackgroundColor({ color: "#7c3aed" });
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icons/icon128.png",
              title: "Series Updates",
              message: `${updates} series may have new chapters`,
              priority: 1,
            });
          }
          sendResponse({ success: true, count: updated.length });
        });
      });
      return true;

    case "MARK_ALL_SERIES_READ":
      chrome.storage.local.get(["seriesBookmarks"], (result) => {
        const list = (result.seriesBookmarks || []) as Array<any>;
        const updated = list.map((b) => ({
          ...b,
          currentChapter: b.latestEpisode || b.currentChapter,
          hasUpdate: false,
        }));
        chrome.storage.local.set({ seriesBookmarks: updated }, () => {
          chrome.action.setBadgeText({ text: "" });
          sendResponse({ success: true });
        });
      });
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

  const trackingData = Array.from(uniqueSessions.values()).map((session) => {
    // Use ID from mediaInfo if available, otherwise generate one
    const sessionId =
      (session.mediaInfo as any).id ||
      `track-${session.tabId}-${session.startTime}`;

    return {
      id: sessionId,
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
    };
  });

  chrome.storage.local.set({ activeTracking: trackingData }, () => {
    console.log(
      "[VeTerex] Updated active tracking storage:",
      trackingData.length,
      "sessions",
      trackingData
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

// Scheduler: periodically check series updates
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("check-series-updates", { periodInMinutes: 60 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "check-series-updates") {
    chrome.runtime.sendMessage({ type: "CHECK_SERIES_UPDATES" });
  }
});

export {};

// Dynamic content script registration for granted origins
chrome.permissions.getAll().then((p) => {
  const origins = p.origins || [];
  const manifest = chrome.runtime.getManifest();
  const scriptPaths = (manifest.content_scripts || [])
    .flatMap((cs) => cs.js || [])
    .filter((s): s is string => typeof s === "string") as string[];
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
  const scriptPaths = (manifest.content_scripts || [])
    .flatMap((cs) => cs.js || [])
    .filter((s): s is string => typeof s === "string") as string[];
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
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: scriptPaths,
        });
      } catch (e) {
        console.warn("[VeTerex] executeScript failed", e);
      }
    }
  }
});

chrome.permissions.onRemoved.addListener(() => {
  chrome.scripting.unregisterContentScripts({ ids: ["veterex-dynamic"] });
});

// ==========================================
// Extension Bridge - Session Sync
// ==========================================

// Session storage key
const SESSION_STORAGE_KEY = "veterex_session";

// Message types for bridge communication
const BRIDGE_MESSAGE_TYPES = {
  SESSION_DATA: "VETEREX_SESSION_DATA",
  REQUEST_SESSION: "VETEREX_REQUEST_SESSION",
  SESSION_RECEIVED: "VETEREX_SESSION_RECEIVED",
};

// Handle connections from content scripts
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "veterex-bridge") return;

  console.log("[VeTerex Bridge] Content script connected");

  // Listen for messages from content script
  port.onMessage.addListener((message) => {
    if (message.type === BRIDGE_MESSAGE_TYPES.SESSION_DATA) {
      // Save session to chrome.storage
      chrome.storage.local.set({
        [SESSION_STORAGE_KEY]: message.data,
      });
      console.log("[VeTerex Bridge] Session saved from content script");
    }
  });

  // Send current session to newly connected content script
  chrome.storage.local.get([SESSION_STORAGE_KEY], (result) => {
    if (result[SESSION_STORAGE_KEY]) {
      port.postMessage({
        type: BRIDGE_MESSAGE_TYPES.SESSION_DATA,
        data: result[SESSION_STORAGE_KEY],
      });
    }
  });
});

// Handle external messages from web app (requires externally_connectable in manifest)
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    console.log("[VeTerex Bridge] External message from:", sender.url);

    // Handle SESSION_SYNC from web app (Wepin auth redirect flow)
    if (request.type === "SESSION_SYNC" && request.source === "veterex-web") {
      console.log("[VeTerex Bridge] Received session sync from web app");
      chrome.storage.local.set({
        [SESSION_STORAGE_KEY]: request.data,
      });

      // Notify any open extension popup to refresh
      chrome.runtime
        .sendMessage({
          type: "SESSION_UPDATED",
          data: request.data,
        })
        .catch(() => {
          // Ignore error if popup is not open
        });

      sendResponse({ success: true });
      return;
    }

    if (request.type === BRIDGE_MESSAGE_TYPES.SESSION_DATA) {
      // Save session to chrome.storage
      chrome.storage.local.set({
        [SESSION_STORAGE_KEY]: request.data,
      });
      sendResponse({ success: true });
      return;
    }

    if (request.type === BRIDGE_MESSAGE_TYPES.REQUEST_SESSION) {
      // Return session data
      chrome.storage.local.get([SESSION_STORAGE_KEY], (result) => {
        sendResponse({
          success: true,
          data: result[SESSION_STORAGE_KEY] || null,
        });
      });
      return true; // Keep message channel open for async response
    }
  }
);

console.log("[VeTerex Bridge] Background bridge initialized");
