// Content script for VeTerex auth page
// Relays Wepin authentication from auth page to background script
// NOTE: This is ONLY for Wepin auth via localhost/auth page
// VeryChat authentication happens directly in the extension popup

console.log("[VeTerex Auth Relay] Script loaded for Wepin auth only");

// Listen for postMessage from auth page
window.addEventListener("message", (event) => {
  // Only accept messages from same origin
  if (event.origin !== window.location.origin) {
    return;
  }

  console.log("[VeTerex Auth Content] Received message:", event.data);

  // Check if it's a Wepin auth success message
  if (
    event.data?.type === "WEPIN_AUTH_SUCCESS" &&
    event.data?.source === "veterex-auth"
  ) {
    // Validate it's actually a Wepin session (not VeryChat)
    if (event.data.data?.authMethod !== "wepin") {
      console.warn(
        "[VeTerex Auth Relay] Ignoring non-Wepin auth:",
        event.data.data?.authMethod
      );
      return;
    }

    console.log(
      "[VeTerex Auth Relay] Wepin auth success, relaying to background"
    );

    // Send to background script
    chrome.runtime.sendMessage(
      {
        type: "WEPIN_AUTH_SUCCESS",
        data: event.data.data,
      },
      (response) => {
        console.log("[VeTerex Auth Relay] Background response:", response);
      }
    );
  }
});

// Poll localStorage for session data (backup method)
let pollCount = 0;
const maxPolls = 20; // 10 seconds max
const pollInterval = setInterval(() => {
  pollCount++;

  const session = localStorage.getItem("veterex_wepin_session");
  if (session) {
    console.log("[VeTerex Auth Content] Found session in localStorage");
    clearInterval(pollInterval);

    try {
      const sessionData = JSON.parse(session);
      chrome.runtime.sendMessage(
        {
          type: "WEPIN_AUTH_SUCCESS",
          data: sessionData,
        },
        (response) => {
          console.log("[VeTerex Auth Content] Session synced:", response);
        }
      );
    } catch (error) {
      console.error("[VeTerex Auth Content] Failed to parse session:", error);
    }
  }

  if (pollCount >= maxPolls) {
    clearInterval(pollInterval);
    console.log("[VeTerex Auth Content] Polling stopped");
  }
}, 500);
