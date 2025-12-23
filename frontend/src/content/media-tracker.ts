/**
 * VeTerex Media Tracker Content Script
 * Tracks media consumption across supported platforms
 */

// Supported platforms for tracking
const SUPPORTED_PLATFORMS = {
  // Video streaming
  netflix: {
    patterns: ["netflix.com"],
    type: "tvshow",
    selectors: {
      title: '[data-uia="video-title"]',
      progress: ".watch-video--progress-bar",
    },
  },
  youtube: {
    patterns: ["youtube.com/watch"],
    type: "video",
    selectors: {
      title: "h1.ytd-video-primary-info-renderer",
      progress: ".ytp-progress-bar",
    },
  },
  primevideo: {
    patterns: ["primevideo.com", "amazon.com/gp/video"],
    type: "movie",
    selectors: {
      title: '[data-automation-id="title"]',
      progress: ".atvwebplayersdk-progress-bar",
    },
  },
  disneyplus: {
    patterns: ["disneyplus.com"],
    type: "movie",
    selectors: {
      title: '[data-testid="title"]',
      progress: ".progress-bar",
    },
  },
  hulu: {
    patterns: ["hulu.com/watch"],
    type: "tvshow",
    selectors: {
      title: ".metadata__title",
      progress: ".progress-bar",
    },
  },
  crunchyroll: {
    patterns: ["crunchyroll.com/watch"],
    type: "anime",
    selectors: {
      title: '[data-testid="vilos-title"]',
      progress: ".vjs-progress-holder",
    },
  },
  // Reading platforms
  goodreads: {
    patterns: ["goodreads.com/book"],
    type: "book",
    selectors: {
      title: "#bookTitle",
      author: ".authorName",
      progress: ".progress",
    },
  },
  kindle: {
    patterns: ["read.amazon.com"],
    type: "book",
    selectors: {
      title: "#book-title",
      progress: "#kindleReader_progress",
    },
  },
  mangadex: {
    patterns: ["mangadex.org/chapter"],
    type: "manga",
    selectors: {
      title: ".manga-title",
      progress: ".chapter-progress",
    },
  },
  // Anime tracking sites
  myanimelist: {
    patterns: ["myanimelist.net/anime"],
    type: "anime",
    selectors: {
      title: ".title-name",
      episodes: ".di-ib",
    },
  },
  anilist: {
    patterns: ["anilist.co/anime"],
    type: "anime",
    selectors: {
      title: ".content h1",
      episodes: ".data-set",
    },
  },
};

interface MediaInfo {
  platform: string;
  type: string;
  title: string;
  url: string;
  progress?: number;
  duration?: number;
  timestamp: number;
}

interface TrackingSession {
  mediaInfo: MediaInfo;
  startTime: number;
  lastUpdate: number;
  watchTime: number;
  completed: boolean;
}

// Current tracking session
let currentSession: TrackingSession | null = null;
let trackingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Detect which platform the user is currently on
 */
function detectPlatform(): {
  name: string;
  config: (typeof SUPPORTED_PLATFORMS)[keyof typeof SUPPORTED_PLATFORMS];
} | null {
  const url = window.location.href;

  for (const [name, config] of Object.entries(SUPPORTED_PLATFORMS)) {
    if (config.patterns.some((pattern) => url.includes(pattern))) {
      return { name, config };
    }
  }

  return null;
}

/**
 * Extract media information from the current page
 */
function extractMediaInfo(): MediaInfo | null {
  const platform = detectPlatform();
  if (!platform) return null;

  const { name, config } = platform;

  try {
    const titleElement = document.querySelector(config.selectors.title);
    if (!titleElement) return null;

    const title = titleElement.textContent?.trim() || "Unknown Title";

    // Try to get progress if available
    let progress = 0;
    const selectors = config.selectors as { progress?: string };
    if (selectors.progress) {
      const progressElement = document.querySelector(
        selectors.progress
      ) as HTMLElement;
      if (progressElement) {
        // Try various ways to get progress
        const style = progressElement.getAttribute("style");
        if (style) {
          const match = style.match(/width:\s*(\d+(?:\.\d+)?)%/);
          if (match) progress = parseFloat(match[1]);
        }

        // For video elements
        const video = document.querySelector("video");
        if (video && video.duration) {
          progress = (video.currentTime / video.duration) * 100;
        }
      }
    }

    return {
      platform: name,
      type: config.type,
      title,
      url: window.location.href,
      progress,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("[VeTerex] Failed to extract media info:", error);
    return null;
  }
}

/**
 * Start tracking media consumption
 */
function startTracking() {
  const mediaInfo = extractMediaInfo();
  if (!mediaInfo) return;

  console.log("[VeTerex] Starting media tracking:", mediaInfo);

  currentSession = {
    mediaInfo,
    startTime: Date.now(),
    lastUpdate: Date.now(),
    watchTime: 0,
    completed: false,
  };

  // Send tracking start message to background
  chrome.runtime.sendMessage({
    type: "TRACKING_START",
    data: currentSession,
  });

  // Update tracking every 30 seconds
  trackingInterval = setInterval(updateTracking, 30000);
}

/**
 * Update tracking progress
 */
function updateTracking() {
  if (!currentSession) return;

  const mediaInfo = extractMediaInfo();
  if (!mediaInfo) return;

  const now = Date.now();
  currentSession.watchTime += (now - currentSession.lastUpdate) / 1000;
  currentSession.lastUpdate = now;
  currentSession.mediaInfo.progress = mediaInfo.progress;

  // Check if completed (>90% progress)
  if (
    mediaInfo.progress &&
    mediaInfo.progress >= 90 &&
    !currentSession.completed
  ) {
    currentSession.completed = true;
    notifyCompletion(currentSession);
  }

  // Send progress update
  chrome.runtime.sendMessage({
    type: "TRACKING_UPDATE",
    data: currentSession,
  });
}

/**
 * Stop tracking
 */
function stopTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }

  if (currentSession) {
    // Final update
    updateTracking();

    // Send tracking end message
    chrome.runtime.sendMessage({
      type: "TRACKING_END",
      data: currentSession,
    });

    currentSession = null;
  }
}

