/**
 * VeTerex Track Series Button
 * Floating button for tracking manga/webtoon series
 */

import { injectStyles } from "./styles";
import { showSuccessToast, showErrorToast } from "./toast";

interface SeriesEntry {
  id: string;
  title: string;
  url: string;
  currentChapter: string;
  status: string;
  lastChecked?: string;
  hasUpdate?: boolean;
}

interface ChapterInfo {
  chapter: string;
  title?: string;
  episode?: string;
}

/**
 * Create and show the Track Series floating button
 */
export function showTrackSeriesButton(
  title: string,
  getChapterInfo: () => ChapterInfo | null
): HTMLButtonElement | null {
  // Don't create if already exists
  const existing = document.getElementById("veterex-track-series");
  if (existing) return null;

  injectStyles();

  // Get fruit icon URL
  const fruitIconUrl = chrome.runtime.getURL("icons/Fruit_color.png");

  const btn = document.createElement("button");
  btn.id = "veterex-track-series";

  // Create icon
  const icon = document.createElement("img");
  icon.src = fruitIconUrl;
  icon.alt = "Track";
  icon.style.cssText = "width: 20px; height: 20px;";

  // Create label
  const label = document.createElement("span");
  label.textContent = "Track Series";
  label.style.fontWeight = "600";

  btn.appendChild(icon);
  btn.appendChild(label);

  // Button styles
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 8px;
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    padding: 12px 20px;
    border-radius: 12px;
    border: none;
    color: #fff;
    background: linear-gradient(139.84deg, #FF6D75 50%, #9C86FF 96.42%);
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(255, 109, 117, 0.35);
    font-family: Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    transform: translateX(140%);
    transition: transform 300ms ease-out, box-shadow 200ms ease;
  `;

  // Click handler
  btn.onclick = () => {
    console.log("[VeTerex] Track Series button clicked");

    const chapterInfo = getChapterInfo();
    const entry: SeriesEntry = {
      id: `series-${Date.now()}`,
      title: title,
      url: window.location.href,
      currentChapter: chapterInfo?.chapter || "",
      status: "Reading",
    };

    console.log("[VeTerex] Adding series entry:", entry);
    saveSeriesBookmark(entry);
  };

  document.body.appendChild(btn);

  // Slide in animation
  requestAnimationFrame(() => {
    btn.style.transform = "translateX(0)";
  });

  // Hover effects
  btn.onmouseenter = () => {
    btn.style.boxShadow = "0 12px 28px rgba(255, 109, 117, 0.45)";
    btn.style.transform = "translateY(-2px)";
  };
  btn.onmouseleave = () => {
    btn.style.boxShadow = "0 8px 24px rgba(255, 109, 117, 0.35)";
    btn.style.transform = "translateY(0)";
  };

  return btn;
}

/**
 * Save a series bookmark to storage
 */
function saveSeriesBookmark(entry: SeriesEntry): void {
  // Try to save via background script first
  try {
    chrome.runtime.sendMessage(
      { type: "ADD_SERIES_BOOKMARK", data: entry },
      (response) => {
        console.log(
          "[VeTerex] Message response:",
          response,
          "lastError:",
          chrome.runtime.lastError
        );

        if (chrome.runtime.lastError) {
          console.log(
            "[VeTerex] Background message failed, saving directly to storage"
          );
          saveDirectlyToStorage(entry);
        } else {
          console.log("[VeTerex] Series saved via background");
          showSuccessToast("✓ Series added to tracking");
        }
      }
    );
  } catch (error) {
    console.error("[VeTerex] sendMessage error:", error);
    saveDirectlyToStorage(entry);
  }
}

/**
 * Fallback: Save series directly to chrome.storage
 */
function saveDirectlyToStorage(entry: SeriesEntry): void {
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.local.get(["seriesBookmarks"], (result) => {
      const list = result.seriesBookmarks || [];
      const updatedEntry = {
        ...entry,
        lastChecked: new Date().toISOString(),
        hasUpdate: false,
      };
      chrome.storage.local.set(
        { seriesBookmarks: [...list, updatedEntry] },
        () => {
          if (chrome.runtime.lastError) {
            console.error("[VeTerex] Storage error:", chrome.runtime.lastError);
            showErrorToast("Failed to add series");
          } else {
            console.log("[VeTerex] Series saved to storage");
            showSuccessToast("✓ Series added to tracking");
          }
        }
      );
    });
  } else {
    showErrorToast("Failed to add series");
  }
}

/**
 * Remove the Track Series button from the page
 */
export function removeTrackSeriesButton(): void {
  const btn = document.getElementById("veterex-track-series");
  if (btn) btn.remove();
}
