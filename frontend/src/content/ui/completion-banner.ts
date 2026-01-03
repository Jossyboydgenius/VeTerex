/**
 * VeTerex Completion Banner
 * Banner shown when media completion is detected
 */

import { injectStyles } from "./styles";

interface MediaInfo {
  platform: string;
  type: string;
  title: string;
  url: string;
  progress?: number;
  duration?: number;
  thumbnail?: string;
  timestamp?: number;
}

interface BannerConfig {
  mediaInfo: MediaInfo;
  watchTime?: number;
  onMint?: () => void;
  onDismiss?: () => void;
}

/**
 * Generate the completion banner HTML
 */
function generateBannerHTML(
  mediaInfo: MediaInfo,
  giftboxIconUrl: string,
  veryCoinIconUrl: string
): string {
  return `
    <style>
      #veterex-completion-banner {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid rgba(255, 109, 117, 0.3);
        border-radius: 16px;
        padding: 20px 24px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 109, 117, 0.15);
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        min-width: 340px;
        max-width: 400px;
        animation: veterex-slideIn 0.3s ease-out;
      }
      
      .veterex-banner-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      
      .veterex-banner-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .veterex-banner-icon img {
        width: 48px;
        height: 48px;
      }
      
      .veterex-banner-title {
        color: #FF6D75;
        font-weight: 600;
        font-size: 16px;
        margin: 0;
        font-family: 'Outfit', sans-serif;
      }
      
      .veterex-banner-subtitle {
        color: #a0aec0;
        font-size: 12px;
        margin: 0;
        font-family: 'Outfit', sans-serif;
      }
      
      .veterex-banner-media {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .veterex-banner-media-title {
        color: white;
        font-weight: 500;
        font-size: 14px;
        margin: 0 0 4px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: 'Outfit', sans-serif;
      }
      
      .veterex-banner-media-type {
        color: #a0aec0;
        font-size: 12px;
        text-transform: capitalize;
        margin: 0;
        font-family: 'Outfit', sans-serif;
      }
      
      .veterex-banner-buttons {
        display: flex;
        gap: 10px;
      }
      
      .veterex-banner-btn {
        flex: 1;
        padding: 12px 16px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
        font-family: 'Outfit', sans-serif;
      }
      
      .veterex-banner-btn-primary {
        background: linear-gradient(135deg, #FF6D75 0%, #9C86FF 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      
      .veterex-banner-btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 109, 117, 0.4);
      }
      
      .veterex-banner-btn-primary img {
        width: 18px;
        height: 18px;
      }
      
      .veterex-banner-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        color: #a0aec0;
      }
      
      .veterex-banner-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      
      .veterex-banner-close {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        color: #718096;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }
      
      .veterex-banner-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    </style>
    
    <button class="veterex-banner-close" id="veterex-banner-close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
    
    <div class="veterex-banner-header">
      <div class="veterex-banner-icon">
        <img src="${giftboxIconUrl}" alt="Achievement" />
      </div>
      <div>
        <p class="veterex-banner-title">Completion Detected!</p>
        <p class="veterex-banner-subtitle">VeTerex Achievement</p>
      </div>
    </div>
    
    <div class="veterex-banner-media">
      <p class="veterex-banner-media-title">${escapeHtml(mediaInfo.title)}</p>
      <p class="veterex-banner-media-type">${escapeHtml(
        mediaInfo.type
      )} • ${escapeHtml(mediaInfo.platform)}</p>
    </div>
    
    <div class="veterex-banner-buttons">
      <button class="veterex-banner-btn veterex-banner-btn-secondary" id="veterex-banner-later">
        Later
      </button>
      <button class="veterex-banner-btn veterex-banner-btn-primary" id="veterex-mint-btn">
        <img src="${veryCoinIconUrl}" alt="" />
        Mint NFT
      </button>
    </div>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show the completion banner
 */
export function showCompletionBanner(config: BannerConfig): HTMLElement {
  const { mediaInfo, watchTime, onMint, onDismiss } = config;

  injectStyles();

  // Remove existing banner if any
  removeCompletionBanner();

  // Get icon URLs
  const giftboxIconUrl = chrome.runtime.getURL("icons/gift-box.svg");
  const veryCoinIconUrl = chrome.runtime.getURL("icons/very-coin.png");

  // Create banner element
  const banner = document.createElement("div");
  banner.id = "veterex-completion-banner";
  banner.innerHTML = generateBannerHTML(
    mediaInfo,
    giftboxIconUrl,
    veryCoinIconUrl
  );

  document.body.appendChild(banner);

  // Setup event handlers
  const closeBtn = document.getElementById("veterex-banner-close");
  const laterBtn = document.getElementById("veterex-banner-later");
  const mintBtn = document.getElementById("veterex-mint-btn");

  const handleClose = () => {
    banner.remove();
    onDismiss?.();
  };

  closeBtn?.addEventListener("click", handleClose);
  laterBtn?.addEventListener("click", handleClose);

  // Handle mint button click
  if (mintBtn) {
    mintBtn.addEventListener("click", () => {
      console.log("[VeTerex] Mint button clicked, opening web app...");

      // Store pending mint data
      const mintData = {
        ...mediaInfo,
        watchTime: watchTime || 0,
      };

      try {
        chrome.runtime.sendMessage({
          type: "PENDING_MINT",
          data: mintData,
        });
      } catch (e) {
        console.log("[VeTerex] Could not save pending mint:", e);
      }

      // Open web app with mint data
      const data = encodeURIComponent(JSON.stringify(mintData));
      const webUrl = `http://localhost:5173/#/mint?data=${data}`;
      window.open(webUrl, "_blank");

      banner.remove();
      onMint?.();
    });
  }

  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (document.getElementById("veterex-completion-banner")) {
      banner.remove();
    }
  }, 30000);

  return banner;
}

/**
 * Remove the completion banner from the page
 */
export function removeCompletionBanner(): void {
  const banner = document.getElementById("veterex-completion-banner");
  if (banner) banner.remove();
}
