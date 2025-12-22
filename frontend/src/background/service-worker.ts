// VeTerex Chrome Extension - Background Service Worker

// Extension lifecycle events
chrome.runtime.onInstalled.addListener((details) => {
  console.log("[VeTerex] Extension installed:", details.reason);

  if (details.reason === "install") {
    // First time installation
    chrome.storage.local.set({
      installed: true,
      installDate: new Date().toISOString(),
      version: chrome.runtime.getManifest().version,
    });
  }
});

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("[VeTerex] Message received:", message);

  switch (message.type) {
    case "GET_USER_DATA":
      chrome.storage.local.get(["userData"], (result) => {
        sendResponse({ success: true, data: result.userData });
      });
      return true; // Async response

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

    case "GET_COMPLETIONS":
      chrome.storage.local.get(["completions"], (result) => {
        sendResponse({ success: true, data: result.completions || [] });
      });
      return true;

    case "ADD_COMPLETION":
      chrome.storage.local.get(["completions"], (result) => {
        const completions = result.completions || [];
        completions.push(message.data);
        chrome.storage.local.set({ completions }, () => {
          sendResponse({ success: true });
        });
      });
      return true;

    default:
      sendResponse({ success: false, error: "Unknown message type" });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((_tab) => {
  // This won't fire if we have a popup, but useful for programmatic opening
  console.log("[VeTerex] Extension icon clicked");
});

// Context menu for quick actions (optional)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "veterex-search",
    title: "Search on VeTerex",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, _tab) => {
  if (info.menuItemId === "veterex-search" && info.selectionText) {
    // Open popup with search query
    const searchText = encodeURIComponent(info.selectionText);
    chrome.action.setPopup({ popup: `index.html?search=${searchText}` });
    chrome.action.openPopup();
  }
});

export {};