/**
 * Notify user of completion
 */
function notifyCompletion(session: TrackingSession) {
  console.log("[VeTerex] Media completed!", session);

  // Send completion notification
  chrome.runtime.sendMessage({
    type: "MEDIA_COMPLETED",
    data: {
      ...session.mediaInfo,
      watchTime: session.watchTime,
    },
  });

  // Show notification badge
  showCompletionBanner(session.mediaInfo);
}

/**
 * Show a banner to the user offering to mint NFT
 */
function showCompletionBanner(mediaInfo: MediaInfo) {
  // Remove existing banner if any
  const existingBanner = document.getElementById("veterex-completion-banner");
  if (existingBanner) existingBanner.remove();

  const banner = document.createElement("div");
  banner.id = "veterex-completion-banner";
  banner.innerHTML = `
    <style>
      #veterex-completion-banner {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 1px solid #4a5568;
        border-radius: 16px;
        padding: 16px 20px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 320px;
        animation: slideIn 0.3s ease-out;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .veterex-banner-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      
      .veterex-banner-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .veterex-banner-icon svg {
        width: 24px;
        height: 24px;
        fill: white;
      }
      
      .veterex-banner-title {
        color: #00d4ff;
        font-weight: 600;
        font-size: 14px;
        margin: 0;
      }
      
      .veterex-banner-subtitle {
        color: #a0aec0;
        font-size: 12px;
        margin: 0;
      }
      
      .veterex-banner-media {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 10px;
        margin-bottom: 12px;
      }
      
      .veterex-banner-media-title {
        color: white;
        font-weight: 500;
        font-size: 13px;
        margin: 0 0 4px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .veterex-banner-media-type {
        color: #a0aec0;
        font-size: 11px;
        text-transform: capitalize;
        margin: 0;
      }
      
      .veterex-banner-buttons {
        display: flex;
        gap: 8px;
      }
      
      .veterex-banner-btn {
        flex: 1;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }
      
      .veterex-banner-btn-primary {
        background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
        color: white;
      }
      
      .veterex-banner-btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
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
    
    <button class="veterex-banner-close" onclick="this.parentElement.remove()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
    
    <div class="veterex-banner-header">
      <div class="veterex-banner-icon">
        <svg viewBox="0 0 24 24">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      </div>
      <div>
        <p class="veterex-banner-title">Completion Detected!</p>
        <p class="veterex-banner-subtitle">VeTerex Achievement</p>
      </div>
    </div>
    
    <div class="veterex-banner-media">
      <p class="veterex-banner-media-title">${mediaInfo.title}</p>
      <p class="veterex-banner-media-type">${mediaInfo.type} • ${mediaInfo.platform}</p>
    </div>
    
    <div class="veterex-banner-buttons">
      <button class="veterex-banner-btn veterex-banner-btn-secondary" onclick="this.closest('#veterex-completion-banner').remove()">
        Later
      </button>
      <button class="veterex-banner-btn veterex-banner-btn-primary" id="veterex-mint-btn">
        Mint NFT 🏆
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  // Handle mint button click
  const mintBtn = document.getElementById("veterex-mint-btn");
  if (mintBtn) {
    mintBtn.addEventListener("click", () => {
      // Store completion data and open extension
      chrome.runtime.sendMessage({
        type: "OPEN_MINT_MODAL",
        data: mediaInfo,
      });
      banner.remove();
    });
  }

  // Auto-remove after 30 seconds
  setTimeout(() => {
    if (document.getElementById("veterex-completion-banner")) {
      banner.remove();
    }
  }, 30000);
}

/**
 * Initialize content script
 */
function init() {
  const platform = detectPlatform();
  if (!platform) {
    console.log("[VeTerex] Not a supported platform");
    return;
  }

  console.log("[VeTerex] Content script initialized on:", platform.name);

  // Start tracking when video/content loads
  let initTimeout: ReturnType<typeof setTimeout>;

  const observer = new MutationObserver(() => {
    // Debounce initialization
    clearTimeout(initTimeout);
    initTimeout = setTimeout(() => {
      if (!currentSession) {
        startTracking();
      }
    }, 2000);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Stop tracking when page is unloaded
  window.addEventListener("beforeunload", stopTracking);

  // Handle visibility changes
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopTracking();
    } else if (detectPlatform()) {
      startTracking();
    }
  });

  // Initial check
  setTimeout(() => {
    if (!currentSession) {
      startTracking();
    }
  }, 3000);
}

// Start initialization
init();
